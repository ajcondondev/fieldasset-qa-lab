import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type {
  AssetStatus,
  AssetType,
  ElectricalAsset,
  Facility,
  ImportResult,
} from "../domain/types";
import { loadAppData, newId, resetAppData, saveAppData, type AppData, type LastImport } from "../services/storage";

type NewAssetInput = {
  facilityId: string;
  name: string;
  type: AssetType;
  location: string;
  status: AssetStatus;
  lastInspectionDate?: string;
  notes?: string;
};

type Store = {
  facilities: Facility[];
  assets: ElectricalAsset[];
  lastImport?: LastImport;
  addFacility: (input: Omit<Facility, "id">) => Facility;
  addAsset: (input: NewAssetInput) => ElectricalAsset;
  updateAssetStatus: (assetId: string, status: AssetStatus) => void;
  applyImport: (facilityId: string, result: ImportResult, sourceLabel: string) => void;
  resetDemoData: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadAppData());

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  const addFacility = useCallback((input: Omit<Facility, "id">): Facility => {
    const facility: Facility = { ...input, id: newId("fac") };
    setData((d) => ({ ...d, facilities: [...d.facilities, facility] }));
    return facility;
  }, []);

  const addAsset = useCallback((input: NewAssetInput): ElectricalAsset => {
    const now = new Date().toISOString();
    const asset: ElectricalAsset = {
      id: newId("as"),
      facilityId: input.facilityId,
      name: input.name.trim(),
      type: input.type,
      location: input.location.trim(),
      status: input.status,
      lastInspectionDate: input.lastInspectionDate || undefined,
      notes: input.notes?.trim() || undefined,
      history: [
        { id: newId("ev"), timestamp: now, eventType: "created", message: "Added manually" },
      ],
    };
    setData((d) => ({ ...d, assets: [...d.assets, asset] }));
    return asset;
  }, []);

  const updateAssetStatus = useCallback((assetId: string, status: AssetStatus) => {
    const now = new Date().toISOString();
    setData((d) => ({
      ...d,
      assets: d.assets.map((a) =>
        a.id === assetId && a.status !== status
          ? {
              ...a,
              status,
              history: [
                ...a.history,
                {
                  id: newId("ev"),
                  timestamp: now,
                  eventType: "status-changed" as const,
                  message: `Status changed from ${a.status} to ${status}`,
                },
              ],
            }
          : a,
      ),
    }));
  }, []);

  const applyImport = useCallback(
    (facilityId: string, result: ImportResult, sourceLabel: string) => {
      const now = new Date().toISOString();
      setData((d) => {
        const imported: ElectricalAsset[] = result.accepted.map((row) => ({
          id: newId("as"),
          facilityId,
          name: row.name,
          type: row.type,
          location: row.location,
          status: row.status,
          lastInspectionDate: row.lastInspectionDate,
          notes: row.notes,
          history: [
            {
              id: newId("ev"),
              timestamp: now,
              eventType: "imported" as const,
              message: `Imported from ${sourceLabel} (row ${row.rowNumber})`,
            },
          ],
        }));
        // Resolve parent references by name against existing + newly imported assets.
        const byName = new Map<string, string>();
        for (const a of [...d.assets.filter((a) => a.facilityId === facilityId), ...imported]) {
          byName.set(a.name.toLowerCase(), a.id);
        }
        result.accepted.forEach((row, i) => {
          if (row.parentAssetName) {
            imported[i].parentAssetId = byName.get(row.parentAssetName.toLowerCase());
          }
        });
        const lastImport: LastImport = { facilityId, sourceLabel, importedAt: now, result };
        return { ...d, assets: [...d.assets, ...imported], lastImport };
      });
    },
    [],
  );

  const resetDemoData = useCallback(() => {
    setData(resetAppData());
  }, []);

  const store: Store = {
    facilities: data.facilities,
    assets: data.assets,
    lastImport: data.lastImport,
    addFacility,
    addAsset,
    updateAssetStatus,
    applyImport,
    resetDemoData,
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
