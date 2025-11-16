import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, NavLink } from "react-router-dom";
import HomePage from "./HomePage";
import AdminPage from "./AdminPage";
import DynamicForm from "./DynamicForm";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import AnalyticsDashboard from "./AnalyticsDashboard";
import UploadPanel from "./UploadPanel";


function NavBar() {
  const navigate = useNavigate();
  const adminId = localStorage.getItem("adminId");
  const adminName = localStorage.getItem("adminName");

  const handleLogout = () => {
    localStorage.removeItem("adminId");
    localStorage.removeItem("adminName");
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
  <div className="container">
    <NavLink className="navbar-brand" to="/">
      Form Builder
    </NavLink>

    {/* Toggler button */}
    <button
      className="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#mainNavbar"
      aria-controls="mainNavbar"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span className="navbar-toggler-icon"></span>
    </button>

    {/* Collapsible content */}
    <div className="collapse navbar-collapse" id="mainNavbar">
      <ul className="navbar-nav me-auto mb-2 mb-lg-0">
        <li className="nav-item">
          <NavLink className="nav-link" to="/admin">
            Admin
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink className="nav-link" to="/analytics">
            Analytics
          </NavLink>
        </li>

            <li className="nav-item">
              <NavLink className="nav-link" to="/upload">
                Node/Edge
              </NavLink>
            </li>
          </ul>
          <ul className="navbar-nav">
            {adminId ? (
              <>
                <li className="nav-item">
                  <span className="navbar-text me-3">
                    Logged in as <strong>{adminName || adminId}</strong>
                  </span>
                </li>
                <li className="nav-item">
                  <button
                    className="btn btn-outline-light btn-sm"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <NavBar />
      <div className="container mb-5">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/form/:id" element={<DynamicForm />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/upload" element={<UploadPanel />} />
          {/* default: go to login */}
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
