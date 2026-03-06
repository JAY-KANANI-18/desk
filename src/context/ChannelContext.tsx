import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { authApi } from "../lib/authApi";
import type { AuthUser } from "../lib/authApi";
import { organizationApi } from "../lib/organizationApi";
import { useAuth } from "./AuthContext";
import { useWorkspace } from "./WorkspaceContext";
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
  orgLoading: boolean;
  organizations: Organization[];
  activeOrganization: Organization | null;
  inviteUser: (
    email: string,
    role: string,
    workspaceAccess: any
  ) => Promise<any>;
  orgUsers: any;
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

    console.log({ resulttttttttt:result });

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
    console.log({orgUsers});
    
  }, []);



    // setOrganizations(result.data);


  return (
    <ChannelContext.Provider
      value={{
        

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
