import type { ElectricalAsset, Facility } from "../domain/types";

// Obviously fictional demo data — no real customers, facilities, or addresses.
export const SEED_FACILITIES: Facility[] = [
  {
    id: "fac-northside",
    name: "Northside Medical Office",
    address: "100 Example Ave, Springfield, ST",
    customerName: "Acme Health Partners",
    status: "active",
  },
  {
    id: "fac-granite",
    name: "Granite Street Warehouse",
    address: "42 Granite St, Springfield, ST",
    customerName: "Example Logistics Co",
    status: "needs-review",
  },
  {
    id: "fac-elm",
    name: "Elm Street Manufacturing",
    address: "7 Elm St, Springfield, ST",
    customerName: "Sample Fabrication LLC",
    status: "archived",
  },
];

const asset = (
  id: string,
  facilityId: string,
  name: string,
  type: ElectricalAsset["type"],
  location: string,
  status: ElectricalAsset["status"],
  lastInspectionDate?: string,
  notes?: string,
): ElectricalAsset => ({
  id,
  facilityId,
  name,
  type,
  location,
  status,
  lastInspectionDate,
  notes,
  history: [
    {
      id: `${id}-h1`,
      timestamp: "2026-01-05T09:00:00.000Z",
      eventType: "created",
      message: "Seeded with demo data",
    },
  ],
});

export const SEED_ASSETS: ElectricalAsset[] = [
  asset("as-n1", "fac-northside", "Utility Transformer", "transformer", "Exterior pad, north lot", "ok", "2025-11-12"),
  asset("as-n2", "fac-northside", "Main Switchgear", "switchgear", "Electrical room 1", "ok", "2025-11-12"),
  asset("as-n3", "fac-northside", "Panel A", "panel", "Electrical room 1", "needs-review", "2024-03-02", "Label faded, verify circuit directory"),
  asset("as-n4", "fac-northside", "Breaker 12", "breaker", "Panel A", "critical", "2024-03-02", "Tripped twice during last visit"),
  asset("as-g1", "fac-granite", "Main Meter", "meter", "Loading dock wall", "ok", "2025-08-20"),
  asset("as-g2", "fac-granite", "EV Charger 01", "ev-charger", "Employee lot, space 3", "needs-review", undefined, "Firmware update pending"),
  asset("as-e1", "fac-elm", "Old Main Panel", "panel", "Back office", "critical", "2021-06-15", "Facility archived; retained for records"),
];
