import { describe, expect, it } from "vitest";
import { parseAssetCsv, splitCsvLine, suggestNextActions } from "../../src/domain/csv";
import validFixture from "../../src/test-fixtures/valid-assets.csv?raw";
import brokenFixture from "../../src/test-fixtures/broken-panel-schedule.csv?raw";
import criticalFixture from "../../src/test-fixtures/critical-assets.csv?raw";

const HEADER = "assetName,type,location,status,parentAssetName,lastInspectionDate,notes";

describe("splitCsvLine", () => {
  it("splits plain comma-separated cells", () => {
    expect(splitCsvLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("keeps commas inside double-quoted cells", () => {
    expect(splitCsvLine('Panel A,panel,"Room 1, east wall",ok')).toEqual([
      "Panel A",
      "panel",
      "Room 1, east wall",
      "ok",
    ]);
  });

  it("unescapes doubled quotes inside quoted cells", () => {
    expect(splitCsvLine('"He said ""ok""",x')).toEqual(['He said "ok"', "x"]);
  });
});

describe("parseAssetCsv — committed fixtures", () => {
  it("accepts every row of the valid fixture", () => {
    const result = parseAssetCsv(validFixture);
    expect(result.totalRows).toBe(5);
    expect(result.acceptedRows).toBe(5);
    expect(result.rejectedRows).toBe(0);
    expect(result.errors).toEqual([]);
  });

  it("produces the expected diagnostics for the broken customer-like fixture", () => {
    const result = parseAssetCsv(brokenFixture);
    expect(result.totalRows).toBe(7);
    // Rejected: missing name (row 2), unknown type "xfmr" (row 3),
    // missing location (row 4), status typo "criticl" (row 5), duplicate "Panel D" (row 7).
    expect(result.rejectedRows).toBe(5);
    // Accepted: whitespace/caps row normalizes (row 6), bad-date row imports with a warning (row 8).
    expect(result.acceptedRows).toBe(2);
    expect(result.errors.map((e) => [e.rowNumber, e.field])).toEqual([
      [2, "assetName"],
      [3, "type"],
      [4, "location"],
      [5, "status"],
      [7, "assetName"],
    ]);
  });

  it("imports critical and needs-review assets from the critical fixture", () => {
    const result = parseAssetCsv(criticalFixture);
    expect(result.acceptedRows).toBe(3);
    expect(result.accepted.map((a) => a.status)).toEqual(["critical", "needs-review", "ok"]);
  });
});

describe("parseAssetCsv — validation rules", () => {
  it("rejects a row with a missing required field and reports the row number", () => {
    const result = parseAssetCsv(`${HEADER}\n,panel,Room 1,ok,,,`);
    expect(result.rejectedRows).toBe(1);
    expect(result.errors[0]).toMatchObject({ rowNumber: 2, field: "assetName" });
  });

  it("rejects unknown asset types with a plain-language message", () => {
    const result = parseAssetCsv(`${HEADER}\nThing,widget,Room 1,ok,,,`);
    expect(result.errors[0].field).toBe("type");
    expect(result.errors[0].message).toContain("not a recognized asset type");
  });

  it("suggests the closest valid value for near-miss typos", () => {
    const result = parseAssetCsv(`${HEADER}\nThing,panel,Room 1,criticl,,,`);
    expect(result.errors[0].message).toContain('Did you mean "critical"?');
  });

  it("normalizes casing and trims whitespace on accepted rows", () => {
    const result = parseAssetCsv(`${HEADER}\n  Panel Z  ,  PANEL ,  Room 9 , OK ,,,`);
    expect(result.acceptedRows).toBe(1);
    expect(result.accepted[0]).toMatchObject({
      name: "Panel Z",
      type: "panel",
      location: "Room 9",
      status: "ok",
    });
  });

  it("rejects duplicate names within the same file (case-insensitive)", () => {
    const result = parseAssetCsv(`${HEADER}\nPanel Z,panel,Room 9,ok,,,\npanel z,panel,Room 9,ok,,,`);
    expect(result.acceptedRows).toBe(1);
    expect(result.errors[0]).toMatchObject({ rowNumber: 3, field: "assetName" });
    expect(result.errors[0].message).toContain("appears more than once");
  });

  it("rejects names that already exist in the facility", () => {
    const result = parseAssetCsv(`${HEADER}\nPanel A,panel,Room 9,ok,,,`, {
      existingAssetNames: ["Panel A"],
    });
    expect(result.rejectedRows).toBe(1);
    expect(result.errors[0].message).toContain("already exists in this facility");
  });

  it("separates warnings from errors: bad dates warn but the row still imports", () => {
    const result = parseAssetCsv(`${HEADER}\nPanel Z,panel,Room 9,ok,,05/10/2024,`);
    expect(result.acceptedRows).toBe(1);
    expect(result.errors).toEqual([]);
    expect(result.warnings[0]).toMatchObject({ rowNumber: 2, field: "lastInspectionDate" });
    expect(result.accepted[0].lastInspectionDate).toBeUndefined();
  });

  it("rejects rows with more cells than the header, hinting at unquoted commas", () => {
    const result = parseAssetCsv(`${HEADER}\nPanel Z,panel,Room 9, east wall,ok,,,`);
    expect(result.rejectedRows).toBe(1);
    expect(result.errors.some((e) => e.field === "row")).toBe(true);
  });

  it("fails fast with a header error when required columns are missing", () => {
    const result = parseAssetCsv("assetName,location\nPanel Z,Room 9");
    expect(result.errors[0]).toMatchObject({ rowNumber: 1, field: "header" });
    expect(result.errors[0].message).toContain("type");
  });

  it("handles empty input without crashing", () => {
    const result = parseAssetCsv("   \n  ");
    expect(result.totalRows).toBe(0);
    expect(result.errors[0].field).toBe("header");
  });

  it("accepts a header in any casing", () => {
    const result = parseAssetCsv(`ASSETNAME,Type,Location,STATUS\nPanel Z,panel,Room 9,ok`);
    expect(result.acceptedRows).toBe(1);
  });

  it("keeps commas inside quoted notes", () => {
    const result = parseAssetCsv(`${HEADER}\nPanel Z,panel,Room 9,ok,,2025-01-01,"Feeds rooms 1, 2, and 3"`);
    expect(result.acceptedRows).toBe(1);
    expect(result.accepted[0].notes).toBe("Feeds rooms 1, 2, and 3");
  });

  it("is deterministic: same input produces identical output", () => {
    expect(parseAssetCsv(brokenFixture)).toEqual(parseAssetCsv(brokenFixture));
  });
});

describe("suggestNextActions", () => {
  it("suggests support actions matched to the failure categories", () => {
    const result = parseAssetCsv(brokenFixture);
    const actions = suggestNextActions(result);
    expect(actions.join(" ")).toContain("duplicate");
    expect(actions.join(" ")).toContain("asset types");
    expect(actions.join(" ")).toContain("status typos");
  });
});
