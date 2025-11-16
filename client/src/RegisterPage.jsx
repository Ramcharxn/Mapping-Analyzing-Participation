import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerAdmin } from "./api";

function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");
  const navigate = useNavigate();
  const adminId = localStorage.getItem("adminId") || "";

  useEffect(() => {
    if (adminId) {
      navigate("/admin", { replace: true });
    }
  }, [adminId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      await registerAdmin({ fullName, username, password });
      setStatus("Registered successfully. You can now log in.");
      setStatusType("success");

      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      setStatus(err.message);
      setStatusType("danger");
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-4 col-md-6">
        <div className="card shadow-sm">
          <div className="card-body">
            <h3 className="card-title mb-3">Admin Registration</h3>

            {status && (
              <div className={`alert alert-${statusType} py-2`}>{status}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Full Name (optional)</label>
                <input
                  className="form-control"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  className="form-control"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 mb-2">
                Register
              </button>
            </form>

            <p className="mt-2 mb-0 text-muted small">
              Already have an account?{" "}
              <Link to="/login">Login here</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
