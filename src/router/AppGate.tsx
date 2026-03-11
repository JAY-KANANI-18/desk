import { AuthRouter } from "./AuthRouter";
import { OrganizationProvider, useOrganization } from "../context/OrganizationContext";
import { WorkspaceProvider } from "../context/WorkspaceContext";
import { Onboarding } from "../pages/Onboarding";
import { useAuth } from "../context/AuthContext";
import { WorkspaceRouter } from "./WorkspaceRouter";
import { Navigate, Route, Routes } from "react-router-dom";
import { ResetPassword } from "../pages/auth/ResetPassword";
import { SetPassword } from "../pages/auth/SetPassword";
import { ChannelContextProvider } from "../context/ChannelContext";
import { Toaster } from "react-hot-toast";
import { CallProvider } from "../context/CallContext";
import { NotificationProvider } from "../context/NotificationContext";
import { SocketProvider } from "../socket/socket-provider";

export const AppGate = () => {
  const { user, isLoading, passwordSet } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <AuthRouter />;
  }
  
  if (passwordSet === false) {
    return (
      <Routes>
        <Route path="/auth/set-password" element={<SetPassword />} />
        <Route path="*" element={<Navigate to="/auth/set-password" replace />} />
      </Routes>
    );
  }
  
  const { organizations, orgLoading } = useOrganization();
  if (orgLoading) {
      return <div>Loading...</div>;
  }

  if (organizations?.length === 0) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <NotificationProvider>
      <CallProvider>
        <ChannelContextProvider>
          <Toaster position="top-right" />

          <SocketProvider>
              <WorkspaceProvider>
                <WorkspaceRouter />
              </WorkspaceProvider>

          </SocketProvider>
        </ChannelContextProvider>
      </CallProvider>
    </NotificationProvider >
  );
};