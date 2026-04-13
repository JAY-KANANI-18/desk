import { AuthRouter } from "./AuthRouter";
import { useOrganization } from "../context/OrganizationContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { useAuth } from "../context/AuthContext";
import { WorkspaceRouter } from "./WorkspaceRouter";
import { Navigate, Route, Routes } from "react-router-dom";
import { SetPasswordPremium } from "../pages/auth/SetPasswordPremium";
import { ChannelContextProvider } from "../context/ChannelContext";
import { Toaster } from "react-hot-toast";
import { CallProvider } from "../context/CallContext";
import { NotificationProvider } from "../context/NotificationContext";
import { WorkflowProvider } from "../pages/workflow/WorkflowContext";
import { RingSpinner } from "../pages/Loader";
import { OnboardingMinimalFlow } from "../pages/onboarding/OnboardingMinimalFlow";

export const AppGate = () => {
  const { user, isLoading, passwordSet } = useAuth();
  const { organizations, orgLoading, activeOrganization } = useOrganization();
  const { activeWorkspace, workspaceLoading } = useWorkspace();

  if (isLoading) {
    return <RingSpinner size={48} color="#4f46e5" />;
  }

  if (!user) {
    return <AuthRouter />;
  }

  if (passwordSet === false) {
    return (
      <Routes>
        <Route path="/auth/set-password" element={<SetPasswordPremium />} />
        <Route
          path="*"
          element={<Navigate to="/auth/set-password" replace />}
        />
      </Routes>
    );
  }

  if (orgLoading) {
    return <RingSpinner size={48} color="#4f46e5" />;
  }

  const needsOrganizationSetup = (organizations?.length ?? 0) === 0;
  const needsProfileSetup = !user.firstName || !user.lastName;

  if (needsOrganizationSetup || needsProfileSetup) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingMinimalFlow />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  if (workspaceLoading || !activeWorkspace || !activeOrganization) {
    return <RingSpinner size={48} color="#4f46e5" />;
  }

  return (
    <NotificationProvider>
      <CallProvider>
        <ChannelContextProvider>
          <Toaster position="top-right" />

          <WorkflowProvider>
            <WorkspaceRouter />
          </WorkflowProvider>
        </ChannelContextProvider>
      </CallProvider>
    </NotificationProvider>
  );
};
