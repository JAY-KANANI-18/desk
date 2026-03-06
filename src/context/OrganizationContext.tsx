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
const OrganizationContext = createContext<OrganizationContextType | null>(null);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [organizations, setOrganizations] = useState<any[] | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [activeOrganization, setActiveOrganization] = useState<any>();
  const [orgUsers, setOrgUsers] = useState<any>();

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      organizationApi.me().then((u) => {
        console.log({ u });
        setOrgLoading(false);
        setOrganizations(u);

        // refreshOrganizations();
      });

      return;
    } else {
      setOrgLoading(false);
    }
  }, [user]);

  // setOrgsLoaded(true);
  // setOrganizations(orgs);
  // setWorkspaces(workspaces);

  const organizationSetup = useCallback(async (organizationName: string) => {
    const result = await organizationApi.setup(
      organizationName,
      "Default Workspace"
    );
    return result;
  }, []);
  const refreshOrganizations = useCallback(async () => {
    setOrgLoading(true);
    const result = await organizationApi.me();

    console.log({ resulttttttttt:result });
    setOrganizations(result);
    setOrgLoading(false);

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
    setActiveOrganization(org);
    localStorage.setItem("active_organization", JSON.stringify(org));
  }

  const refreshOrganizationsUsers = useCallback(async () => {
    const result = await organizationApi.getusers(activeOrganization.id);
    setOrgUsers(result);
    console.log({orgUsers});
    
  }, [activeOrganization]);



    // setOrganizations(result.data);

  useEffect(() => {
    // console.log({ organizations });
  }, [organizations]);
  return (
    <OrganizationContext.Provider
      value={{
        orgLoading,
        organizations,
        activeOrganization,
        inviteUser,
        orgUsers,
        setActiveOrganizationFunc,
        refreshOrganizationsUsers,
        organizationSetup,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
