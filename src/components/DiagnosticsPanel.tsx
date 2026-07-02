import { useState } from "react";
import { useStore } from "../app/store";
import { suggestNextActions } from "../domain/csv";
import { draftSupportReply } from "../domain/supportDraft";

export function DiagnosticsPanel({ facilityId }: { facilityId: string }) {
  const { lastImport } = useStore();
  const [draft, setDraft] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!lastImport || lastImport.facilityId !== facilityId) {
    return (
      <div className="card" data-testid="diagnostics">
        <h3>Support diagnostics</h3>
        <p className="muted">
          No imports recorded for this facility yet. After an import, this panel shows what a support
          engineer needs: source, counts, row-level issues, and suggested next actions.
        </p>
      </div>
    );
  }

  const { result } = lastImport;
  const actions = suggestNextActions(result);

  return (
    <div className="card" data-testid="diagnostics">
      <h3>Support diagnostics</h3>
      <p className="muted small">This is what our support team sees when helping with an import.</p>
      <dl className="diag-grid">
        <div>
          <dt>Source</dt>
          <dd>{lastImport.sourceLabel}</dd>
        </div>
        <div>
          <dt>Imported at</dt>
          <dd>{new Date(lastImport.importedAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Rows</dt>
          <dd>{result.totalRows} total</dd>
        </div>
        <div>
          <dt>Accepted</dt>
          <dd>{result.acceptedRows}</dd>
        </div>
        <div>
          <dt>Rejected</dt>
          <dd className={result.rejectedRows > 0 ? "error-text" : ""}>{result.rejectedRows}</dd>
        </div>
        <div>
          <dt>Warnings</dt>
          <dd className={result.warnings.length > 0 ? "warn-text" : ""}>{result.warnings.length}</dd>
        </div>
      </dl>
      <h4>Suggested next actions</h4>
      <ul className="action-list">
        {actions.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>

      <h4>AI-assisted customer reply</h4>
      <p className="muted small">
        Drafts a customer-facing reply from the diagnostics above. Simulated deterministically in this
        demo — in production an LLM would write the first draft, and the guardrail is the same: a human
        reviews and edits before anything reaches the customer.
      </p>
      {draft === null ? (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setDraft(draftSupportReply(lastImport.sourceLabel, result));
            setReviewed(false);
            setCopied(false);
          }}
        >
          Draft customer reply
        </button>
      ) : (
        <div className="draft-block" data-testid="support-draft">
          <textarea
            aria-label="Support reply draft"
            value={draft}
            rows={12}
            onChange={(e) => {
              setDraft(e.target.value);
              setCopied(false);
            }}
          />
          <div className="draft-actions">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
              />
              I reviewed this draft for accuracy and tone
            </label>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!reviewed}
              onClick={async () => {
                await navigator.clipboard.writeText(draft);
                setCopied(true);
              }}
            >
              {copied ? "Copied!" : "Copy reviewed reply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
