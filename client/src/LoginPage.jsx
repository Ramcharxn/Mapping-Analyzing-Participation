import { loginAdmin } from "./api";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");
  const navigate = useNavigate();

  const adminId = localStorage.getItem("adminId") || "";

  // If already logged in, bounce to /admin
  useEffect(() => {
    if (adminId) {
      navigate("/admin", { replace: true });
    }
  }, [adminId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      const res = await loginAdmin({ username, password });
      // Save admin info in localStorage
      localStorage.setItem("adminId", res.email);
      if (res.fullName) {
        localStorage.setItem("adminName", res.fullName);
      }
      setStatus("Login successful. Redirecting to admin...");
      setStatusType("success");

      setTimeout(() => navigate("/admin"), 500);
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
            <h3 className="card-title mb-3">Admin Login</h3>

            {status && (
              <div className={`alert alert-${statusType} py-2`}>{status}</div>
            )}

            <form onSubmit={handleSubmit}>
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
                Login
              </button>
            </form>

            <p className="mt-2 mb-0 text-muted small">
              Don&apos;t have an account?{" "}
              <Link to="/register">Register here</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
