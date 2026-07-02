import { useState } from "react";
import { useStore } from "../app/store";
import { parseAssetCsv } from "../domain/csv";
import type { ImportResult } from "../domain/types";
import validFixture from "../test-fixtures/valid-assets.csv?raw";
import brokenFixture from "../test-fixtures/broken-panel-schedule.csv?raw";
import criticalFixture from "../test-fixtures/critical-assets.csv?raw";

const FIXTURES = [
  { label: "valid-assets.csv", text: validFixture },
  { label: "broken-panel-schedule.csv", text: brokenFixture },
  { label: "critical-assets.csv", text: criticalFixture },
];

export function CsvImportPanel({ facilityId }: { facilityId: string }) {
  const { assets, applyImport } = useStore();
  const [csvText, setCsvText] = useState("");
  const [sourceLabel, setSourceLabel] = useState("pasted CSV");
  const [result, setResult] = useState<ImportResult | null>(null);

  function loadFixture(label: string, text: string) {
    setCsvText(text);
    setSourceLabel(label);
    setResult(null);
  }

  function handleImport() {
    const existingAssetNames = assets
      .filter((a) => a.facilityId === facilityId)
      .map((a) => a.name);
    const parsed = parseAssetCsv(csvText, { existingAssetNames });
    setResult(parsed);
    if (parsed.acceptedRows > 0) {
      applyImport(facilityId, parsed, sourceLabel);
    }
  }

  return (
    <div className="card" data-testid="csv-import">
      <h3>Import assets from CSV</h3>
      <p className="muted small">
        Paste rows copied from a spreadsheet or legacy panel schedule. Expected header:{" "}
        <code>assetName,type,location,status,parentAssetName,lastInspectionDate,notes</code>
      </p>
      <div className="fixture-buttons">
        <span className="muted small">Load sample file:</span>
        {FIXTURES.map((f) => (
          <button
            key={f.label}
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => loadFixture(f.label, f.text)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <textarea
        aria-label="CSV input"
        value={csvText}
        onChange={(e) => {
          setCsvText(e.target.value);
          setSourceLabel("pasted CSV");
        }}
        rows={8}
        spellCheck={false}
        placeholder={"assetName,type,location,status,parentAssetName,lastInspectionDate,notes\nPanel E,panel,Electrical room 2,ok,,2025-10-01,"}
      />
      <div className="import-actions">
        <button type="button" className="btn btn-primary" onClick={handleImport} disabled={csvText.trim() === ""}>
          Validate and import
        </button>
        {result && (
          <p className="import-summary" role="status" data-testid="import-summary">
            {result.totalRows} rows — <strong>{result.acceptedRows} imported</strong>,{" "}
            <strong className={result.rejectedRows > 0 ? "error-text" : ""}>{result.rejectedRows} rejected</strong>
            {result.warnings.length > 0 && <>, {result.warnings.length} warning{result.warnings.length === 1 ? "" : "s"}</>}
          </p>
        )}
      </div>

      {result && result.errors.length > 0 && (
        <div className="issue-block" data-testid="import-errors">
          <h4 className="error-text">Rejected rows</h4>
          <table className="issue-table">
            <thead>
              <tr>
                <th>Row</th>
                <th>Field</th>
                <th>Problem</th>
              </tr>
            </thead>
            <tbody>
              {result.errors.map((e, i) => (
                <tr key={i}>
                  <td>{e.rowNumber}</td>
                  <td><code>{e.field}</code></td>
                  <td>{e.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && result.warnings.length > 0 && (
        <div className="issue-block" data-testid="import-warnings">
          <h4 className="warn-text">Warnings (rows still imported)</h4>
          <table className="issue-table">
            <thead>
              <tr>
                <th>Row</th>
                <th>Field</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {result.warnings.map((w, i) => (
                <tr key={i}>
                  <td>{w.rowNumber}</td>
                  <td><code>{w.field}</code></td>
                  <td>{w.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
