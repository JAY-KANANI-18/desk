import { Navigate } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAuthorization } from "../context/AuthorizationContext";
import type { Permission } from "../context/AuthorizationContext";
import { useEffect } from "react";
import { authApi } from "../lib/authApi";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Optional permission required to access this route.
   * If the user is authenticated but lacks the permission, an "Access Denied"
   * screen is shown instead of redirecting to login.
   *
   * Example: <ProtectedRoute permission="billing.manage">…</ProtectedRoute>
   */
  permission?: Permission;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
}) => {
  const { isAuthenticated, isLoading, user, organizations, orgsLoaded } =
    useAuth();
  const { can } = useAuthorization();

  // 🚀 Fetch orgs once when entering protected area

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // ⏳ Wait until orgs loaded
  if (user && !orgsLoaded) {
    return null; // or loading spinner
  }

  const isOnboardingPage = location.pathname.startsWith("/onboarding");


  // 🚀 Logged in but no org → force onboarding
  if (organizations?.length === 0 && !isOnboardingPage) {
    return <Navigate to="/onboarding" replace />;
  }

  // 🔐 Permission check (only after onboarding)
  if (organizations?.length > 0 && isOnboardingPage) {
    return <Navigate to="/dashboard" replace />;
  }

  // if (permission && !can(permission)) {
  //   return (
  //     <div className="flex-1 flex items-center justify-center min-h-[60vh]">
  //       <div className="text-center px-6">
  //         <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
  //           <ShieldOff className="text-red-500" size={28} />
  //         </div>
  //         <h2 className="text-xl font-bold text-gray-900 mb-2">
  //           Access Denied
  //         </h2>
  //         <p className="text-gray-500 text-sm max-w-xs">
  //           You don't have permission to view this page. Contact your workspace
  //           admin if you think this is a mistake.
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  return <>{children}</>;
};
