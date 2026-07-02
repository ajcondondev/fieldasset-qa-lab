import { SEED_ASSETS, SEED_FACILITIES } from "../data/seed";
import type { ElectricalAsset, Facility, ImportResult } from "../domain/types";

const STORAGE_KEY = "fieldasset-qa-lab/v1";

export type LastImport = {
  facilityId: string;
  sourceLabel: string;
  importedAt: string;
  result: ImportResult;
};

export type AppData = {
  facilities: Facility[];
  assets: ElectricalAsset[];
  lastImport?: LastImport;
};

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (Array.isArray(parsed.facilities) && Array.isArray(parsed.assets)) {
        return parsed;
      }
    }
  } catch {
    // Corrupt storage falls through to a fresh seed — never crash the app on bad local data.
  }
  return { facilities: SEED_FACILITIES, assets: SEED_ASSETS };
}

export function saveAppData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetAppData(): AppData {
  localStorage.removeItem(STORAGE_KEY);
  return { facilities: SEED_FACILITIES, assets: SEED_ASSETS };
}

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}
