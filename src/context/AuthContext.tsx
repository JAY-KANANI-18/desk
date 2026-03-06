import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { authApi } from "../lib/authApi";
import type { AuthUser } from "../lib/authApi";

// ─── Domain user type ─────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

// ─── Context shape ────────────────────────────────────────────────────────────
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  pendingEmail: string;
  authFlow: "signup" | "forgot-password" | null;
  orgsLoaded: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    orgData?: Record<string, string>
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loginWithGoogle: () => Promise<void>;
  forgotPassword: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  verifyCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  resendCode: () => Promise<void>;
  resetPassword: (
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  setPendingEmail: (email: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toUser = (u: AuthUser): User => ({
  id: u.id,
  name: u.name,
  email: u.email,
  avatar: u.name.slice(0, 2).toUpperCase(),
  role: u.role,
});

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

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [authFlow, setAuthFlow] = useState<"signup" | "forgot-password" | null>(
    null
  );

  // ── Apply / clear session ──────────────────────────────────────────────────
  const applyUser = useCallback((u: AuthUser | null) => {
    if (u) {
      setUser(toUser(u));
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  //
  // const refreshOrganizations = useCallback(async () => {
  //   try {
  //     const result = await authApi.getOrganizations();

  //     if (result.success && result.data) {
  //       console.log(result.data);

  //       // setOrganizations(result.data.data);
  //       if (result.success && result.data?.data?.length) {
  //         const orgs = result.data.data;
  //         setOrganizations(orgs);

  //         if (!activeWorkspace) {
  //           const firstOrg = orgs[0];
  //           const firstWs = firstOrg.workspaces?.[0];

  //           if (firstWs) {
  //             setActiveOrganization(firstOrg);
  //             setActiveWorkspace(firstWs);
  //           }
  //         }
  //       }
  //       console.log("seetled");
  //     } else {
  //       setOrganizations([]);
  //     }

  //     setOrgsLoaded(true);
  //   } catch (err) {
  //     console.error("Failed to fetch organizations", err);
  //     setOrganizations([]);
  //     setOrgsLoaded(true);
  //   }
  // }, []);

  const refreshUser = useCallback(async () => {
    try {
      const result = await authApi.getUser();

      if (result.success && result.data) {
        console.log(result.data);

        setUser(result.data);

        let workspaces: Workspace[] = [];

        if (result.data?.organizations) {
        }
      }
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  }, []);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    authApi
      .getSession()
      .then((u) => {
        applyUser(u);
        setIsLoading(false);
        refreshUser();
        // refreshOrganizations();
      })
      .catch((e) => {
        console.log({ e });

        setIsLoading(false);
      });

    const unsubscribe = authApi.onAuthStateChange((u) => {
      applyUser(u);
    });

    return unsubscribe;
  }, [applyUser]);

  // ── Auth actions ───────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authApi.login(email, password);
      localStorage.setItem("access_token", JSON.stringify(result.access_token));

      if (result.success && result.user) applyUser(result.user);

      return { success: result.success, error: result.error };
    },
    [applyUser]
  );

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      orgData?: Record<string, string>
    ) => {
      const result = await authApi.signup(name, email, password, orgData);
      if (result.success) {
        setPendingEmail(email);
        setAuthFlow("signup");
      }
      return result;
    },
    []
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

      if (authFlow === "signup") {
        await authApi.organizationSetup(
          pendingEmail,
          code,
          result.access_token
        );
      }
      if (result.success && result.user) applyUser(result.user);

      return { success: result.success, error: result.error };
    },
    [authFlow, pendingEmail, applyUser]
  );

  const resendCode = useCallback(async () => {
    await authApi.resendCode(pendingEmail, authFlow);
  }, [authFlow, pendingEmail]);

  const resetPassword = useCallback(async (newPassword: string) => {
    const result = await authApi.resetPassword(newPassword);
    if (result.success) {
      setAuthFlow(null);
      setPendingEmail("");
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    applyUser(null);
    localStorage.removeItem("access_token");
  }, [applyUser]);

  const organizationSetup = useCallback(async (organizationName: string) => {
    const result = await authApi.organizationSetup(
      organizationName,
      "Default Workspace",
      localStorage.getItem("access_token")
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
        // refreshOrganizations,
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
