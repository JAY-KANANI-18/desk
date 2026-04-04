import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

import { organizationApi } from "../lib/organizationApi";
import { ChannelApi } from "../lib/channelApi";

interface Workspace {
  id: string;
  name: string;
  organizationId: string;
}

interface Organization {
  id: string;
  name: string;
  workspaces: Workspace[];
}

interface Channel {
  id: string | number;
  name?: string;
  status?: string;
  connectedAt?: string;
  [key: string]: any;
}

interface OrganizationContextType {
  channels: any;
  refreshChannels:any
  refreshOrganizationsUsers: () => Promise<any>;
  organizationSetup: () => Promise<any>;
  setActiveOrganizationFunc: (org: Organization) => Promise<any>;
  refreshOrganizations: () => Promise<any>;
  loading: boolean; // first load
  refreshing: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ChannelContext = createContext<OrganizationContextType | null>(null);

export const ChannelContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true); // initial load
  const [refreshing, setRefreshing] = useState(false); // bg update

  const refreshChannels = useCallback(async (isBackground = false) => {
    try {
      if (isBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await ChannelApi.getChannels();

      // 👇 depending on your API shape
      const channelData = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result)
          ? result
          : [];

      setChannels(channelData);
      return result;
    } catch (error) {
      console.error("Failed to refresh channels:", error);
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshChannels(false); // first page load
  }, [refreshChannels]);

  const whstappChannelManualSetup = useCallback(async (channelName: string) => {
    const result = await ChannelApi.whatsappManualConnect();
    return result;
  }, []);

  const organizationSetup = useCallback(async (organizationName: string) => {
    const result = await organizationApi.setup(
      organizationName,
      "Default Workspace",
    );
    return result;
  }, []);

  const refreshOrganizations = useCallback(async () => {
    const result = await organizationApi.me();
    return result;
  }, []);

  const inviteUser = useCallback(
    async (email: string, role: string, workspaceAccess: any) => {
      const result = await organizationApi.inviteUser(
        email,
        role,
        workspaceAccess,
      );
      return result;
    },
    [],
  );

  const setActiveOrganizationFunc = (org: Organization) => {
    localStorage.setItem("active_organization", JSON.stringify(org));
  };

  const refreshOrganizationsUsers = useCallback(async () => {
    return [];
  }, []);

  return (
    <ChannelContext.Provider
      value={{
        channels,
        loading,
        refreshing,
        refreshChannels,
        refreshOrganizationsUsers,
        organizationSetup,
        setActiveOrganizationFunc,
        refreshOrganizations,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
};

export const useChannel = () => {
  const ctx = useContext(ChannelContext);
  if (!ctx)
    throw new Error("useChannel must be used within ChannelContextProvider");
  return ctx;
};
