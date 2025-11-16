const API_BASE = "http://localhost:5000/api";

export async function registerAdmin(data) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Registration failed");
  return body;
}

export async function loginAdmin(data) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Login failed");
  return body; // {adminId, fullName, message}
}

export async function deleteForm(formId) {
  const res = await fetch(`${API_BASE}/forms/${formId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    let msg = "Failed to delete form.";
    try {
      const body = await res.json();
      if (body && body.error) msg = body.error;
    } catch (e) {
      // ignore JSON parse errors
    }
    throw new Error(msg);
  }

  return res.json(); // { status: "ok", id: ... }
}


// ----- existing form APIs -----

export async function saveForm(form) {
  const res = await fetch(`${API_BASE}/forms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Failed to save form");
  return body;
}

export async function getForm(id) {
  const res = await fetch(`${API_BASE}/forms/${id}`);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Form not found");
  return body;
}

export async function submitForm(id, data) {
  const res = await fetch(`${API_BASE}/forms/${id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Submit failed");
  return body;
}

export async function getResponses(id) {
  const res = await fetch(`${API_BASE}/forms/${id}/responses`);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Failed to load responses");
  return body;
}

export async function getFormsForAdmin(adminId) {
  const res = await fetch(`${API_BASE}/admin/${adminId}/forms`);
  const body = await res.json();
  console.log(body)
  if (!res.ok) throw new Error(body.error || "Failed to load forms for admin");
  return body;
}
