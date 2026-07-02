import { useEffect, useRef, useState } from "react";
import { useStore } from "../app/store";
import { parseAssetCsv } from "../domain/csv";
import type { ImportResult } from "../domain/types";
import validFixture from "../test-fixtures/valid-assets.csv?raw";
import brokenFixture from "../test-fixtures/broken-panel-schedule.csv?raw";
import criticalFixture from "../test-fixtures/critical-assets.csv?raw";

const FIXTURES = [
  { label: "Clean file", file: "valid-assets.csv", text: validFixture },
  { label: "Messy customer file", file: "broken-panel-schedule.csv", text: brokenFixture },
  { label: "Critical equipment", file: "critical-assets.csv", text: criticalFixture },
];

export function CsvImportPanel({
  facilityId,
  demoMode = false,
}: {
  facilityId: string;
  demoMode?: boolean;
}) {
  const { assets, applyImport } = useStore();
  const [csvText, setCsvText] = useState("");
  const [sourceLabel, setSourceLabel] = useState("pasted CSV");
  const [result, setResult] = useState<ImportResult | null>(null);
  // 0 = not in demo, 1 = sample loaded and waiting for the click, 2 = imported
  const [demoStep, setDemoStep] = useState(0);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (demoMode && demoStep === 0) {
      setCsvText(brokenFixture);
      setSourceLabel("broken-panel-schedule.csv");
      setResult(null);
      setDemoStep(1);
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    }
  }, [demoMode, demoStep]);

  function loadFixture(file: string, text: string) {
    setCsvText(text);
    setSourceLabel(file);
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
    if (demoStep === 1) setDemoStep(2);
  }

  return (
    <div className="card" data-testid="csv-import" ref={panelRef}>
      <h3>Import assets from a spreadsheet</h3>
      <p className="muted small">
        Paste rows copied from a spreadsheet, or click a sample file to try it instantly. Expected
        columns:{" "}
        <code>assetName,type,location,status,parentAssetName,lastInspectionDate,notes</code>
      </p>
      <div className="fixture-buttons">
        <span className="muted small">Try a sample:</span>
        {FIXTURES.map((f) => (
          <button
            key={f.file}
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => loadFixture(f.file, f.text)}
          >
            {f.label} <span className="muted">({f.file})</span>
          </button>
        ))}
      </div>

      {demoStep === 1 && (
        <p className="demo-hint" role="status">
          <strong>Step 1 is done for you.</strong> Below is a messy spreadsheet, exactly as a customer
          might send it. Now for step 2: click the blue button. This is sample data, so nothing can
          break.
        </p>
      )}

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
        <button
          type="button"
          className={`btn btn-primary${demoStep === 1 ? " pulse" : ""}`}
          onClick={handleImport}
          disabled={csvText.trim() === ""}
        >
          Check and import
        </button>
        {result && (
          <p className="import-summary" role="status" data-testid="import-summary">
            {result.totalRows} rows — <strong>{result.acceptedRows} imported</strong>,{" "}
            <strong className={result.rejectedRows > 0 ? "error-text" : ""}>{result.rejectedRows} rejected</strong>
            {result.warnings.length > 0 && <>, {result.warnings.length} warning{result.warnings.length === 1 ? "" : "s"}</>}
          </p>
        )}
      </div>

      {result && (
        <p className="muted small">
          {result.rejectedRows > 0
            ? "Nothing was lost. Every row that didn't import is listed below with the exact line and what to fix, in plain words."
            : result.acceptedRows > 0
              ? "All rows imported successfully and now appear in the asset list above."
              : "Nothing imported. The messages below explain why."}
        </p>
      )}

      {demoStep === 2 && result && (
        <div className="whats-happened" data-testid="demo-explainer">
          <h4>What just happened?</h4>
          <p>
            The app read all {result.totalRows} lines of the messy file. {result.acceptedRows} were
            good and were added to the asset list above. {result.rejectedRows} had problems, and the
            red table below says exactly which line and what to fix. When you're done here, scroll
            down: the <strong>Support diagnostics</strong> panel shows what our support team would
            see, and the <strong>Generate report</strong> button builds a summary for the customer.
          </p>
        </div>
      )}

      {result && result.errors.length > 0 && (
        <div className="issue-block" data-testid="import-errors">
          <h4 className="error-text">Rows that need a fix</h4>
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
          <h4 className="warn-text">Worth a look (these rows still imported)</h4>
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
