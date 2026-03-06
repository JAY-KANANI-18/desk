import { AppRouter } from "./AppRouter";
import { useOrganization } from "../context/OrganizationContext";
import { WorkspaceProvider } from "../context/WorkspaceContext";
import { Onboarding } from "../pages/Onboarding";
import { useAuth } from "../context/AuthContext";
import { WorkspaceRouter } from "./WorkspaceRouter";
import { Navigate, Route, Routes } from "react-router-dom";

export const AppGate = () => {
  const { user, isLoading } = useAuth();
  const { organizations, orgLoading } = useOrganization();

  if (isLoading || orgLoading || organizations == null) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <AppRouter />;
  }

  if (organizations.length === 0) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <WorkspaceProvider>
      <WorkspaceRouter />
    </WorkspaceProvider>
  );
};