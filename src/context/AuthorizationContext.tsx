import React, { createContext, useContext, useMemo, useCallback } from "react";
import { useAuth } from "./AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// ROLES
// Hierarchy (highest → lowest): owner > admin > supervisor > agent
// ─────────────────────────────────────────────────────────────────────────────
export type Role = "owner" | "admin" | "supervisor" | "agent";

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSIONS
// Fine-grained capabilities checked via can(permission).
// ─────────────────────────────────────────────────────────────────────────────
export type Permission =
  // Inbox
  | "inbox.view"
  | "inbox.assign"
  | "inbox.resolve"
  | "inbox.delete"
  // Contacts
  | "contacts.view"
  | "contacts.edit"
  | "contacts.delete"
  | "contacts.import"
  // Broadcast
  | "broadcast.view"
  | "broadcast.send"
  // Workflows
  | "workflows.view"
  | "workflows.manage"
  // Reports
  | "reports.view"
  | "reports.export"
  // Channels
  | "channels.view"
  | "channels.manage"
  // Team
  | "team.view"
  | "team.manage"
  // Billing
  | "billing.view"
  | "billing.manage"
  // Workspace
  | "workspace.settings";

// ─────────────────────────────────────────────────────────────────────────────
// ROLE → PERMISSIONS MAP
// Edit this object to adjust what each role can do.
// When DUMMY_MODE = false, the role comes from user_metadata.role in Supabase.
// ─────────────────────────────────────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    "inbox.view",
    "inbox.assign",
    "inbox.resolve",
    "inbox.delete",
    "contacts.view",
    "contacts.edit",
    "contacts.delete",
    "contacts.import",
    "broadcast.view",
    "broadcast.send",
    "workflows.view",
    "workflows.manage",
    "reports.view",
    "reports.export",
    "channels.view",
    "channels.manage",
    "team.view",
    "team.manage",
    "billing.view",
    "billing.manage",
    "workspace.settings",
  ],
  admin: [
    "inbox.view",
    "inbox.assign",
    "inbox.resolve",
    "inbox.delete",
    "contacts.view",
    "contacts.edit",
    "contacts.delete",
    "contacts.import",
    "broadcast.view",
    "broadcast.send",
    "workflows.view",
    "workflows.manage",
    "reports.view",
    "reports.export",
    "channels.view",
    "channels.manage",
    "team.view",
    "team.manage",
    "billing.view",
    "workspace.settings",
  ],
  supervisor: [
    "inbox.view",
    "inbox.assign",
    "inbox.resolve",
    "contacts.view",
    "contacts.edit",
    "broadcast.view",
    "broadcast.send",
    "workflows.view",
    "reports.view",
    "channels.view",
    "team.view",
  ],
  agent: [
    "inbox.view",
    "inbox.resolve",
    "contacts.view",
    "broadcast.view",
    "workflows.view",
    "reports.view",
    "channels.view",
    "team.view",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────────────────
interface AuthorizationContextType {
  /** The current user's role, or null if not authenticated. */
  role: Role | null;
  /** All permissions granted to the current role. */
  permissions: Permission[];
  /** Returns true if the current user has the given permission. */
  can: (permission: Permission) => boolean;
  /** Returns true if the current user has one of the given roles. */
  hasRole: (role: Role | Role[]) => boolean;
}

const AuthorizationContext = createContext<AuthorizationContextType | null>(
  null
);

//
export const AuthorizationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  const role = useMemo<Role | null>(() => {
    if (!user) return null;
    const r = user.role as Role;
    return ROLE_PERMISSIONS[r] ? r : "agent";
  }, [user]);

  const permissions = useMemo<Permission[]>(() => {
    if (!role) return [];
    return ROLE_PERMISSIONS[role] ?? [];
  }, [role]);

  const can = useCallback(
    (permission: Permission) => permissions.includes(permission),
    [permissions]
  );

  const hasRole = useCallback(
    (r: Role | Role[]) => {
      if (!role) return false;
      return Array.isArray(r) ? r.includes(role) : role === r;
    },
    [role]
  );

  return (
    <AuthorizationContext.Provider value={{ role, permissions, can, hasRole }}>
      {children}
    </AuthorizationContext.Provider>
  );
};

export const useAuthorization = () => {
  const ctx = useContext(AuthorizationContext);
  if (!ctx)
    throw new Error(
      "useAuthorization must be used within AuthorizationProvider"
    );
  return ctx;
};

// ─────────────────────────────────────────────────────────────────────────────
// ROLE GUARD
// Inline component for conditional rendering based on permissions / roles.
//
// Usage:
//   <RoleGuard permission="billing.manage">
//     <BillingButton />
//   </RoleGuard>
//
//   <RoleGuard role={['owner', 'admin']} fallback={<p>Admins only</p>}>
//     <AdminPanel />
//   </RoleGuard>
// ─────────────────────────────────────────────────────────────────────────────
interface RoleGuardProps {
  permission?: Permission;
  role?: Role | Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  permission,
  role,
  children,
  fallback = null,
}) => {
  const { can, hasRole } = useAuthorization();
  if (permission && !can(permission)) return <>{fallback}</>;
  if (role && !hasRole(role)) return <>{fallback}</>;
  return <>{children}</>;
};
