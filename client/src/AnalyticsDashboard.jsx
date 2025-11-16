// src/AnalyticsDashboard.js
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getFormsForAdmin, getResponses } from "./api";
import AdminOnlyMessage from "./AdminOnlyMessage";

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = lines[i].split(",");
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] !== undefined ? cols[idx] : "";
    });
    rows.push(row);
  }
  return rows;
}

function AnalyticsDashboard() {
  const adminId = localStorage.getItem("adminId") || "";
  const adminName = localStorage.getItem("adminName") || adminId;

  const [forms, setForms] = useState([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [formsError, setFormsError] = useState("");

  const [selectedFormId, setSelectedFormId] = useState("");
  const [selectedForm, setSelectedForm] = useState(null);

  const [rows, setRows] = useState([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [rowsError, setRowsError] = useState("");

  const [usingUploadedCsv, setUsingUploadedCsv] = useState(false);

  // NEW: search term for forms list
  const [searchTerm, setSearchTerm] = useState("");

  // Load all forms for this admin
  useEffect(() => {
    if (!adminId) return;
    setFormsLoading(true);
    setFormsError("");
    getFormsForAdmin(adminId)
      .then((data) => {
        const list = data.forms || data || [];
        setForms(list);
        if (list.length > 0) {
          setSelectedFormId(list[0].id);
          setSelectedForm(list[0]);
        }
      })
      .catch(() => setFormsError("Unable to load your forms."))
      .finally(() => setFormsLoading(false));
  }, [adminId]);

  // Load responses for selected form
  useEffect(() => {
    if (!selectedFormId || usingUploadedCsv) return;
    setRowsLoading(true);
    setRowsError("");
    getResponses(selectedFormId)
      .then((data) => {
        setRows(data.rows || []);
      })
      .catch(() =>
        setRowsError("Unable to load responses for the selected form.")
      )
      .finally(() => setRowsLoading(false));
  }, [selectedFormId, usingUploadedCsv]);

  // Metrics from current rows
  const metrics = useMemo(() => {
    const totalParticipants = rows.length;
    const orgSet = new Set();
    const sectorSet = new Set();
    let totalConnections = 0;
    let participantsWithConnections = 0;

    rows.forEach((r) => {
      if (r.orgName) orgSet.add(r.orgName);
      if (r.sector) sectorSet.add(r.sector);

      const conn = r.connections;
      if (conn) {
        try {
          const parsed = typeof conn === "string" ? JSON.parse(conn) : conn;
          if (Array.isArray(parsed)) {
            totalConnections += parsed.length;
            if (parsed.length > 0) participantsWithConnections += 1;
          }
        } catch {
          // ignore bad JSON
        }
      }
    });

    const uniqueOrgs = orgSet.size;
    const uniqueSectors = sectorSet.size;
    const avgConnections =
      totalParticipants > 0
        ? (totalConnections / totalParticipants).toFixed(2)
        : "0.00";

    return {
      totalParticipants,
      uniqueOrgs,
      uniqueSectors,
      avgConnections,
      participantsWithConnections,
    };
  }, [rows]);

  const pageTitle =
    usingUploadedCsv && !selectedForm
      ? "Uploaded CSV"
      : selectedForm?.eventName ||
        selectedForm?.title ||
        selectedFormId ||
        "No form selected";

  // CSV upload for analytics (local only)
  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = String(ev.target?.result || "");
        const parsedRows = parseCsv(text);
        setRows(parsedRows);
        setUsingUploadedCsv(true);
        setSelectedForm(null);
        setSelectedFormId("");
        setRowsError("");
      } catch (err) {
        console.error(err);
        setRowsError("Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const handleSelectForm = (form) => {
    setUsingUploadedCsv(false);
    setSelectedFormId(form.id);
    setSelectedForm(form);
  };

  // NEW: filter forms by search text
  const filteredForms = useMemo(() => {
    if (!searchTerm.trim()) return forms;
    const q = searchTerm.toLowerCase();
    return forms.filter((f) => {
      const title = (f.title || f.eventName || f.id || "").toLowerCase();
      return title.includes(q);
    });
  }, [forms, searchTerm]);

  if (!adminId) {
    return <AdminOnlyMessage />;
  }

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-1">Event Analytics &amp; Insights</h3>
          <p className="text-muted mb-0">
            Choose a form or upload a CSV to explore participants, connections,
            and relationships.
          </p>
        </div>
        <div>
          <Link to="/admin" className="btn btn-outline-secondary btn-sm me-2">
            ← Admin
          </Link>
        </div>
      </div>

      <div className="row g-4">
        {/* LEFT SIDEBAR */}
        <div className="col-lg-4">
          {/* Admin + forms list */}
          <div className="card shadow-sm mb-3">
            <div className="card-body">
              <h5 className="card-title mb-2">Your Forms</h5>
              <p className="text-muted small mb-2">
                Logged in as <strong>{adminName}</strong>
              </p>

              {/* Search bar – same idea as Admin page */}
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search events by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {formsLoading && (
                <p className="text-muted small">Loading forms…</p>
              )}
              {formsError && (
                <p className="text-danger small mb-2">{formsError}</p>
              )}

              {!formsLoading && !formsError && forms.length === 0 && (
                <p className="text-muted small mb-0">
                  No forms yet. Create one in the Admin page first.
                </p>
              )}

              {!formsLoading && forms.length > 0 && filteredForms.length === 0 && (
                <p className="text-muted small mb-0">
                  No forms match your search.
                </p>
              )}

              {!formsLoading && filteredForms.length > 0 && (
                <div className="list-group">
                  {filteredForms.map((f) => {
                    const isActive =
                      selectedFormId === f.id && !usingUploadedCsv;
                    const title = f.title || f.eventName || "Untitled event";
                    const subtitle = f.eventDate || "";
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleSelectForm(f)}
                        className={
                          "list-group-item list-group-item-action d-flex " +
                          "justify-content-between align-items-center " +
                          (isActive ? "bg-primary text-white" : "")
                        }
                        style={{ borderRadius: 0 }}
                      >
                        <div>
                          <div className="fw-semibold">{title}</div>
                          {subtitle && (
                            <div
                              className={
                                "small " +
                                (isActive ? "text-white-50" : "text-muted")
                              }
                            >
                              {subtitle}
                            </div>
                          )}
                        </div>
                        <span
                          className={
                            "badge rounded-pill " +
                            (isActive
                              ? "bg-light text-primary"
                              : "bg-primary-subtle text-primary")
                          }
                        >
                          {f.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* CSV upload card */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title mb-2">Upload CSV for Analytics</h6>
              <p className="text-muted small">
                You can upload any CSV (e.g., exported from this app or cleaned
                externally). The dashboard will use the uploaded file until you
                select a form again.
              </p>
              <input
                type="file"
                className="form-control form-control-sm mb-2"
                accept=".csv,text/csv"
                onChange={handleCsvUpload}
              />
              {usingUploadedCsv && (
                <span className="badge bg-success">Using uploaded CSV</span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: analytics canvas */}
        <div className="col-lg-8">
          {/* Event metadata + metrics */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="mb-1">{pageTitle}</h5>
                  {usingUploadedCsv ? (
                    <p className="text-muted mb-0 small">
                      Data source: Uploaded CSV file
                    </p>
                  ) : selectedForm ? (
                    <p className="text-muted mb-0 small">
                      Event ID: {selectedForm.id}{" "}
                      {selectedForm.eventDate && (
                        <>| Date: {selectedForm.eventDate}</>
                      )}
                    </p>
                  ) : (
                    <p className="text-muted mb-0 small">
                      Select a form or upload a CSV to get started.
                    </p>
                  )}
                </div>
              </div>

              {rowsError && (
                <div className="alert alert-danger py-2 mb-2">{rowsError}</div>
              )}

              {rowsLoading ? (
                <p className="text-muted mb-0">Loading data…</p>
              ) : (
                <div className="row g-3">
                  <div className="col-md-3 col-6">
                    <div className="border rounded-3 p-3 bg-light h-100">
                      <div className="text-muted small">Total Participants</div>
                      <div className="fs-4 fw-semibold">
                        {metrics.totalParticipants}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="border rounded-3 p-3 bg-light h-100">
                      <div className="text-muted small">Organizations</div>
                      <div className="fs-4 fw-semibold">
                        {metrics.uniqueOrgs}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="border rounded-3 p-3 bg-light h-100">
                      <div className="text-muted small">Avg Connections</div>
                      <div className="fs-4 fw-semibold">
                        {metrics.avgConnections}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="border rounded-3 p-3 bg-light h-100">
                      <div className="text-muted small">Unique Sectors</div>
                      <div className="fs-4 fw-semibold">
                        {metrics.uniqueSectors}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Demographics placeholders */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="card-title mb-3">Participant Demographics</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="border rounded-3 p-3 bg-light h-100">
                    <h6 className="mb-2">Participants by Sector</h6>
                    <p className="text-muted small mb-0">
                      [Bar chart placeholder]
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="border rounded-3 p-3 bg-light h-100">
                    <h6 className="mb-2">Participants by State</h6>
                    <p className="text-muted small mb-0">
                      [Bar chart placeholder]
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="border rounded-3 p-3 bg-light h-100">
                    <h6 className="mb-2">Participants by City</h6>
                    <p className="text-muted small mb-0">
                      [Bar chart placeholder]
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="border rounded-3 p-3 bg-light h-100">
                    <h6 className="mb-2">Email Domain Breakdown</h6>
                    <p className="text-muted small mb-0">
                      [Pie chart placeholder]
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Connections section */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="card-title mb-0">Connections Overview</h5>
                <span className="badge bg-secondary">
                  Participants with connections:{" "}
                  {metrics.participantsWithConnections}
                </span>
              </div>
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="border rounded-3 p-3 bg-light h-100">
                    <h6 className="mb-2">Connection Types</h6>
                    <p className="text-muted small mb-0">
                      [Bar chart placeholder]
                    </p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="border rounded-3 p-3 bg-light h-100">
                    <h6 className="mb-2">Connection Organizations</h6>
                    <p className="text-muted small mb-0">
                      [Bar chart placeholder]
                    </p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="border rounded-3 p-3 bg-light h-100">
                    <h6 className="mb-2">Connected Org Sectors</h6>
                    <p className="text-muted small mb-0">
                      [Pie chart placeholder]
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap + Network placeholders */}
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="card-title mb-0">
                      Participant Density Heatmap
                    </h5>
                    <button className="btn btn-sm btn-outline-secondary" disabled>
                      Full-screen
                    </button>
                  </div>
                  <div
                    className="border rounded-3 bg-light"
                    style={{ height: 260 }}
                  >
                    <p className="text-muted small p-3 mb-0">
                      [Map placeholder – later: Leaflet / Mapbox heatmap based
                      on address / city / state]
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="card-title mb-0">Connection Network Graph</h5>
                    <button className="btn btn-sm btn-outline-secondary" disabled>
                      Full-screen
                    </button>
                  </div>
                  <div
                    className="border rounded-3 bg-light"
                    style={{ height: 260 }}
                  >
                    <p className="text-muted small p-3 mb-0">
                      [Network graph placeholder – later: force-directed graph
                      (participants ↔ orgs ↔ sectors)]
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data table preview */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="card-title mb-0">Data Preview</h5>
                <button className="btn btn-sm btn-outline-success" disabled>
                  Export Filtered CSV (coming soon)
                </button>
              </div>
              {rows.length === 0 ? (
                <p className="text-muted small mb-0">
                  No data loaded yet. Select a form or upload a CSV file.
                </p>
              ) : (
                <div className="table-responsive" style={{ maxHeight: 350 }}>
                  <table className="table table-sm table-bordered table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        {Object.keys(rows[0]).map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((row, idx) => (
                        <tr key={idx}>
                          {Object.keys(rows[0]).map((k) => (
                            <td key={k}>{row[k]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 50 && (
                    <p className="text-muted small mt-2 mb-0">
                      Showing first 50 rows out of {rows.length}.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
