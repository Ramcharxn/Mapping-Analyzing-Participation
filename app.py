import csv
import json
import os
import time
import io
from datetime import datetime
from collections import Counter
import pandas as pd

from flask import Flask, jsonify, request, send_file, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from pymongo import MongoClient, DESCENDING

from converter import *


# -------------------------------------------------------------------
# Basic setup
# -------------------------------------------------------------------

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
ALLOWED_EXT = {".csv", ".xlsx"}

app = Flask(__name__, static_folder="/client/build", static_url_path="/")
CORS(app, supports_credentials=True)

# MongoDB
client = MongoClient(MONGO_URI)
db = client["tmi_forms"]       # DB name (change if you like)
users_col = db["users"]
forms_col = db["forms"]
responses_col = db["responses"]

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)


# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------

def normalize_value(val):
    """
    Normalize a single value:
    - strings: strip whitespace and convert to UPPERCASE
    - others: returned as-is
    """
    if isinstance(val, str):
        return val.strip().upper()
    return val

def _unique_path(folder: str, filename: str) -> str:
    base, ext = os.path.splitext(filename)
    p = os.path.join(folder, filename)
    i = 1
    while os.path.exists(p):
        p = os.path.join(folder, f"{base}_{i}{ext}")
        i += 1
    return p


def iso_now():
    return datetime.utcnow().isoformat() + "Z"


def form_to_json(doc):
    """Convert a form document from Mongo to plain JSON (remove _id)."""
    if not doc:
        return None
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


# -------------------------------------------------------------------
# Users storage (admin accounts)
# -------------------------------------------------------------------

def get_user_by_email(email: str):
    return users_col.find_one({"_id": email})


def create_user(email: str, name: str, password_hash: str):
    users_col.insert_one(
        {
            "_id": email,          # use email as primary key
            "email": email,
            "name": name,
            "password_hash": password_hash,
            "created_at": iso_now(),
        }
    )


# -------------------------------------------------------------------
# Admin auth endpoints
# -------------------------------------------------------------------
@app.route("/api/hello")
def hello():
    return {"message": "Hello from Flask"}

@app.route("/api/auth/register", methods=["POST"])
def api_register():
    data = request.get_json() or {}
    print(data)
    email = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""
    name = (data.get("fullName") or "").strip()


    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    existing = get_user_by_email(email)
    if existing:
        return jsonify({"error": "An account with this email already exists."}), 400

    password_hash = generate_password_hash(password)
    create_user(email, name, password_hash)

    return jsonify({"status": "ok", "email": email, "name": name})


@app.route("/api/auth/login", methods=["POST"])
def api_login():
    data = request.get_json() or {}
    print(data)
    email = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""

    user = get_user_by_email(email)
    if not user:
        return jsonify({"error": "Invalid email or password."}), 401

    if not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password."}), 401

    return jsonify(
        {
            "status": "ok",
            "email": user["email"],
            "fullName": user.get("name", ""),
        }
    )


# -------------------------------------------------------------------
# Form CRUD (global)
# -------------------------------------------------------------------

@app.route("/api/forms", methods=["GET"])
def api_list_forms():
    """
    List ALL forms (regardless of admin). Mostly for debugging; the UI
    typically uses /api/admin/<admin_id>/forms instead.
    """
    cursor = forms_col.find({}).sort("updatedAt", DESCENDING)
    items = [form_to_json(doc) for doc in cursor]
    return jsonify(items)


@app.route("/api/forms", methods=["POST"])
def api_create_form():
    """
    Create a new form. Frontend is posting to /api/forms with a JSON body.
    We derive the form_id from body.id / body.eventId, or generate one.

    This endpoint is kept for compatibility, but the admin UI normally
    uses POST /api/admin/<admin_id>/forms which tags the form with adminId.
    """
    data = request.get_json() or {}

    form_id = (
        (data.get("id") or "").strip()
        or (data.get("eventId") or "").strip()
        or f"EVT-{int(time.time() * 1000)}"
    )

    now = iso_now()

    existing = forms_col.find_one({"_id": form_id})
    created_at = existing.get("createdAt") if existing else now

    data["id"] = form_id
    data["createdAt"] = created_at
    data["updatedAt"] = now

    forms_col.replace_one({"_id": form_id}, {**data, "_id": form_id}, upsert=True)

    return jsonify({"status": "ok", "id": form_id})


