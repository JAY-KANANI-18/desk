import { useAuth } from "../context/AuthContext";
import { OrganizationProvider } from "../context/OrganizationContext";
import { WorkspaceProvider } from "../context/WorkspaceContext";
import { SocketProvider } from "../socket/socket-provider";

// Separate component so it can access useAuth
export const InnerProviders = ({ children }: any) => {
  const { user } = useAuth();

  return (
    // key = userId means full remount on login/logout/user switch
             
    <SocketProvider >

    <OrganizationProvider key={user?.id ?? "guest"}>
      <WorkspaceProvider key={user?.id ?? "guest"}>
        {children}
      </WorkspaceProvider>
    </OrganizationProvider>
     </SocketProvider>
  );
};