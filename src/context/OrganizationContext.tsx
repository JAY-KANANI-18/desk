import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { authApi } from "../lib/authApi";
import {
  organizationApi,
  type OrganizationSetupOnboardingData,
} from "../lib/organizationApi";
import { useAuth } from "./AuthContext";

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
  updateUser: (
    email: string,
    role: string,
    workspaceAccess: any
  ) => Promise<any>;
  orgUsers: any;
  updateOrganization: (id: string, payload: any) => Promise<any>;
  refreshOrganizationsUsers: () => Promise<any>;
  organizationSetup: (
    organizationName: string,
    workspaceName?: string,
    onboardingData?: OrganizationSetupOnboardingData,
  ) => Promise<any>;
  setActiveOrganizationFunc: (org: Organization) => void;
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
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (user) {
      console.log("organization change", organizations);
      authApi.getOrganizations().then((u) => {
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

  const organizationSetup = useCallback(
    async (
      organizationName: string,
      workspaceName?: string,
      onboardingData?: OrganizationSetupOnboardingData,
    ) => {
      const result = await organizationApi.setup(
        organizationName,
        workspaceName ?? organizationName,
        onboardingData,
      );
      return result;
    },
    []
  );
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
  const updateUser = useCallback(
    async (email: string, role: string, workspaceAccess: any) => {
      const result = await organizationApi.updateUser(
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
  };

  const refreshOrganizationsUsers = useCallback(async () => {
    const result = await organizationApi.getusers(activeOrganization?.id);
    setOrgUsers(result);
    console.log({ orgUsers });
  }, [activeOrganization]);

  const updateOrganization = async (id: string, payload: any) => {
    const res = await organizationApi.updateOrganization(id, payload);

    setOrganizations((prev) =>
      prev.map((org) => (org.id === id ? res.data : org))
    );

    setActiveOrganization((prev) =>
      prev?.id === id ? res.data : prev
    );

    return res.data;
  };

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
        updateUser,
        orgUsers,
        updateOrganization,
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
