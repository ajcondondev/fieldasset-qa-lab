import { useState } from "react";
import { useStore } from "../app/store";
import { buildFacilityReport, reportAsText, type FacilityReport } from "../domain/report";
import type { Facility } from "../domain/types";

function AssetList({ title, tone, rows }: { title: string; tone: "critical" | "warn" | "muted"; rows: FacilityReport["criticalAssets"] }) {
  return (
    <div className={`report-section report-${tone}`}>
      <h4>
        {title} ({rows.length})
      </h4>
      {rows.length === 0 ? (
        <p className="muted small">None</p>
      ) : (
        <ul>
          {rows.map((r) => (
            <li key={r.name}>
              <strong>{r.name}</strong> ({r.type}) — {r.location}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReportPreview({ facility }: { facility: Facility }) {
  const { assets } = useStore();
  const [report, setReport] = useState<FacilityReport | null>(null);
  const [copied, setCopied] = useState(false);

  if (facility.status === "archived") {
    return (
      <div className="card" data-testid="report">
        <h3>Facility report</h3>
        <p className="notice" role="note">
          This facility is archived. Archived facilities are excluded from customer-facing reports.
        </p>
      </div>
    );
  }

  function generate() {
    setReport(buildFacilityReport(facility, assets, new Date()));
    setCopied(false);
  }

  async function copyText() {
    if (!report) return;
    await navigator.clipboard.writeText(reportAsText(report));
    setCopied(true);
  }

  function downloadJson() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${facility.name.toLowerCase().replace(/\s+/g, "-")}-report.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card" data-testid="report">
      <div className="report-header">
        <h3>Facility report</h3>
        <button type="button" className="btn btn-primary" onClick={generate}>
          Generate report
        </button>
      </div>
      {report && (
        <div className="report-body">
          <p>
            <strong>{report.facilityName}</strong> — {report.customerName}
            <br />
            <span className="muted small">Generated {new Date(report.generatedAt).toLocaleString()}</span>
          </p>
          <p data-testid="report-counts">
            {report.totalAssets} assets: {report.countsByStatus.ok} ok, {report.countsByStatus["needs-review"]} needs
            review, {report.countsByStatus.critical} critical
          </p>
          <AssetList title="Critical assets" tone="critical" rows={report.criticalAssets} />
          <AssetList title="Needs review" tone="warn" rows={report.needsReviewAssets} />
          <AssetList title="Missing inspection date" tone="muted" rows={report.missingInspectionDate} />
          <div className="report-actions">
            <button type="button" className="btn btn-secondary" onClick={copyText}>
              {copied ? "Copied!" : "Copy as text"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={downloadJson}>
              Download JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