@app.route("/api/forms/<form_id>", methods=["GET"])
def api_get_form(form_id):
    doc = forms_col.find_one({"_id": form_id})
    if not doc:
        return jsonify({"error": "Form not found"}), 404
    return jsonify(form_to_json(doc))


@app.route("/api/forms/<form_id>", methods=["POST"])
def api_save_form(form_id):
    """
    Update an existing form schema, or create it if needed.
    """
    data = request.get_json() or {}

    now = iso_now()
    existing = forms_col.find_one({"_id": form_id})
    created_at = existing.get("createdAt") if existing else now

    data["id"] = form_id
    data["createdAt"] = created_at
    data["updatedAt"] = now

    forms_col.replace_one({"_id": form_id}, {**data, "_id": form_id}, upsert=True)

    return jsonify({"status": "ok", "id": form_id})


@app.route("/api/forms/<form_id>", methods=["DELETE"])
def api_delete_form(form_id):
    """
    Delete a form and all responses related to it.
    """
    # delete form
    result = forms_col.delete_one({"_id": form_id})
    # delete all responses for that form
    responses_col.delete_many({"formId": form_id})

    if result.deleted_count == 0:
        return jsonify({"error": "Form not found"}), 404

    return jsonify({"status": "ok", "id": form_id})

# -------------------------------------------------------------------
# Admin-scoped form routes
# -------------------------------------------------------------------

@app.route("/api/admin/<admin_id>/forms", methods=["GET"])
def api_admin_list_forms(admin_id):
    """
    Return only the forms owned by this admin (by adminId).
    """
    cursor = forms_col.find({"adminId": admin_id}).sort("updatedAt", DESCENDING)
    items = [form_to_json(doc) for doc in cursor]
    return jsonify(items)


@app.route("/api/admin/<admin_id>/forms", methods=["POST"])
def api_admin_create_form(admin_id):
    """
    Create (or overwrite) a form and tag it with this adminId.
    """
    data = request.get_json() or {}

    data["adminId"] = admin_id

    form_id = (
        (data.get("id") or "").strip()
        or (data.get("eventId") or "").strip()
        or f"EVT-{int(time.time() * 1000)}"
    )

    now = iso_now()
    existing = forms_col.find_one({"_id": form_id})
    created_at = existing.get("createdAt") if existing else now

    data["id"] = form_id
    data["createdAt"] = created_at
    data["updatedAt"] = now

    forms_col.replace_one({"_id": form_id}, {**data, "_id": form_id}, upsert=True)

    return jsonify({"status": "ok", "id": form_id})


# -------------------------------------------------------------------
# Public submission endpoint
# -------------------------------------------------------------------

@app.route("/api/forms/<form_id>/submit", methods=["POST"])
def api_submit_form(form_id):
    """
    Handle a public form submission:
    normalize + store in MongoDB 'responses' collection.
    """
    doc = forms_col.find_one({"_id": form_id})
    if not doc:
        return jsonify({"error": "Form not found"}), 404

    payload = request.get_json() or {}

    # 1) Normalize top-level values
    normalized = {k: normalize_value(v) for k, v in payload.items()}

    # 2) Normalize connections if present
    conns = normalized.get("connections")
    if isinstance(conns, list):
        cleaned_conns = []
        for conn in conns:
            if isinstance(conn, dict):
                cleaned_conns.append(
                    {ck: normalize_value(cv) for ck, cv in conn.items()}
                )
            else:
                cleaned_conns.append(conn)
        normalized["connections"] = cleaned_conns

    # 3) Flatten connections into a JSON string for CSV-like row storage
    if "connections" in normalized:
        normalized["connections"] = json.dumps(normalized["connections"])

    # 4) Store normalized row in Mongo
    responses_col.insert_one(
        {
            "formId": form_id,
            "submittedAt": iso_now(),
            "data": normalized,
        }
    )

    return jsonify({"status": "ok"})


