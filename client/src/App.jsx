// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import HomePage from "./HomePage";
import AdminPage from "./AdminPage";
import DynamicForm from "./DynamicForm";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import AnalyticsDashboard from "./AnalyticsDashboard";
import UploadPanel from "./UploadPanel";
import ThankYouPage from "./ThankYouPage";
import NavBar from "./NavBar";

function AppShell() {
  const location = useLocation();

  // Hide the side nav on the public form route
  const hideNavbar = location.pathname.startsWith("/form/");

  return (
    <div className="app-root">
      {!hideNavbar && <NavBar />}

      <main className="app-main-overlay">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/form/:id" element={<DynamicForm />} />
          {/* default: go home */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}
