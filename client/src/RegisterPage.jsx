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
    <div className="auth-page d-flex align-items-center justify-content-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-4 col-lg-5 col-md-6">
            <div className="auth-card card border-0 shadow-lg">
              <div className="card-body p-4 p-md-5">
                <div className="d-flex align-items-center mb-3">
                  <div className="auth-logo-pill me-2">FB</div>
                  <div>
                    <h3 className="auth-title mb-0">Create Admin Account</h3>
                    <p className="auth-subtitle mb-0">
                      Set up your workspace in a few seconds.
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
                      Full Name <span className="text-muted">(optional)</span>
                    </label>
                    <input
                      className="form-control auth-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Doe"
                    />
                  </div>
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
                      placeholder="Choose a secure password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 auth-primary-btn mb-2"
                  >
                    Register
                  </button>
                </form>

                <p className="mt-3 mb-0 text-muted small text-center">
                  Already have an account?{" "}
                  <Link to="/login" className="auth-link">
                    Login here
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

export default RegisterPage;
