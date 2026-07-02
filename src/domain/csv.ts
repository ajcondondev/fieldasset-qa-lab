import {
  ASSET_STATUSES,
  ASSET_TYPES,
  type AssetStatus,
  type AssetType,
  type ImportError,
  type ImportResult,
  type ImportWarning,
  type ParsedAssetRow,
} from "./types";

export const EXPECTED_COLUMNS = [
  "assetName",
  "type",
  "location",
  "status",
  "parentAssetName",
  "lastInspectionDate",
  "notes",
] as const;

const REQUIRED_COLUMNS = ["assetName", "type", "location", "status"] as const;

type ColumnName = (typeof EXPECTED_COLUMNS)[number];

/**
 * Splits one CSV line into cells. Supports double-quoted cells so notes can
 * contain commas ("Feeder for panels A, B"). Doubled quotes inside a quoted
 * cell ("") unescape to a single quote.
 */
export function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

/** Levenshtein distance, used only to power "did you mean …?" hints. */
function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[rows - 1][cols - 1];
}

function suggestClosest(value: string, allowed: readonly string[]): string | undefined {
  let best: string | undefined;
  let bestDistance = 3; // only suggest when the typo is close (distance <= 2)
  for (const candidate of allowed) {
    const distance = editDistance(value, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export type ParseCsvOptions = {
  /** Asset names that already exist in the target facility (duplicate check). */
  existingAssetNames?: string[];
};

/**
 * Parses and validates pasted asset CSV. Pure and deterministic: same input,
 * same output — no clock, randomness, or I/O — so every customer file can be
 * replayed as a fixture in unit tests.
 *
 * Row numbers match what a customer sees in a spreadsheet: the header is
 * row 1, the first data row is row 2. Blank lines keep their row number.
 */
export function parseAssetCsv(csvText: string, options: ParseCsvOptions = {}): ImportResult {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const accepted: ParsedAssetRow[] = [];

  const lines = csvText.replace(/\r\n?/g, "\n").split("\n");

  // Find the header line (first non-blank line).
  let headerLineIndex = 0;
  while (headerLineIndex < lines.length && lines[headerLineIndex].trim() === "") {
    headerLineIndex++;
  }

  if (headerLineIndex >= lines.length) {
    errors.push({
      rowNumber: 1,
      field: "header",
      message: "The pasted text is empty. Expected a header row followed by asset rows.",
    });
    return { totalRows: 0, acceptedRows: 0, rejectedRows: 0, errors, warnings, accepted };
  }

  // Map header cells to known columns (case-insensitive, whitespace-tolerant).
  const headerCells = splitCsvLine(lines[headerLineIndex]).map((c) => c.trim());
  const columnIndex = new Map<ColumnName, number>();
  headerCells.forEach((cell, index) => {
    const match = EXPECTED_COLUMNS.find((col) => col.toLowerCase() === cell.toLowerCase());
    if (match) {
      columnIndex.set(match, index);
    } else if (cell !== "") {
      warnings.push({
        rowNumber: headerLineIndex + 1,
        field: "header",
        message: `Column "${cell}" is not recognized and will be ignored.`,
        rawValue: cell,
      });
    }
  });

  const missingColumns = REQUIRED_COLUMNS.filter((col) => !columnIndex.has(col));
  if (missingColumns.length > 0) {
    errors.push({
      rowNumber: headerLineIndex + 1,
      field: "header",
      message: `Missing required column(s): ${missingColumns.join(", ")}. Expected header: ${EXPECTED_COLUMNS.join(",")}.`,
      rawValue: lines[headerLineIndex],
    });
    return { totalRows: 0, acceptedRows: 0, rejectedRows: 0, errors, warnings, accepted };
  }

  const existingNames = new Set(
    (options.existingAssetNames ?? []).map((n) => n.trim().toLowerCase()),
  );
  const namesSeenInFile = new Set<string>();
  let totalRows = 0;

  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;
    totalRows++;
    const rowNumber = i + 1;
    const cells = splitCsvLine(line);
    const rowErrors: ImportError[] = [];

    if (cells.length > headerCells.length) {
      rowErrors.push({
        rowNumber,
        field: "row",
        message: `Row has ${cells.length} columns but the header has ${headerCells.length}. A value with a comma may need double quotes.`,
        rawValue: line,
      });
    }

    const cell = (col: ColumnName): string => {
      const index = columnIndex.get(col);
      return index === undefined ? "" : (cells[index] ?? "").trim();
    };

    const name = cell("assetName");
    if (name === "") {
      rowErrors.push({
        rowNumber,
        field: "assetName",
        message: "Asset name is required. This row cannot be imported without one.",
      });
    }

    const rawType = cell("type");
    let type: AssetType | undefined;
    if (rawType === "") {
      rowErrors.push({ rowNumber, field: "type", message: "Asset type is required." });
    } else {
      const normalized = rawType.toLowerCase();
      if ((ASSET_TYPES as readonly string[]).includes(normalized)) {
        type = normalized as AssetType;
      } else {
        const suggestion = suggestClosest(normalized, ASSET_TYPES);
        rowErrors.push({
          rowNumber,
          field: "type",
          message:
            `"${rawType}" is not a recognized asset type.` +
            (suggestion ? ` Did you mean "${suggestion}"?` : "") +
            ` Valid types: ${ASSET_TYPES.join(", ")}.`,
          rawValue: rawType,
        });
      }
    }

    const location = cell("location");
    if (location === "") {
      rowErrors.push({
        rowNumber,
        field: "location",
        message: "Location is required so field technicians can find the asset.",
      });
    }

    const rawStatus = cell("status");
    let status: AssetStatus | undefined;
    if (rawStatus === "") {
      rowErrors.push({ rowNumber, field: "status", message: "Status is required." });
    } else {
      const normalized = rawStatus.toLowerCase();
      if ((ASSET_STATUSES as readonly string[]).includes(normalized)) {
        status = normalized as AssetStatus;
      } else {
        const suggestion = suggestClosest(normalized, ASSET_STATUSES);
        rowErrors.push({
          rowNumber,
          field: "status",
          message:
            `"${rawStatus}" is not a recognized status.` +
            (suggestion ? ` Did you mean "${suggestion}"?` : "") +
            ` Valid statuses: ${ASSET_STATUSES.join(", ")}.`,
          rawValue: rawStatus,
        });
      }
    }

    if (name !== "") {
      const nameKey = name.toLowerCase();
      if (existingNames.has(nameKey)) {
        rowErrors.push({
          rowNumber,
          field: "assetName",
          message: `An asset named "${name}" already exists in this facility. Rename it or update the existing asset instead.`,
          rawValue: name,
        });
      } else if (namesSeenInFile.has(nameKey)) {
        rowErrors.push({
          rowNumber,
          field: "assetName",
          message: `"${name}" appears more than once in this file. Only the first occurrence can be imported.`,
          rawValue: name,
        });
      }
    }

    const rawDate = cell("lastInspectionDate");
    let lastInspectionDate: string | undefined;
    if (rawDate === "") {
      warnings.push({
        rowNumber,
        field: "lastInspectionDate",
        message: "No inspection date. The asset will import but will be flagged in reports.",
      });
    } else if (isRealDate(rawDate)) {
      lastInspectionDate = rawDate;
    } else {
      warnings.push({
        rowNumber,
        field: "lastInspectionDate",
        message: `"${rawDate}" is not a valid date (expected YYYY-MM-DD). The date was left blank.`,
        rawValue: rawDate,
      });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      continue;
    }

    namesSeenInFile.add(name.toLowerCase());
    const parentAssetName = cell("parentAssetName");
    const notes = cell("notes");
    accepted.push({
      rowNumber,
      name,
      type: type as AssetType,
      location,
      status: status as AssetStatus,
      parentAssetName: parentAssetName === "" ? undefined : parentAssetName,
      lastInspectionDate,
      notes: notes === "" ? undefined : notes,
    });
  }

  if (totalRows === 0) {
    errors.push({
      rowNumber: headerLineIndex + 1,
      field: "header",
      message: "The file has a header but no data rows.",
    });
  }

  return {
    totalRows,
    acceptedRows: accepted.length,
    rejectedRows: totalRows - accepted.length,
    errors,
    warnings,
    accepted,
  };
}

/**
 * Plain-language next actions for the diagnostics panel, derived from the
 * kinds of issues found. This is the "what do I tell the customer" layer.
 */
export function suggestNextActions(result: ImportResult): string[] {
  const actions: string[] = [];
  const errorFields = new Set(result.errors.map((e) => e.field));
  if (errorFields.has("header")) {
    actions.push("Check the header row: it must include assetName, type, location, and status.");
  }
  if (result.errors.some((e) => e.field === "assetName" && e.message.includes("required"))) {
    actions.push("Fill in the missing asset names, then re-import only the rejected rows.");
  }
  if (result.errors.some((e) => e.field === "assetName" && !e.message.includes("required"))) {
    actions.push("Resolve duplicate asset names — rename the new row or update the existing asset.");
  }
  if (errorFields.has("type")) {
    actions.push("Confirm unrecognized asset types with the customer before changing their data.");
  }
  if (errorFields.has("status")) {
    actions.push("Correct status typos using: ok, needs-review, critical.");
  }
  if (errorFields.has("location")) {
    actions.push("Add a location for each rejected row so technicians can find the asset.");
  }
  if (errorFields.has("row")) {
    actions.push("Wrap values that contain commas in double quotes, then re-import.");
  }
  if (result.warnings.some((w) => w.field === "lastInspectionDate")) {
    actions.push("Review inspection-date warnings — assets without a date are flagged in reports.");
  }
  if (result.rejectedRows === 0 && result.errors.length === 0) {
    actions.push("All rows imported. Verify counts against the source spreadsheet before closing the ticket.");
  }
  if (actions.length === 0) {
    actions.push("If this outcome is unexpected, capture the raw CSV as a fixture and add regression coverage.");
  }
  return actions;
}
