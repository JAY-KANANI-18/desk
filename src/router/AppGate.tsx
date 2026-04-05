import { AuthRouter } from "./AuthRouter";
import { OrganizationProvider, useOrganization } from "../context/OrganizationContext";
import { useWorkspace, WorkspaceProvider } from "../context/WorkspaceContext";
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
import { WorkflowProvider } from "../pages/workflow/WorkflowContext";
import { RingSpinner } from "../pages/Loader";

export const AppGate = () => {
  const { user, isLoading, passwordSet } = useAuth();
  const { organizations, orgLoading,activeOrganization } = useOrganization();
  const { activeWorkspace, workspaceLoading } = useWorkspace();

  console.log({user,isLoading,passwordSet,organizations,orgLoading,activeOrganization,activeWorkspace,workspaceLoading});
  
  if (isLoading) {
    return <RingSpinner size={48} color="#4f46e5" />;
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
  
  
  if (orgLoading) {
      return  <RingSpinner size={48} color="#4f46e5" />;
  }


  if (organizations?.length === 0) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }
  if (workspaceLoading || !activeWorkspace || !activeOrganization) {
      return  <RingSpinner size={48} color="#4f46e5" />;
  }

  return (
    <NotificationProvider>
      <CallProvider>
        <ChannelContextProvider>

          <Toaster position="top-right" />

          <SocketProvider>
                      <WorkflowProvider>

                <WorkspaceRouter />
                </WorkflowProvider>
      
          </SocketProvider>
        </ChannelContextProvider>
      </CallProvider>
    </NotificationProvider >
  );
};