# -------------------------------------------------------------------
# Responses preview + CSV export (from Mongo)
# -------------------------------------------------------------------

@app.route("/api/forms/<form_id>/responses", methods=["GET"])
def api_get_responses(form_id):
    """
    Return all saved responses for this form as JSON for the preview table.
    Reads MongoDB 'responses' collection.
    """
    cursor = responses_col.find({"formId": form_id}).sort("submittedAt", DESCENDING)
    rows = []
    for doc in cursor:
        data = dict(doc.get("data", {}))
        rows.append(data)

    return jsonify({"rows": rows})


@app.route("/api/forms/<form_id>/export", methods=["GET"])
def api_export_responses(form_id):
    """
    Download all responses as a CSV file, built on the fly from Mongo.
    """
    cursor = responses_col.find({"formId": form_id}).sort("submittedAt", DESCENDING)
    rows = [dict(doc.get("data", {})) for doc in cursor]

    if not rows:
        return jsonify({"error": "No responses available for this form yet."}), 404

    # Build CSV in memory
    # Collect union of keys so we don't miss any columns
    fieldnames = set()
    for r in rows:
        fieldnames.update(r.keys())
    fieldnames = sorted(fieldnames)

    csv_buffer = io.StringIO()
    writer = csv.DictWriter(csv_buffer, fieldnames=fieldnames)
    writer.writeheader()
    for r in rows:
        writer.writerow(r)

    csv_bytes = io.BytesIO(csv_buffer.getvalue().encode("utf-8"))
    csv_bytes.seek(0)

    return send_file(
        csv_bytes,
        mimetype="text/csv",
        as_attachment=True,
        download_name=f"{form_id}_responses.csv",
    )


# -------------------------------------------------------------------
# Root route
# -------------------------------------------------------------------

@app.route("/")
def index():
    return jsonify({"status": "running", "message": "Form backend is alive."})



@app.route("/download/<path:filename>")
def download(filename):
    return send_from_directory(OUTPUT_FOLDER, filename, as_attachment=True)


@app.route("/upload", methods=["POST"])
def upload():
    try:
        fmt = (request.form.get("format") or "gephi").lower().strip()
        if fmt not in {"gephi", "kumu"}:
            fmt = "gephi"

        files = request.files.getlist("files") or request.files.getlist("file")
        files = [f for f in files if getattr(f, "filename", "")]
        if not files:
            return jsonify({"error": "No files uploaded. Use form-data with one or more 'files' parts."}), 400

        saved_paths = []
        for f in files:
            raw = secure_filename(f.filename or "uploaded.csv")
            ext = os.path.splitext(raw)[1].lower()
            if ext not in ALLOWED_EXT:
                return jsonify({"error": f"Unsupported extension for '{raw}'. Allowed: {sorted(ALLOWED_EXT)}"}), 415
            save_path = _unique_path(UPLOAD_FOLDER, raw)
            f.save(save_path)
            saved_paths.append(save_path)

        nodes_file, edges_file, n_nodes, n_edges = convert_many(saved_paths, OUTPUT_FOLDER, fmt)

        msg = f"Converted ({n_nodes} nodes, {n_edges} edges) → format: {fmt.upper()}"

        return jsonify({
            "message": msg,
            "nodes_url": f"http://127.0.0.1:5000/download/{nodes_file}",
            "edges_url": f"http://127.0.0.1:5000/download/{edges_file}",
        }), 200

    except Exception as e:
        import traceback, sys
        traceback.print_exc(file=sys.stderr)
        return jsonify({"error": f"Conversion failed: {type(e).__name__}: {e}"}), 500


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


# -------------------------------------------------------------------
# Main
# -------------------------------------------------------------------

if __name__ == "__main__":
    # port = int(os.environ.get("PORT", "5000"))
    # app.run(host="0.0.0.0", port=port, debug=True)
    app.run()
