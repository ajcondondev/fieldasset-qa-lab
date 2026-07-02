import { useState, type FormEvent } from "react";
import { useStore } from "../app/store";
import { ASSET_STATUSES, ASSET_TYPES, type AssetStatus, type AssetType } from "../domain/types";

export function AddAssetForm({ facilityId }: { facilityId: string }) {
  const { assets, addAsset } = useStore();
  const [name, setName] = useState("");
  const [type, setType] = useState<AssetType>("panel");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<AssetStatus>("ok");
  const [lastInspectionDate, setLastInspectionDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const problems: string[] = [];
    if (name.trim() === "") problems.push("Asset name is required.");
    if (location.trim() === "") problems.push("Location is required.");
    const duplicate = assets.some(
      (a) => a.facilityId === facilityId && a.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    if (name.trim() !== "" && duplicate) {
      problems.push(`An asset named "${name.trim()}" already exists in this facility.`);
    }
    setErrors(problems);
    setConfirmation("");
    if (problems.length > 0) return;
    addAsset({
      facilityId,
      name,
      type,
      location,
      status,
      lastInspectionDate: lastInspectionDate || undefined,
      notes: notes || undefined,
    });
    setConfirmation(`Added "${name.trim()}".`);
    setName("");
    setLocation("");
    setNotes("");
    setLastInspectionDate("");
  }

  return (
    <form className="card form-card" onSubmit={handleSubmit} aria-label="Add asset">
      <h3>Add asset manually</h3>
      {errors.length > 0 && (
        <ul className="form-errors" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {confirmation && <p className="form-success" role="status">{confirmation}</p>}
      <div className="form-grid">
        <label>
          Asset name *
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Panel E" />
        </label>
        <label>
          Type *
          <select value={type} onChange={(e) => setType(e.target.value as AssetType)}>
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Location *
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Electrical room 2" />
        </label>
        <label>
          Status *
          <select value={status} onChange={(e) => setStatus(e.target.value as AssetStatus)}>
            {ASSET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Last inspection date
          <input type="date" value={lastInspectionDate} onChange={(e) => setLastInspectionDate(e.target.value)} />
        </label>
        <label>
          Notes
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional field notes" />
        </label>
      </div>
      <button type="submit" className="btn btn-primary">Add asset</button>
    </form>
  );
}
