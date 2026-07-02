export const ASSET_TYPES = [
  "transformer",
  "switchgear",
  "panel",
  "breaker",
  "meter",
  "ev-charger",
  "other",
] as const;

export const ASSET_STATUSES = ["ok", "needs-review", "critical"] as const;

export const FACILITY_STATUSES = ["active", "needs-review", "archived"] as const;

export type AssetType = (typeof ASSET_TYPES)[number];
export type AssetStatus = (typeof ASSET_STATUSES)[number];
export type FacilityStatus = (typeof FACILITY_STATUSES)[number];

export type Facility = {
  id: string;
  name: string;
  address: string;
  customerName: string;
  status: FacilityStatus;
};

export type AssetHistoryEvent = {
  id: string;
  timestamp: string;
  eventType: "created" | "imported" | "status-changed" | "note-added" | "validation-warning";
  message: string;
};

export type ElectricalAsset = {
  id: string;
  facilityId: string;
  name: string;
  type: AssetType;
  parentAssetId?: string;
  location: string;
  status: AssetStatus;
  lastInspectionDate?: string;
  notes?: string;
  history: AssetHistoryEvent[];
};

export type ImportIssue = {
  rowNumber: number;
  field: string;
  message: string;
  rawValue?: string;
};

export type ImportError = ImportIssue;
export type ImportWarning = ImportIssue;

/** An asset candidate parsed from a CSV row that passed validation. */
export type ParsedAssetRow = {
  rowNumber: number;
  name: string;
  type: AssetType;
  location: string;
  status: AssetStatus;
  parentAssetName?: string;
  lastInspectionDate?: string;
  notes?: string;
};

export type ImportResult = {
  totalRows: number;
  acceptedRows: number;
  rejectedRows: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  accepted: ParsedAssetRow[];
};
