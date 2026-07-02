import type { AssetStatus, FacilityStatus } from "../domain/types";

const LABELS: Record<string, string> = {
  ok: "OK",
  "needs-review": "Needs review",
  critical: "Critical",
  active: "Active",
  archived: "Archived",
};

export function StatusBadge({ status }: { status: AssetStatus | FacilityStatus }) {
  return <span className={`badge badge-${status}`}>{LABELS[status] ?? status}</span>;
}
