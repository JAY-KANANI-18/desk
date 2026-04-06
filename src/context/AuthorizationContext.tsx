import React, {
  createContext, useContext, useMemo, useCallback,
} from "react";
import { useOrganization } from "./OrganizationContext";
import { useWorkspace } from "./WorkspaceContext";
import { useAuth } from "./AuthContext";

// ── Org level ──────────────────────────────────────────────
export type OrgRole =
  | "ORG_ADMIN"
  | "ORG_BILLING_ADMIN"
  | "ORG_USER_ADMIN"
  | "ORG_MEMBER";

export type OrgPermission =
  | "org:settings:manage" | "org:settings:view"
  | "org:delete"
  | "org:billing:manage" | "org:billing:view"
  | "org:subscription:cancel"
  | "org:users:manage"   | "org:users:view"
  | "org:workspaces:manage" | "org:workspaces:view";

const ORG_ROLE_PERMISSIONS: Record<OrgRole, OrgPermission[]> = {
  ORG_ADMIN: [
    "org:settings:manage", "org:settings:view", "org:delete",
    "org:billing:manage",  "org:billing:view",  "org:subscription:cancel",
    "org:users:manage",    "org:users:view",
    "org:workspaces:manage", "org:workspaces:view",
  ],
  ORG_BILLING_ADMIN: [
    "org:settings:view",
    "org:billing:manage", "org:billing:view",
    "org:users:view", "org:workspaces:view",
  ],
  ORG_USER_ADMIN: [
    "org:settings:view", "org:billing:view",
    "org:users:manage", "org:users:view",
    "org:workspaces:manage", "org:workspaces:view",
  ],
  ORG_MEMBER: [],
};

// ── Workspace level ────────────────────────────────────────
export type WorkspaceRole = "WS_OWNER" | "WS_MANAGER" | "WS_AGENT";

export type WorkspacePermission =
  | "ws:dashboard:view"
  | "ws:contacts:view"   | "ws:contacts:manage"
  | "ws:messages:view"   | "ws:messages:send"
  | "ws:shortcuts:use"   | "ws:shortcuts:manage"
  | "ws:broadcasts:view" | "ws:broadcasts:send"
  | "ws:reports:view"
  | "ws:settings:view"   | "ws:settings:manage" | "ws:settings:limited"
  | "ws:profile:manage"  | "ws:notifications:manage"
  | "ws:teams:manage"
  | "ws:workflows:view"  | "ws:workflows:manage"
  | "ws:channels:manage"
  | "ws:files:access";

const WS_ROLE_PERMISSIONS: Record<WorkspaceRole, WorkspacePermission[]> = {
  WS_OWNER: [
    "ws:dashboard:view",
    "ws:contacts:view",    "ws:contacts:manage",
    "ws:messages:view",    "ws:messages:send",
    "ws:shortcuts:use",    "ws:shortcuts:manage",
    "ws:broadcasts:view",  "ws:broadcasts:send",
    "ws:reports:view",
    "ws:settings:view",    "ws:settings:manage",  "ws:settings:limited",
    "ws:profile:manage",   "ws:notifications:manage",
    "ws:teams:manage",
    "ws:workflows:view",   "ws:workflows:manage",
    "ws:channels:manage",  "ws:files:access",
  ],
  WS_MANAGER: [
    "ws:dashboard:view",
    "ws:contacts:view",    "ws:contacts:manage",
    "ws:messages:view",    "ws:messages:send",
    "ws:shortcuts:use",    "ws:shortcuts:manage",
    "ws:broadcasts:view",  "ws:broadcasts:send",
    "ws:reports:view",
    "ws:settings:view",    "ws:settings:limited",
    "ws:profile:manage",   "ws:notifications:manage",
    "ws:workflows:view",   "ws:files:access",
  ],
  WS_AGENT: [
    "ws:messages:view",    "ws:messages:send",
    "ws:shortcuts:use",
    "ws:profile:manage",   "ws:notifications:manage",
  ],
};

// ── Context ────────────────────────────────────────────────
interface AuthorizationContextType {
  orgRole: OrgRole | null;
  workspaceRole: WorkspaceRole | null;
  canOrg: (...p: OrgPermission[]) => boolean;
  canWs: (...p: WorkspacePermission[]) => boolean;
  isOrgAdmin: boolean;
  isWsOwner: boolean;
}

const AuthorizationContext = createContext<AuthorizationContextType | null>(null);

export const AuthorizationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { activeOrganization } = useOrganization();
  const { activeWorkspace } = useWorkspace();
  const {user} = useAuth()
  console.log({activeWorkspace,activeOrganization});

  // Expect activeOrganization to carry myRole, e.g. activeOrganization.myRole
  const orgRole = (activeOrganization?.role ?? null) as OrgRole | null;

  // Expect activeWorkspace to carry myRole, e.g. activeWorkspace.myRole
  
  const workspaceRole = ((activeWorkspace?.members?.find((m:any)=> m.userId == user.id))?.role ?? null) as WorkspaceRole | null;

  const canOrg = useCallback(
    (...permissions: OrgPermission[]): boolean => {
      if (!orgRole) return false;
      const granted = ORG_ROLE_PERMISSIONS[orgRole] ?? [];
      return permissions.every(p => granted.includes(p));
    },
    [orgRole],
  );

  const canWs = useCallback(
    (...permissions: WorkspacePermission[]): boolean => {
      // if (orgRole === "ORG_ADMIN") return true; // org admins bypass ws restrictions
      if (!workspaceRole) return false;
      const granted = WS_ROLE_PERMISSIONS[workspaceRole] ?? [];
      return permissions.every(p => granted.includes(p));
    },
    [orgRole, workspaceRole],
  );

  const value = useMemo(() => ({
    orgRole,
    workspaceRole,
    canOrg,
    canWs,
    isOrgAdmin: orgRole === "ORG_ADMIN",
    isWsOwner: workspaceRole === "WS_OWNER",
  }), [orgRole, workspaceRole, canOrg, canWs]);

  return (
    <AuthorizationContext.Provider value={value}>
      {children}
    </AuthorizationContext.Provider>
  );
};

export const useAuthorization = () => {
  const ctx = useContext(AuthorizationContext);
  if (!ctx) throw new Error("useAuthorization must be inside AuthorizationProvider");
  return ctx;
};

// ── Guards ─────────────────────────────────────────────────
interface OrgGuardProps {
  permission: OrgPermission | OrgPermission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const OrgGuard: React.FC<OrgGuardProps> = ({
  permission, children, fallback = null,
}) => {
  const { canOrg } = useAuthorization();
  const perms = Array.isArray(permission) ? permission : [permission];
  return canOrg(...perms) ? <>{children}</> : <>{fallback}</>;
};

interface WsGuardProps {
  permission: WorkspacePermission | WorkspacePermission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const WsGuard: React.FC<WsGuardProps> = ({
  permission, children, fallback = null,
}) => {
  const { canWs } = useAuthorization();
  const perms = Array.isArray(permission) ? permission : [permission];
  return canWs(...perms) ? <>{children}</> : <>{fallback}</>;
};