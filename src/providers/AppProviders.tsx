import { Toaster } from "react-hot-toast";
import { NotificationProvider } from "../context/NotificationContext";
import { AuthProvider } from "../context/AuthContext";
import { CallProvider } from "../context/CallContext";
import { ChannelContextProvider } from "../context/ChannelContext";
import { OrganizationProvider } from "../context/OrganizationContext";
import { SocketProvider } from "../socket/socket-provider";

export const AppProviders = ({ children }: any) => {
  return (
    <NotificationProvider>
      <CallProvider>
        <ChannelContextProvider>
        <Toaster position="top-right" />

        <AuthProvider>
          <SocketProvider>

          <OrganizationProvider>{children}</OrganizationProvider>
          </SocketProvider>
        </AuthProvider>
        </ChannelContextProvider>
      </CallProvider>
    </NotificationProvider>
  );
};
