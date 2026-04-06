import { useAuth } from "../context/AuthContext";
import { OrganizationProvider } from "../context/OrganizationContext";
import { WorkspaceProvider } from "../context/WorkspaceContext";
import { AuthorizationProvider } from "../context/AuthorizationContext";
import { SocketProvider } from "../socket/socket-provider";

export const InnerProviders = ({ children }: any) => {
  const { user } = useAuth();

  return (
    <SocketProvider>
      <OrganizationProvider key={user?.id ?? "guest"}>
        <WorkspaceProvider key={user?.id ?? "guest"}>
          {/* Must be inside both org + workspace so it can read their context */}
          <AuthorizationProvider>
            {children}
          </AuthorizationProvider>
        </WorkspaceProvider>
      </OrganizationProvider>
    </SocketProvider>
  );
};