// src/AdminPage.js
import React, { useState, useEffect } from "react";
import { saveForm, getForm, getResponses, getFormsForAdmin, deleteForm } from "./api";
import AdminOnlyMessage from "./AdminOnlyMessage";

// Core participant fields that EVERY form has
const baseRequired = [
  { name: "orgName", label: "Organization Name", type: "text", required: true },
  { name: "sector", label: "Sector", type: "text", required: true },

  { name: "firstName", label: "First Name", type: "text", required: true },
  { name: "lastName", label: "Last Name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  {
    name: "socialLink",
    label: "Social Media Link to Connect",
    type: "text",
    required: true,
  },
  { name: "phone", label: "Phone Number", type: "text", required: true },
  { name: "addressStreet", label: "Street Address", type: "text", required: true },
  { name: "addressCity", label: "City", type: "text", required: true },
  { name: "addressState", label: "State", type: "text", required: true },
  { name: "addressCountry", label: "Country", type: "text", required: true },

  // special field – rendered as a dedicated connections section in DynamicForm
  { name: "connections", label: "Connections", type: "connections", required: true },
];

// kept for compatibility with backend schema
const baseOptional = [];

// Handle both array and {forms:[...]} or {items:[...]} shapes
const normalizeFormsResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.forms)) return data.forms;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
};

