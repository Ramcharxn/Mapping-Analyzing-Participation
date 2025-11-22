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
    <div className="auth-page d-flex align-items-center justify-content-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-4 col-lg-5 col-md-6">
            <div className="auth-card card border-0 shadow-lg">
              <div className="card-body p-4 p-md-5">
                <div className="d-flex align-items-center mb-3">
                  <div className="auth-logo-pill me-2">FB</div>
                  <div>
                    <h3 className="auth-title mb-0">Admin Login</h3>
                    <p className="auth-subtitle mb-0">
                      Sign in to manage forms and analytics.
                    </p>
                  </div>
                </div>

                {status && (
                  <div className={`alert alert-${statusType} py-2 mb-3`}>
                    {status}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      Username
                    </label>
                    <input
                      className="form-control auth-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      Password
                    </label>
                    <input
                      type="password"
                      className="form-control auth-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 auth-primary-btn mb-2"
                  >
                    Login
                  </button>
                </form>

                <p className="mt-3 mb-0 text-muted small text-center">
                  Don&apos;t have an account?{" "}
                  <Link to="/register" className="auth-link">
                    Register here
                  </Link>
                  .
                </p>
              </div>
            </div>

            <p className="text-center text-muted very-small mt-3 mb-0">
              Form Builder · Admin workspace
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
