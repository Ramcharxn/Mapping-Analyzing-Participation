// LoginPage.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { loginAdmin } from "./api";
import "./DynamicForm.css"; // reuse same styling as your SignupPage

function LoginPage() {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const adminId = localStorage.getItem("adminId") || "";

  // If already logged in, bounce
  useEffect(() => {
    if (adminId) navigate(returnTo, { replace: true });
  }, [adminId, navigate, returnTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);

    try {
      const res = await loginAdmin({ username, password });

      localStorage.setItem("adminId", res.email);
      if (res.fullName) localStorage.setItem("adminName", res.fullName);

      // 🔥 important for navbar updates (same-tab)
      window.dispatchEvent(new Event("auth-changed"));

      setStatus("Login successful. Redirecting...");
      setStatusType("success");

      setTimeout(() => navigate(returnTo), 300);
    } catch (err) {
      setStatus(err?.message || "Login failed");
      setStatusType("danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page bg-light d-flex justify-content-center align-items-center min-vh-100">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-5 col-lg-6 col-md-7">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <h2 className="mb-2">Welcome Back</h2>
                  <p className="text-muted">Log in to access your admin dashboard</p>
                </div>

                {status && (
                  <div className={`alert alert-${statusType} py-2`}>
                    {status}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 mb-3"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Log In"}
                  </button>
                </form>

                <div className="text-center">
                  <p className="text-muted small mb-0">
                    Don&apos;t have an account?{" "}
                    <Link
                      to={`/signup?returnTo=${encodeURIComponent(returnTo)}`}
                      className="text-primary"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>

                <div className="alert alert-light mt-4 mb-0">
                  <strong>Note:</strong> This is a demo implementation. In production
                  authentication should be handled securely via your MongoDB backend
                  with JWT tokens.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;