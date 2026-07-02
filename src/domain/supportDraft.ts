import type { ImportResult } from "./types";

/**
 * Drafts a customer-facing reply from an import result.
 *
 * This is a deterministic simulation of the place an LLM would sit in a real
 * support workflow: it turns structured diagnostics into a plain-language
 * first draft. The guardrail is identical either way — the draft is editable
 * and must be explicitly marked as reviewed by a human before it can be
 * copied. Keeping it deterministic here means the demo (and its tests) never
 * depend on a network call or a model's mood.
 */
export function draftSupportReply(sourceLabel: string, result: ImportResult): string {
  const lines: string[] = [];
  lines.push(`Hi,`);
  lines.push("");
  lines.push(
    `Thanks for sending over ${sourceLabel}. We ran it through the importer and here is exactly what happened:`,
  );
  lines.push("");
  lines.push(
    `- ${result.acceptedRows} of ${result.totalRows} rows imported successfully.`,
  );
  if (result.rejectedRows > 0) {
    lines.push(`- ${result.rejectedRows} row(s) could not be imported:`);
    for (const error of result.errors) {
      lines.push(`    - Row ${error.rowNumber} (${error.field}): ${error.message}`);
    }
  }
  if (result.warnings.length > 0) {
    lines.push(`- ${result.warnings.length} row(s) imported with warnings:`);
    for (const warning of result.warnings) {
      lines.push(`    - Row ${warning.rowNumber} (${warning.field}): ${warning.message}`);
    }
  }
  lines.push("");
  if (result.rejectedRows > 0) {
    lines.push(
      "None of your data was changed or lost — the rejected rows are simply waiting on the corrections above. If you can update those rows and re-import just that file, everything else will fall into place. We're happy to hop on a call and fix them together.",
    );
  } else {
    lines.push("Everything is in. Please spot-check the asset list against your records and let us know if anything looks off.");
  }
  lines.push("");
  lines.push("Best,");
  lines.push("Support Engineering");
  return lines.join("\n");
}
