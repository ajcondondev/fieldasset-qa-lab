import { useStore } from "../app/store";
import { ASSET_STATUSES, type ElectricalAsset } from "../domain/types";
import { StatusBadge } from "./StatusBadge";

export function AssetTable({ assets }: { assets: ElectricalAsset[] }) {
  const { updateAssetStatus } = useStore();

  if (assets.length === 0) {
    return <p className="muted">No assets yet. Add one manually or import a CSV below.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="asset-table">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Type</th>
            <th>Location</th>
            <th>Status</th>
            <th>Last inspection</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id} className={asset.status === "critical" ? "row-critical" : undefined}>
              <td className="cell-name">{asset.name}</td>
              <td>{asset.type}</td>
              <td>{asset.location}</td>
              <td>
                <span className="status-cell">
                  <StatusBadge status={asset.status} />
                  <select
                    aria-label={`Status for ${asset.name}`}
                    value={asset.status}
                    onChange={(e) => updateAssetStatus(asset.id, e.target.value as ElectricalAsset["status"])}
                  >
                    {ASSET_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </span>
              </td>
              <td>{asset.lastInspectionDate ?? <span className="warn-text">missing</span>}</td>
              <td className="cell-notes">{asset.notes ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