function AdminPage() {
  const storedAdminId = localStorage.getItem("adminId") || "";
  const storedAdminName = localStorage.getItem("adminName") || "";
  const [adminId] = useState(storedAdminId);

  // event details for this form (eventId is also the form UID)
  const [eventId, setEventId] = useState(() => `EVT-${Date.now()}`);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");

  const [extraFields, setExtraFields] = useState([]);
  const [newField, setNewField] = useState({
    label: "",
    name: "",
    type: "text",
    required: false,
  });
  const [editingIndex, setEditingIndex] = useState(null);

  const [previewRows, setPreviewRows] = useState([]);
  const [adminForms, setAdminForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [alertType, setAlertType] = useState("info");
  const [hasSaved, setHasSaved] = useState(false); // track whether this form exists

  useEffect(() => {
    if (!adminId) return;

    getFormsForAdmin(adminId)
      .then((data) => {
        const formsArray = normalizeFormsResponse(data);
        setAdminForms(formsArray);
        console.log("Loaded admin forms:", formsArray);
      })
      .catch((err) => {
        console.error("Error loading admin forms:", err);
        setAdminForms([]);
      });
  }, [adminId]);

  const resetExtraFieldEditor = () => {
    setEditingIndex(null);
    setNewField({ label: "", name: "", type: "text", required: false });
  };

  const handleSelectForm = async (id) => {
    setPreviewRows([]);
    setAlertMsg("");
    resetExtraFieldEditor();
    try {
      const f = await getForm(id);
      setExtraFields(f.extraFields || []);
      setEventId(f.eventId || f.id || `EVT-${Date.now()}`);
      setEventName(f.eventName || "");
      setEventDate(f.eventDate || "");
      setHasSaved(true); // existing form is already saved
    } catch (err) {
      console.error("Error loading form:", err);
      setExtraFields([]);
      setEventId(`EVT-${Date.now()}`);
      setEventName("");
      setEventDate("");
      setHasSaved(false);
    }
  };

  const handleNewForm = () => {
    setPreviewRows([]);
    setAlertMsg("");
    resetExtraFieldEditor();
    setExtraFields([]);
    setEventId(`EVT-${Date.now()}`); // new UID
    setEventName("");
    setEventDate("");
    setHasSaved(false); // new, not yet saved
  };

  // ADD / UPDATE extra field
  const handleSaveField = () => {
    if (!newField.label.trim() || !newField.name.trim()) return;

    const cleanField = {
      ...newField,
      label: newField.label.trim(),
      name: newField.name.trim(),
    };

    if (editingIndex === null) {
      setExtraFields([...extraFields, cleanField]);
    } else {
      const updated = extraFields.map((f, idx) =>
        idx === editingIndex ? cleanField : f
      );
      setExtraFields(updated);
    }

    resetExtraFieldEditor();
  };

  const handleEditField = (index) => {
    const field = extraFields[index];
    setEditingIndex(index);
    setNewField({
      label: field.label || "",
      name: field.name || "",
      type: field.type || "text",
      required: !!field.required,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteField = (index) => {
    const updated = extraFields.filter((_, idx) => idx !== index);
    setExtraFields(updated);

    if (editingIndex === index) {
      resetExtraFieldEditor();
    }
  };

  const handleSaveForm = async () => {
    if (!adminId) {
      setAlertMsg("You must be logged in as an admin to save forms.");
      setAlertType("warning");
      return;
    }
    if (!eventName || !eventDate) {
      setAlertMsg("Please enter Event Name and Date of Event.");
      setAlertType("warning");
      return;
    }

    const title =
      eventName && eventName.trim().length > 0
        ? eventName.trim()
        : "Participant & Connections Form";

    const form = {
      id: eventId,
      adminId,
      title,
      baseRequired,
      baseOptional,
      extraFields,
      eventId,
      eventName,
      eventDate,
    };

    try {
      await saveForm(form);
      setAlertMsg("Form saved successfully.");
      setAlertType("success");
      setHasSaved(true);

      const data = await getFormsForAdmin(adminId);
      const formsArray = normalizeFormsResponse(data);
      setAdminForms(formsArray);
      console.log("Refreshed admin forms:", formsArray);
    } catch (err) {
      console.error("Error saving form:", err);
      setAlertMsg(err.message || "Error saving form.");
      setAlertType("danger");
    }
  };

  const handleDeleteForm = async (formId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this form?\n\nThis will permanently delete the form and ALL associated responses."
    );
    if (!confirmed) return;

    try {
      await deleteForm(formId);

      const data = await getFormsForAdmin(adminId);
      const formsArray = normalizeFormsResponse(data);
      setAdminForms(formsArray);

      if (eventId === formId) {
        handleNewForm();
      }

      setAlertMsg("Form deleted successfully.");
      setAlertType("success");
    } catch (err) {
      console.error("Error deleting form:", err);
      setAlertMsg(err.message || "Error deleting form.");
      setAlertType("danger");
    }
  };

  const handleLoadPreview = async () => {
    if (!eventId) return;
    const data = await getResponses(eventId);
    setPreviewRows(data.rows || []);
  };

  const handleDownload = () => {
    if (!eventId) return;
    window.location.href = `http://localhost:5000/api/forms/${eventId}/export`;
  };

  const currentFormUrl = eventId
    ? `${window.location.origin}/form/${eventId}`
    : "";

  if (!adminId) {
    return <AdminOnlyMessage />;
  }

  // Filter forms by search term (eventName/title)
  const filteredForms = adminForms.filter((f) => {
    const label = (f.title || f.eventName || f.id || "").toLowerCase();
    return label.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="row g-4">
      {/* Left: Admin info + forms list */}
      <div className="col-lg-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-2">Your Forms</h5>
            <p className="text-muted small mb-2">
              Logged in as <strong>{storedAdminName || adminId}</strong>
            </p>

            {/* Search bar */}
            <div className="mb-3">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search events by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {filteredForms.length === 0 && (
              <p className="text-muted small mb-2">No forms yet.</p>
            )}

            <div>
              {filteredForms.map((f) => {
                const isActive = f.id === eventId;
                const title = f.title || f.eventName || "Untitled event";
                const dateLabel = f.eventDate || "";

                return (
                  <div
                    key={f.id}
                    className={`position-relative p-3 mb-2 rounded-3 border ${
                      isActive ? "bg-primary text-white" : "bg-white"
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSelectForm(f.id)}
                  >
                    <div className="fw-semibold">{title}</div>
                    {dateLabel && (
                      <div
                        className={
                          isActive ? "text-light small" : "text-muted small"
                        }
                      >
                        {dateLabel}
                      </div>
                    )}

                    {/* Event ID pill on the right */}
                    <span
                      className={`badge rounded-pill position-absolute top-50 end-0 translate-middle-y me-3 ${
                        isActive
                          ? "bg-light text-primary"
                          : "bg-primary-subtle text-primary"
                      }`}
                    >
                      {f.id}
                    </span>

                    {/* Small delete icon in bottom-right */}
                    <button
                      type="button"
                      className={`btn btn-sm border-0 position-absolute bottom-0 end-0 m-2 ${
                        isActive ? "text-white-50" : "text-muted"
                      }`}
                      title="Delete form"
                      onClick={(e) => {
                        e.stopPropagation(); // don't trigger select
                        handleDeleteForm(f.id);
                      }}
                    >
                      🗑
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Form builder */}
      <div className="col-lg-8">
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title mb-3">Create / Edit Event Form</h5>

            {alertMsg && (
              <div className={`alert alert-${alertType} py-2`}>
                {alertMsg}
              </div>
            )}

            {/* Event details */}
            <div className="border rounded-3 p-3 mb-3 bg-light">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Event Details</h6>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleNewForm}
                >
                  New Form
                </button>
              </div>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Event UID</label>
                  <input className="form-control" value={eventId} readOnly />
                  <div className="form-text">
                    Auto-generated unique ID used in the form URL.
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Event Name</label>
                  <input
                    className="form-control"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g., Tutor/Mentor Conference 2025"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Date of Event</label>
                  <input
                    type="date"
                    className="form-control"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Public URL + Open button */}
            {hasSaved ? (
              <p className="mt-1 mb-3">
                <small className="text-muted">
                  Public form URL: <code>{currentFormUrl}</code>
                </small>{" "}
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm ms-2"
                  onClick={() => window.open(currentFormUrl, "_blank")}
                >
                  Open Public Form
                </button>
              </p>
            ) : (
              <p className="mt-1 mb-3 text-muted small">
                Save this form to generate a public URL and enable the{" "}
                <strong>Open Public Form</strong> button.
              </p>
            )}

            <hr className="my-4" />

            {/* Fixed participant fields info */}
            <h5 className="mb-2">Participant Fields (fixed & required)</h5>
            <p className="text-muted small mb-3">
              These fields are collected for every participant and cannot
              be removed. All of them are required on the public form.
            </p>

            <div className="border rounded-3 p-3 mb-3 bg-light">
              <ul className="list-unstyled mb-3">
                {baseRequired
                  .filter((f) => f.name !== "connections")
                  .map((f) => (
                    <li className="mb-1" key={f.name}>
                      <span className="me-1">•</span>
                      {f.label} <span className="text-danger">*</span>
                    </li>
                  ))}
              </ul>
              <div className="pt-2 border-top">
                <strong>Connections</strong>{" "}
                <span className="text-danger">*</span>
                <p className="text-muted small mb-0">
                  For each participant you can record up to five
                  organization connections (connection organization,
                  connection type, and optional notes). This appears as a
                  dedicated section on the public form.
                </p>
              </div>
            </div>

            <hr className="my-4" />

            {/* Extra fields */}
            <h5 className="mb-2">Extra Fields (Admin-defined)</h5>
            <p className="text-muted small mb-3">
              Add any additional fields you need. These will appear after
              the fixed participant fields on the public form.
            </p>

            {/* Editor for add / edit extra field */}
            <div className="row g-2 align-items-end mb-3">
              <div className="col-md-4">
                <label className="form-label">Label</label>
                <input
                  className="form-control"
                  placeholder="e.g., Role"
                  value={newField.label}
                  onChange={(e) =>
                    setNewField({ ...newField, label: e.target.value })
                  }
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Name (key)</label>
                <input
                  className="form-control"
                  placeholder="role"
                  value={newField.name}
                  onChange={(e) =>
                    setNewField({ ...newField, name: e.target.value })
                  }
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={newField.type}
                  onChange={(e) =>
                    setNewField({ ...newField, type: e.target.value })
                  }
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </select>
              </div>
              <div className="col-md-1 form-check mt-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="extraRequired"
                  checked={newField.required}
                  onChange={(e) =>
                    setNewField({
                      ...newField,
                      required: e.target.checked,
                    })
                  }
                />
                <label
                  className="form-check-label small"
                  htmlFor="extraRequired"
                >
                  Required
                </label>
              </div>
              <div className="col-md-1 text-end mt-3">
                <button
                  type="button"
                  className="btn btn-sm btn-success me-1"
                  onClick={handleSaveField}
                >
                  {editingIndex === null ? "+" : "✓"}
                </button>
                {editingIndex !== null && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={resetExtraFieldEditor}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {extraFields.length > 0 && (
              <div className="table-responsive mb-3">
                <table className="table table-sm table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Label</th>
                      <th>Key</th>
                      <th>Type</th>
                      <th>Required</th>
                      <th style={{ width: "150px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extraFields.map((f, idx) => (
                      <tr key={idx}>
                        <td>{f.label}</td>
                        <td>
                          <code className="small">{f.name}</code>
                        </td>
                        <td>{f.type}</td>
                        <td>
                          {f.required ? (
                            <span className="badge bg-danger">Yes</span>
                          ) : (
                            <span className="badge bg-secondary">No</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleEditField(idx)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteField(idx)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button
              className="btn btn-primary"
              type="button"
              onClick={handleSaveForm}
            >
              Save Form
            </button>
          </div>
        </div>

        {/* Responses preview */}
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-3">Responses Preview</h5>
            <div className="mb-3">
              <button
                className="btn btn-outline-primary me-2"
                onClick={handleLoadPreview}
                disabled={!eventId}
              >
                Load Preview
              </button>
              <button
                className="btn btn-outline-success"
                onClick={handleDownload}
                disabled={!eventId}
              >
                Download CSV
              </button>
            </div>

            {previewRows.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-sm table-bordered">
                  <thead className="table-light">
                    <tr>
                      {Object.keys(previewRows[0]).map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i}>
                        {Object.keys(row).map((k) => (
                          <td key={k}>{row[k]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted small mb-0">
                No responses yet. Once users submit the form, you will see
                them here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
