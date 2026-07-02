import { Link, useParams } from "react-router-dom";
import { useStore } from "../app/store";
import { StatusBadge } from "../components/StatusBadge";
import { AssetTable } from "../components/AssetTable";
import { AddAssetForm } from "../components/AddAssetForm";
import { CsvImportPanel } from "../components/CsvImportPanel";
import { DiagnosticsPanel } from "../components/DiagnosticsPanel";
import { ReportPreview } from "../components/ReportPreview";

export function FacilityDetailPage() {
  const { facilityId } = useParams();
  const { facilities, assets } = useStore();
  const facility = facilities.find((f) => f.id === facilityId);

  if (!facility) {
    return (
      <section>
        <p className="notice">Facility not found. It may have been removed after a demo-data reset.</p>
        <Link className="btn btn-secondary" to="/">
          Back to facilities
        </Link>
      </section>
    );
  }

  const facilityAssets = assets.filter((a) => a.facilityId === facility.id);
  const critical = facilityAssets.filter((a) => a.status === "critical").length;
  const needsReview = facilityAssets.filter((a) => a.status === "needs-review").length;

  return (
    <section>
      <Link to="/" className="back-link">
        ← All facilities
      </Link>
      <div className="page-heading">
        <div>
          <h1>{facility.name}</h1>
          <p className="muted">
            {facility.customerName} · {facility.address}
          </p>
        </div>
        <StatusBadge status={facility.status} />
      </div>
      <div className="summary-strip" data-testid="facility-summary">
        <span>{facilityAssets.length} assets</span>
        <span className={critical > 0 ? "stat-critical" : ""}>{critical} critical</span>
        <span className={needsReview > 0 ? "stat-warn" : ""}>{needsReview} needs review</span>
      </div>

      <h2>Assets</h2>
      <AssetTable assets={facilityAssets} />
      <AddAssetForm facilityId={facility.id} />

      <h2>Import</h2>
      <CsvImportPanel facilityId={facility.id} />
      <DiagnosticsPanel facilityId={facility.id} />

      <h2>Report</h2>
      <ReportPreview facility={facility} />
    </section>
  );
}
