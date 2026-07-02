import type { ElectricalAsset, Facility } from "./types";

export type FacilityReport = {
  facilityName: string;
  customerName: string;
  facilityStatus: Facility["status"];
  generatedAt: string;
  totalAssets: number;
  countsByStatus: { ok: number; "needs-review": number; critical: number };
  criticalAssets: { name: string; type: string; location: string }[];
  needsReviewAssets: { name: string; type: string; location: string }[];
  missingInspectionDate: { name: string; type: string; location: string }[];
};

/**
 * Builds a facility report. `now` is injected instead of read from the clock
 * so report output is fully deterministic under test.
 */
export function buildFacilityReport(
  facility: Facility,
  assets: ElectricalAsset[],
  now: Date,
): FacilityReport {
  const facilityAssets = assets.filter((a) => a.facilityId === facility.id);
  const pick = (a: ElectricalAsset) => ({ name: a.name, type: a.type, location: a.location });
  return {
    facilityName: facility.name,
    customerName: facility.customerName,
    facilityStatus: facility.status,
    generatedAt: now.toISOString(),
    totalAssets: facilityAssets.length,
    countsByStatus: {
      ok: facilityAssets.filter((a) => a.status === "ok").length,
      "needs-review": facilityAssets.filter((a) => a.status === "needs-review").length,
      critical: facilityAssets.filter((a) => a.status === "critical").length,
    },
    criticalAssets: facilityAssets.filter((a) => a.status === "critical").map(pick),
    needsReviewAssets: facilityAssets.filter((a) => a.status === "needs-review").map(pick),
    missingInspectionDate: facilityAssets.filter((a) => !a.lastInspectionDate).map(pick),
  };
}

export function reportAsText(report: FacilityReport): string {
  const section = (title: string, rows: { name: string; type: string; location: string }[]) =>
    rows.length === 0
      ? `${title}: none`
      : `${title}:\n${rows.map((r) => `  - ${r.name} (${r.type}) — ${r.location}`).join("\n")}`;
  return [
    `Facility Report — ${report.facilityName}`,
    `Customer: ${report.customerName}`,
    `Generated: ${report.generatedAt}`,
    `Total assets: ${report.totalAssets}`,
    `Status counts: ok=${report.countsByStatus.ok}, needs-review=${report.countsByStatus["needs-review"]}, critical=${report.countsByStatus.critical}`,
    section("Critical assets", report.criticalAssets),
    section("Needs review", report.needsReviewAssets),
    section("Missing inspection date", report.missingInspectionDate),
  ].join("\n");
}
