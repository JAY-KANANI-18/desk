import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

import { authApi } from "../lib/authApi";
import type { AuthUser } from "../lib/authApi";
import { useNavigate } from "react-router-dom";

// ─── Domain user type ─────────────────────────────────────────────────────────
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  role: string;
  activityStatus?: string;
  organizations?: any[];
}

// ─── Context shape ────────────────────────────────────────────────────────────
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  pendingEmail: string;
  authFlow: "signup" | "forgot-password" | null;
  passwordSet: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string,
    orgData?: Record<string, string>,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loginWithGoogle: () => Promise<void>;
  forgotPassword: (
    email: string,
  ) => Promise<{ success: boolean; error?: string }>;
  verifyCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  resendCode: () => Promise<void>;
  resetPassword: (
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  setPendingEmail: (email: string) => void;
  organizationSetup: (
    organizationName: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toUser = (u: AuthUser | User): User => ({
  id: u.id,
  firstName: "",
  lastName: "",
  email: u.email,
  role: u.role,
  ...((u as any)?.avatarUrl && { avatarUrl: (u as any).avatarUrl }),
});

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [passwordSet, setPasswordSet] = useState(false);
  const [authFlow, setAuthFlow] = useState<"signup" | "forgot-password" | null>(
    null,
  );
  const navigate = useNavigate();

  // ── Apply / clear session ──────────────────────────────────────────────────
  const applyUser = useCallback((u: AuthUser | null) => {
    if (u) {
      setUser((prev) => ({
        ...prev,
        ...toUser(u),
      }));
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      console.log("REFRSH USER CALL");
      
      const result = await authApi.getUser();

      if (result.success && result.data) {
        setUser((prev) => ({
          ...(prev || {}),
          ...result.data,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  }, []);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { user: u, session } = await authApi.getSession();

        console.log("INIT SESSION", { session, user: u });

        // ❌ No valid session
        if (!session) {
          applyUser(null);
          setPasswordSet(false);
          return;
        }

        // ✅ Valid session
        setPasswordSet(session.user?.user_metadata?.passwordSet ?? false);
        applyUser(u);

        // Only fetch backend user if session is valid
        await refreshUser();
      } catch (e) {
        console.error("Auth init failed", e);
        applyUser(null);
        setPasswordSet(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const unsubscribe = authApi.onAuthStateChange(async (u, session) => {
      console.log("AUTH STATE CHANGED", { u, session });

      if (!session) {
        applyUser(null);
        setPasswordSet(false);
        return;
      }

      setPasswordSet(session.user?.user_metadata?.passwordSet ?? false);
      applyUser(u);

      try {
        await refreshUser();
      } catch (err) {
        console.error("refreshUser failed after auth change", err);
      }
    });

    return unsubscribe;
  }, [applyUser, refreshUser]);

  // ── Auth actions ───────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authApi.login(email, password);

      // ❌ REMOVE localStorage token storage
      // localStorage.setItem("access_token", JSON.stringify(result.access_token));
      console.log("LOGIN")
      console.log({ result });

      if (result.success && result.user) {
        applyUser(result.user);

        const { session } = await authApi.getSession();
        setPasswordSet(session?.user?.user_metadata?.passwordSet ?? false);

        await refreshUser();
      }

      return { success: result.success, error: result.error };
    },
    [applyUser, refreshUser],
  );

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      orgData?: Record<string, string>,
    ) => {
      const result = await authApi.signup(name, email, password, orgData);

      if (result.success) {
        setPendingEmail(email);
        setAuthFlow("signup");
      }

      return result;
    },
    [],
  );

  const loginWithGoogle = useCallback(async () => {
    await authApi.loginWithGoogle();
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const result = await authApi.forgotPassword(email);

    if (result.success) {
      setPendingEmail(email);
      setAuthFlow("forgot-password");
    }

    return result;
  }, []);

  const verifyCode = useCallback(
    async (code: string) => {
      const result = await authApi.verifyCode(code, pendingEmail, authFlow);
      console.log({ authFlow });

      if (authFlow === "forgot-password") {
        return { success: result.success, error: result.error };
      }

      console.log({ authFlow: "next" });

      if (result.success && result.user) {
        applyUser(result.user);

        const { session } = await authApi.getSession();
        setPasswordSet(session?.user?.user_metadata?.passwordSet ?? false);

        // if (authFlow === "signup") {
        //   await authApi.organizationSetup(pendingEmail, "Default Workspace");
        // }
      }

      return { success: result.success, error: result.error };
    },
    [authFlow, pendingEmail, applyUser],
  );

  const resendCode = useCallback(async () => {
    await authApi.resendCode(pendingEmail, authFlow);
  }, [authFlow, pendingEmail]);

  const resetPassword = useCallback(async (newPassword: string) => {
    const result = await authApi.resetPassword(newPassword);

    if (result.success) {
      setAuthFlow(null);
      setPendingEmail("");

      const { session } = await authApi.getSession();
      setPasswordSet(session?.user?.user_metadata?.passwordSet ?? false);
    }

    return result;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    applyUser(null);
    setPasswordSet(false);
    localStorage.removeItem("active_workspace"); // add
    localStorage.removeItem("active_organization"); // add

    // ❌ REMOVE manual token cleanup if no longer used
    // localStorage.removeItem("access_token");
  }, [applyUser]);

  const organizationSetup = useCallback(async (organizationName: string) => {
    const result = await authApi.organizationSetup(
      organizationName,
      "Default Workspace",
    );
    return result;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        pendingEmail,
        authFlow,
        passwordSet,
        login,
        signup,
        logout,
        loginWithGoogle,
        forgotPassword,
        verifyCode,
        resendCode,
        resetPassword,
        setPendingEmail,
        organizationSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
