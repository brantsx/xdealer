import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { BatchReviewPage } from "./pages/BatchReviewPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DecisionPackPage } from "./pages/DecisionPackPage";
import { DecisionPacksListPage } from "./pages/DecisionPacksListPage";
import { IntegrationsPage } from "./pages/IntegrationsPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { NewVehiclePage } from "./pages/NewVehiclePage";
import { OutcomesPage } from "./pages/OutcomesPage";
import { RulesPage } from "./pages/RulesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SignupPage } from "./pages/SignupPage";
import { VehicleDetailPage } from "./pages/VehicleDetailPage";
import { VehicleInboxPage } from "./pages/VehicleInboxPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="vehicles" element={<VehicleInboxPage />} />
          <Route path="vehicles/new" element={<NewVehiclePage />} />
          <Route path="vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="decision-packs" element={<DecisionPacksListPage />} />
          <Route path="decision-packs/:id" element={<DecisionPackPage />} />
          <Route path="batch-review" element={<BatchReviewPage />} />
          <Route path="rules" element={<RulesPage />} />
          <Route path="outcomes" element={<OutcomesPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
