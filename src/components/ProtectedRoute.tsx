import React from "react";
import { Navigate } from "react-router-dom";
import {
  useAuthorization,
  OrgPermission,
  WorkspacePermission,
} from "../context/AuthorizationContext";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: React.ReactNode;
  org?: OrgPermission | OrgPermission[];
  ws?: WorkspacePermission | WorkspacePermission[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<Props> = ({
  children,
  org,
  ws,
  redirectTo = "/inbox",
}) => {
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
};

export default ProtectedRoute;