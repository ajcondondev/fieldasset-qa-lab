import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../app/store";
import { StatusBadge } from "../components/StatusBadge";

export function FacilityListPage() {
  const { facilities, assets, addFacility } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    const problems: string[] = [];
    if (name.trim() === "") problems.push("Facility name is required.");
    if (customerName.trim() === "") problems.push("Customer name is required.");
    setErrors(problems);
    if (problems.length > 0) return;
    addFacility({
      name: name.trim(),
      customerName: customerName.trim(),
      address: address.trim() || "Address not recorded",
      status: "active",
    });
    setName("");
    setCustomerName("");
    setAddress("");
    setShowForm(false);
  }

  const sorted = [...facilities].sort((a, b) =>
    a.status === "archived" && b.status !== "archived" ? 1 : b.status === "archived" && a.status !== "archived" ? -1 : 0,
  );

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Facilities</h1>
          <p className="muted">Structured asset records built from field visits and legacy data.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "New facility"}
        </button>
      </div>

      <aside className="tour-banner" data-testid="demo-tour">
        <div>
          <strong>Reviewing this demo?</strong> Open a facility, load the{" "}
          <code>broken-panel-schedule.csv</code> sample, and click <em>Validate and import</em> — you'll
          see row-level diagnostics, the support panel, and the AI-reply review gate in under two minutes.
        </div>
        <Link className="btn btn-secondary" to="/facility/fac-granite">
          Start the 2-minute tour
        </Link>
      </aside>

      {showForm && (
        <form className="card form-card" onSubmit={handleCreate} aria-label="New facility">
          <h2>New facility</h2>
          {errors.length > 0 && (
            <ul className="form-errors" role="alert">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          <div className="form-grid">
            <label>
              Facility name *
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Riverside Clinic" />
            </label>
            <label>
              Customer name *
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Example Facilities Group" />
            </label>
            <label>
              Address
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city, state" />
            </label>
          </div>
          <button type="submit" className="btn btn-primary">Create facility</button>
        </form>
      )}

      <div className="facility-grid">
        {sorted.map((facility) => {
          const facilityAssets = assets.filter((a) => a.facilityId === facility.id);
          const critical = facilityAssets.filter((a) => a.status === "critical").length;
          return (
            <article
              key={facility.id}
              className={`card facility-card${facility.status === "archived" ? " facility-archived" : ""}`}
            >
              <div className="facility-card-top">
                <h2>{facility.name}</h2>
                <StatusBadge status={facility.status} />
              </div>
              <p className="muted">{facility.customerName}</p>
              <p className="muted small">{facility.address}</p>
              <div className="facility-stats">
                <span>{facilityAssets.length} assets</span>
                <span className={critical > 0 ? "stat-critical" : ""}>{critical} critical</span>
              </div>
              <Link className="btn btn-secondary" to={`/facility/${facility.id}`}>
                Open facility
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
