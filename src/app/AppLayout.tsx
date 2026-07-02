import { Link, Outlet } from "react-router-dom";
import { useStore } from "./store";

export function AppLayout() {
  const { resetDemoData } = useStore();
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="brand">
          <span className="brand-mark">FA</span>
          <span>
            FieldAsset QA Lab
            <small>Field data in, trusted asset records out</small>
          </span>
        </Link>
        <button type="button" className="btn btn-ghost" onClick={resetDemoData}>
          Reset demo data
        </button>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        Portfolio demo — fictional data only. See <code>docs/</code> for the QA strategy behind this app.
      </footer>
    </div>
  );
}
