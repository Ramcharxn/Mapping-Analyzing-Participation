// src/DynamicForm.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getForm, submitForm } from "./api";

const SECTOR_OPTIONS = [
  "Education",
  "Business",
  "Non-profit",
  "Government",
  "Community",
  "Other",
];

const CONNECTION_TYPES = [
  "Met for the first time",
  "Reconnected / existing relationship",
  "Shared info / resources",
  "Funding / partnership",
  "Referral / introduced",
  "Other",
];

function DynamicForm() {
  const { id } = useParams();
  const [schema, setSchema] = useState(null);
  const [values, setValues] = useState({});
  const [connections, setConnections] = useState([]); // start with NO rows
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [errors, setErrors] = useState({}); // field-level + section errors

  useEffect(() => {
    getForm(id)
      .then((f) => {
        setSchema(f);

        const allFields = [
          ...(f.baseRequired || []),
          ...(f.baseOptional || []),
          ...(f.extraFields || []),
        ].filter((field) => field.name !== "connections"); // special-handled

        const init = {};
        allFields.forEach((field) => {
          init[field.name] = "";
        });

        if (f.eventId) init.eventId = f.eventId;
        if (f.eventName) init.eventName = f.eventName;
        if (f.eventDate) init.eventDate = f.eventDate;

        setValues(init);
      })
      .catch(() => {
        setStatus("Form not found");
        setStatusType("danger");
      });
  }, [id]);

  if (!schema) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "40vh" }}
      >
        {status ? (
          <div className={`alert alert-${statusType}`}>{status}</div>
        ) : (
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading form...</span>
          </div>
        )}
      </div>
    );
  }

  const baseRequired = schema.baseRequired || [];
  const fixedFields = baseRequired.filter((f) => f.name !== "connections");
  const extraFields = schema.extraFields || [];

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleConnectionChange = (index, field, value) => {
    setConnections((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addConnection = () => {
    if (connections.length >= 5) return;
    setConnections((prev) => [
      ...prev,
      { connectionOrg: "", connectionType: "", otherText: "" },
    ]);
  };

  const removeConnection = (index) => {
    setConnections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setErrors({});

    const newErrors = {};

    // ---------- 1. EMAIL & PHONE ----------
    const rawEmail = (values.email || "").trim();
    const rawPhone = (values.phone || "").trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!rawEmail) {
      newErrors.email = "Email is required.";
    } else if (!emailPattern.test(rawEmail)) {
      newErrors.email =
        "Please enter a valid email address (for example: NAME@EXAMPLE.COM).";
    }

    const phoneDigits = rawPhone.replace(/\D/g, "");
    if (!rawPhone) {
      newErrors.phone = "Phone number is required.";
    } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      newErrors.phone =
        "Phone number must be 7–15 digits (numbers only, no spaces or symbols).";
    }

    // ---------- 2. SECTOR ----------
    const sectorVal = (values.sector || "").trim();
    if (!sectorVal) {
      newErrors.sector = "Sector is required.";
    }

    // ---------- 3. OTHER REQUIRED BASE FIELDS ----------
    baseRequired.forEach((field) => {
      if (!field.required) return;

      // skip ones already checked or special
      if (
        ["email", "phone", "sector", "connections"].includes(field.name)
      ) {
        return;
      }

      const val = (values[field.name] || "").trim();
      if (!val) {
        newErrors[field.name] = `${field.label} is required.`;
      }
    });

    // ---------- 4. REQUIRED EXTRA FIELDS ----------
    extraFields.forEach((field) => {
      if (!field.required) return;
      const val = (values[field.name] || "").trim();
      if (!val) {
        newErrors[field.name] = `${field.label} is required.`;
      }
    });

    // ---------- 5. CONNECTIONS (OPTIONAL) ----------
    // Rule: user may leave all connections blank.
    // But if they start filling a row (any of the three fields),
    // that row must have BOTH connectionOrg and connectionType.
    let hasHalfFilledConnection = false;

    connections.forEach((c) => {
      const org = (c.connectionOrg || "").trim();
      const typ = (c.connectionType || "").trim();
      const other = (c.otherText || "").trim();

      const anyFilled = org || typ || other;
      if (anyFilled && (!org || !typ)) {
        hasHalfFilledConnection = true;
      }
    });

    if (hasHalfFilledConnection) {
      newErrors.connections =
        "For each connection you add, please fill BOTH Connection Organization and Connection Type.";
    }

    // ---------- 6. IF ERRORS, SHOW SUMMARY + FIELD MESSAGES ----------
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setStatus(
        "Some fields need your attention. Please review the error list below."
      );
      setStatusType("danger");
      return;
    }

    // ---------- 7. NORMALIZE DATA (trim + UPPERCASE) ----------
    const cleanedValues = {};
    Object.entries(values).forEach(([key, val]) => {
      if (typeof val === "string") {
        cleanedValues[key] = val.trim().toUpperCase();
      } else {
        cleanedValues[key] = val;
      }
    });

    cleanedValues.email = rawEmail.toUpperCase();
    cleanedValues.phone = phoneDigits.toUpperCase();

    const cleanedConnections = connections.map((conn) => {
      const out = {};
      Object.entries(conn).forEach(([k, v]) => {
        if (typeof v === "string") {
          out[k] = v.trim().toUpperCase();
        } else {
          out[k] = v;
        }
      });
      return out;
    });

    const payload = {
      ...cleanedValues,
      eventId: schema.eventId,
      eventName: schema.eventName
        ? schema.eventName.trim().toUpperCase()
        : undefined,
      eventDate: schema.eventDate,
      connections: cleanedConnections,
    };

    try {
      await submitForm(schema.id, payload);
      setStatus("Submitted successfully! Thank you.");
      setStatusType("success");

      // reset fields (keep event meta)
      const cleared = {};
      fixedFields.forEach((f) => (cleared[f.name] = ""));
      extraFields.forEach((f) => (cleared[f.name] = ""));
      cleared.eventId = schema.eventId;
      cleared.eventName = schema.eventName;
      cleared.eventDate = schema.eventDate;

      setValues(cleared);
      setConnections([]);
      setErrors({});
    } catch (err) {
      setStatus("Submit failed. Please try again or check required fields.");
      setStatusType("danger");
    }
  };

  const errorMessages = Object.values(errors);

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8 col-md-10">
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <h3 className="card-title mb-3">
              {schema.title || "Participant & Connections Form"}
            </h3>

            <p className="text-muted small">
              Fields marked with <span className="text-danger">*</span> are required.
            </p>

            {/* Global banner for success / backend / validation hint */}
            {status && (
              <div className={`alert alert-${statusType} py-2`}>{status}</div>
            )}

            {/* Validation summary – list all messages */}
            {errorMessages.length > 0 && (
              <div className="alert alert-danger py-2">
                <strong>Please fix the following:</strong>
                <ul className="mb-0">
                  {errorMessages.map((msg, idx) => (
                    <li key={idx}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Participant & organization */}
              <h5 className="mt-2 mb-2">
                Participant &amp; Organization Information
              </h5>

              {fixedFields.map((field) => {
                if (field.name === "sector") {
                  const invalid = !!errors.sector;
                  return (
                    <div className="mb-3" key={field.name}>
                      <label className="form-label">
                        Sector <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${
                          invalid ? "is-invalid" : ""
                        }`}
                        value={values.sector || ""}
                        onChange={(e) =>
                          handleChange("sector", e.target.value)
                        }
                      >
                        <option value="">Select sector</option>
                        {SECTOR_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      {invalid && (
                        <div className="invalid-feedback">{errors.sector}</div>
                      )}
                    </div>
                  );
                }

                const isInvalid = !!errors[field.name];

                return (
                  <div className="mb-3" key={field.name}>
                    <label className="form-label">
                      {field.label}{" "}
                      {field.required && (
                        <span className="text-danger">*</span>
                      )}
                    </label>
                    <input
                      type={field.type || "text"}
                      className={`form-control ${
                        isInvalid ? "is-invalid" : ""
                      }`}
                      value={values[field.name] || ""}
                      onChange={(e) =>
                        handleChange(field.name, e.target.value)
                      }
                    />
                    {isInvalid && (
                      <div className="invalid-feedback">
                        {errors[field.name]}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Connections */}
              <hr className="my-4" />
              <h5 className="mb-2">Connections (optional, up to 5)</h5>
              <p className="text-muted small">
                You can record up to five organization connections. Leave this
                section empty if you don&apos;t want to add any connections. If
                you start a connection row, please fill both the organization
                name and connection type.
              </p>

              {errors.connections && (
                <p className="text-danger small mb-2">{errors.connections}</p>
              )}

              {connections.length === 0 && (
                <p className="text-muted small fst-italic">
                  No connections added yet. Click{" "}
                  <strong>“Add connection”</strong> to add one.
                </p>
              )}

              {connections.map((conn, idx) => (
                <div
                  className="border rounded-3 p-3 mb-3"
                  key={idx}
                  style={{ backgroundColor: "#fafafa" }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Connection {idx + 1}</h6>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeConnection(idx)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">
                        Connection Organization
                      </label>
                      <input
                        className="form-control"
                        value={conn.connectionOrg}
                        onChange={(e) =>
                          handleConnectionChange(
                            idx,
                            "connectionOrg",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Connection Type</label>
                      <select
                        className="form-select"
                        value={conn.connectionType}
                        onChange={(e) =>
                          handleConnectionChange(
                            idx,
                            "connectionType",
                            e.target.value
                          )
                        }
                      >
                        <option value="">Select connection type</option>
                        {CONNECTION_TYPES.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    {conn.connectionType === "Other" && (
                      <div className="col-12">
                        <label className="form-label">
                          Please describe the connection
                        </label>
                        <input
                          className="form-control"
                          value={conn.otherText}
                          onChange={(e) =>
                            handleConnectionChange(
                              idx,
                              "otherText",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {connections.length < 5 && (
                <button
                  type="button"
                  className="btn btn-outline-secondary mb-3"
                  onClick={addConnection}
                >
                  + Add connection
                </button>
              )}

              {/* Extra admin-defined fields */}
              {extraFields.length > 0 && (
                <>
                  <hr className="my-4" />
                  <h5 className="mb-2">Additional Questions</h5>
                  {extraFields.map((field) => {
                    const invalid = !!errors[field.name];
                    return (
                      <div className="mb-3" key={field.name}>
                        <label className="form-label">
                          {field.label}{" "}
                          {field.required && (
                            <span className="text-danger">*</span>
                          )}
                        </label>
                        <input
                          type={field.type || "text"}
                          className={`form-control ${
                            invalid ? "is-invalid" : ""
                          }`}
                          value={values[field.name] || ""}
                          onChange={(e) =>
                            handleChange(field.name, e.target.value)
                          }
                        />
                        {invalid && (
                          <div className="invalid-feedback">
                            {errors[field.name]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              <button type="submit" className="btn btn-primary w-100 mt-3">
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DynamicForm;
