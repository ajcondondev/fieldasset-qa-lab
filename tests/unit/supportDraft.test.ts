import { describe, expect, it } from "vitest";
import { parseAssetCsv } from "../../src/domain/csv";
import { draftSupportReply } from "../../src/domain/supportDraft";
import brokenFixture from "../../src/test-fixtures/broken-panel-schedule.csv?raw";
import validFixture from "../../src/test-fixtures/valid-assets.csv?raw";

describe("draftSupportReply", () => {
  it("summarizes a failed import with every row-level reason", () => {
    const result = parseAssetCsv(brokenFixture);
    const draft = draftSupportReply("broken-panel-schedule.csv", result);
    expect(draft).toContain("2 of 7 rows imported successfully");
    expect(draft).toContain("5 row(s) could not be imported");
    expect(draft).toContain("Row 5 (status)");
    expect(draft).toContain("None of your data was changed or lost");
  });

  it("writes a clean confirmation when everything imports", () => {
    const result = parseAssetCsv(validFixture);
    const draft = draftSupportReply("valid-assets.csv", result);
    expect(draft).toContain("5 of 5 rows imported successfully");
    expect(draft).toContain("Everything is in.");
    expect(draft).not.toContain("could not be imported");
  });

  it("is deterministic for identical input", () => {
    const result = parseAssetCsv(brokenFixture);
    expect(draftSupportReply("x.csv", result)).toBe(draftSupportReply("x.csv", result));
  });
});
