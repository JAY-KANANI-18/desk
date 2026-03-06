// src/components/PublicOnlyRoute.tsx

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const PublicOnlyRoute = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const { organizations } = useAuth();

  if (!user) return <>{children}</>;

  // If logged in + has org → go to inbox
  if (organizations.length > 0) {
    return <Navigate to="/inbox" replace />;
  }

  // If logged in but no org → go onboarding
  return <Navigate to="/onboarding" replace />;
};
