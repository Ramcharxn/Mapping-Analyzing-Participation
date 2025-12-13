// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import HomePage from "./HomePage";
import FormBuilderPage from "./FormBuilderPage";
import DynamicForm from "./DynamicForm";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import AdminDashboard from "./AdminDashboard";
import AnalyticsDashboard from "./AnalyticsDashboard";
import NetworkExamplesPage from "./NetworkExamplesPage";
import Footer from "./Footer";
import UploadPanel from "./UploadPanel";
import ThankYouPage from "./ThankYouPage";
import Navbar from "./Navbar";
import AdminOnlyMessage from "./AdminOnlyMessage";

import LearnLayout from "./Learn/LearnLayout";
import GettingStarted from "./Learn/GettingStarted";
import FormCreation from "./Learn/FormCreation";
import NodesEdges from "./Learn/NodesEdges";
import { ExportGuide, UseCases, FAQ } from "./Learn/PlaceholderPages";

function AppShell() {
  const location = useLocation();

  // Hide the side nav on the public form route
  const hideNavbar = location.pathname.startsWith("/form/");

  return (
    <div className="app-root">
      {!hideNavbar && <Navbar />}

      <main className="app-main-overlay">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<RegisterPage />} />
          <Route path="/examples" element={<NetworkExamplesPage />} />
          <Route path="/split" element={<UploadPanel />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/form-builder" element={<FormBuilderPage />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/form/:id" element={<DynamicForm />} />
          <Route path="/admin-only" element={<AdminOnlyMessage />} />

          <Route path="/learn" element={<LearnLayout />}>
            <Route path="getting-started" element={<GettingStarted />} />
            <Route path="form-creation" element={<FormCreation />} />
            <Route path="nodes-edges" element={<NodesEdges />} />
            <Route path="export" element={<ExportGuide />} />
            <Route path="examples" element={<UseCases />} />
            <Route path="demo" element={<NetworkExamplesPage />} />
            <Route path="faq" element={<FAQ />} />
          </Route>

          <Route path="*" element={<HomePage />} />


        </Routes>
      </main>
      <Footer />
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
