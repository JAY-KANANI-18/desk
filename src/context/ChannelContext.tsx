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

interface OrganizationContextType {
channels: any;
  refreshOrganizationsUsers: () => Promise<any>;
  organizationSetup: () => Promise<any>;
  setActiveOrganizationFunc: (
    org: Organization
  ) => Promise<any>;
  refreshOrganizations: () => Promise<any>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ChannelContext = createContext<OrganizationContextType | null>(null);

export const ChannelContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [ channels, setChannels] = useState()
  

  const refreshChannels = useCallback(async () => {
    const result = await ChannelApi.getChannels();
    
    setChannels(result);
    return result;
  }, []);

  useEffect(()=>{

    refreshChannels();

  },[])

  const whstappChannelManualSetup = useCallback(async (channelName: string) => {
    // Call API to create channel
    const result = await ChannelApi.whatsappManualConnect(
      
    );
    return result;
  }, []);


  const organizationSetup = useCallback(async (organizationName: string) => {
    const result = await organizationApi.setup(
      organizationName,
      "Default Workspace"
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
    []
  );

  const setActiveOrganizationFunc = (org: Organization) => {
    localStorage.setItem("active_organization", JSON.stringify(org));
  }

  const refreshOrganizationsUsers = useCallback(async () => {
    
  }, []);

  





    // setOrganizations(result.data);


  return (
    <ChannelContext.Provider
      value={{
        channels,

      }}
    >
      {children}
    </ChannelContext.Provider>
  );
};

export const useChannel = () => {
  const ctx = useContext(ChannelContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
