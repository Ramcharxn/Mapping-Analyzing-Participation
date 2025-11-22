// src/NavBar.jsx
import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";

function NavBar() {
  const navigate = useNavigate();
  const adminId = localStorage.getItem("adminId");
  const adminName = localStorage.getItem("adminName");

  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminId");
    localStorage.removeItem("adminName");
    setOpen(false);
    navigate("/login");
  };

  const toggleOpen = () => setOpen((prev) => !prev);

  const displayName = adminName || adminId || "Guest";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Floating toggle button */}
      <button
        type="button"
        className="sidebar-fab btn btn-primary"
        onClick={toggleOpen}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
      >
        {open ? "×" : "☰"}
      </button>

      {/* Dimmed backdrop when sidebar is open */}
      {open && <div className="sidebar-backdrop" onClick={toggleOpen} />}

      {/* Slide-over sidebar panel */}
      <aside className={`sidebar-panel text-white ${open ? "open" : ""}`}>
        {/* Header */}
        <div className="sidebar-header d-flex align-items-center justify-content-between px-3 py-3 border-bottom border-primary-subtle">
          <div className="d-flex align-items-center gap-2">
            <div className="sidebar-logo rounded-3 bg-light text-primary fw-bold d-flex align-items-center justify-content-center">
              FB
            </div>
            <div className="d-flex flex-column">
              <span className="fw-semibold small">Form Builder</span>
              <span className="text-white-50 very-small">
                Admin workspace
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-light rounded-circle sidebar-toggle"
            onClick={toggleOpen}
          >
            ←
          </button>
        </div>

        {/* Navigation links */}
        <nav className="mt-3 flex-grow-1 d-flex flex-column">
          <div className="px-3">
            <SidebarLink
              to="/admin"
              icon="🛠"
              label="Admin"
              onClick={() => setOpen(false)}
            />
            <SidebarLink
              to="/analytics"
              icon="📊"
              label="Analytics"
              onClick={() => setOpen(false)}
            />
          </div>

          {/* Footer with profile + logout / auth */}
          <div className="mt-auto px-3 py-3 border-top border-primary-subtle sidebar-footer">
            {adminId ? (
              <div className="d-flex align-items-center justify-content-between gap-2">
                {/* Profile bubble + name */}
                <div className="d-flex align-items-center gap-2 flex-grow-1">
                  <div className="sidebar-avatar d-flex align-items-center justify-content-center">
                    {initials}
                  </div>
                  <div className="d-flex flex-column">
                    <span className="very-small text-white-50">Logged in</span>
                    <span className="small fw-semibold text-truncate">
                      {displayName}
                    </span>
                  </div>
                </div>
                {/* Logout button */}
                <button
                  className="btn btn-light btn-sm very-small d-flex align-items-center justify-content-center px-2"
                  onClick={handleLogout}
                >
                  ⎋ <span className="ms-1">Logout</span>
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                <Link
                  to="/login"
                  className="btn btn-outline-light btn-sm very-small"
                  onClick={() => setOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-light btn-sm text-primary very-small"
                  onClick={() => setOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}

/**
 * Nav item helper
 */
function SidebarLink({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        "nav-link sidebar-link d-flex align-items-center gap-2 " +
        (isActive ? "active" : "")
      }
    >
      <span className="sidebar-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="sidebar-label">{label}</span>
    </NavLink>
  );
}

export default NavBar;
