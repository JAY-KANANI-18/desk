import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import {
  useAuthorization,
  type OrgPermission,
  type WorkspacePermission,
} from "../context/AuthorizationContext";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: ReactNode;
  org?: OrgPermission | OrgPermission[];
  ws?: WorkspacePermission | WorkspacePermission[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  org,
  ws,
  redirectTo = "/inbox",
}: Props) {
  const { user } = useAuth();
  const { canOrg, canWs } = useAuthorization();

  if (!user) return <Navigate to="/login" replace />;

  if (org) {
    const perms = Array.isArray(org) ? org : [org];
    if (!canOrg(...perms)) return <Navigate to={redirectTo} replace />;
  }

  if (ws) {
    const perms = Array.isArray(ws) ? ws : [ws];
    if (!canWs(...perms)) return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
