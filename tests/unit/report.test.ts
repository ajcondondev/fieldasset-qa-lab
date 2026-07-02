import { describe, expect, it } from "vitest";
import { buildFacilityReport, reportAsText } from "../../src/domain/report";
import type { ElectricalAsset, Facility } from "../../src/domain/types";

const facility: Facility = {
  id: "fac-1",
  name: "Test Facility",
  address: "1 Test St",
  customerName: "Test Customer",
  status: "active",
};

const asset = (overrides: Partial<ElectricalAsset>): ElectricalAsset => ({
  id: "a1",
  facilityId: "fac-1",
  name: "Asset",
  type: "panel",
  location: "Room 1",
  status: "ok",
  history: [],
  ...overrides,
});

const NOW = new Date("2026-07-01T12:00:00.000Z");

describe("buildFacilityReport", () => {
  it("counts assets by status and lists critical assets", () => {
    const assets = [
      asset({ id: "a1", name: "Panel A", status: "ok", lastInspectionDate: "2025-01-01" }),
      asset({ id: "a2", name: "Breaker 12", status: "critical", lastInspectionDate: "2025-01-01" }),
      asset({ id: "a3", name: "Panel B", status: "needs-review" }),
    ];
    const report = buildFacilityReport(facility, assets, NOW);
    expect(report.totalAssets).toBe(3);
    expect(report.countsByStatus).toEqual({ ok: 1, "needs-review": 1, critical: 1 });
    expect(report.criticalAssets.map((a) => a.name)).toEqual(["Breaker 12"]);
    expect(report.missingInspectionDate.map((a) => a.name)).toEqual(["Panel B"]);
    expect(report.generatedAt).toBe("2026-07-01T12:00:00.000Z");
  });

  it("only includes assets belonging to the facility", () => {
    const assets = [
      asset({ id: "a1", facilityId: "fac-1" }),
      asset({ id: "a2", facilityId: "fac-other" }),
    ];
    expect(buildFacilityReport(facility, assets, NOW).totalAssets).toBe(1);
  });

  it("renders a stable text export", () => {
    const assets = [asset({ id: "a1", name: "Breaker 12", status: "critical", lastInspectionDate: "2025-01-01" })];
    const text = reportAsText(buildFacilityReport(facility, assets, NOW));
    expect(text).toContain("Facility Report — Test Facility");
    expect(text).toContain("critical=1");
    expect(text).toContain("- Breaker 12 (panel) — Room 1");
  });
});
