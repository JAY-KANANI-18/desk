import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { authApi } from "../lib/authApi";
import type { AuthUser } from "../lib/authApi";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  role: string;
  activityStatus?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  passwordSet: boolean;
  pendingEmail: string;
  authFlow: "signup" | "forgot-password" | null;
  setUserOnce:(data:User | null) => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, orgData?: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loginWithGoogle: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  resendCode: () => Promise<void>;
  resetPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  setPendingEmail: (email: string) => void;
  organizationSetup: (
    organizationName: string,
    workspaceName?: string,
    onboardingData?: Record<string, unknown>
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading]       = useState(true);
  const [user, setUser]                 = useState<User | null>(null);
  const [passwordSet, setPasswordSet]   = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [authFlow, setAuthFlow]         = useState<"signup" | "forgot-password" | null>(null);

  // Prevent double-init from StrictMode
  const initialized = useRef(false);

  // ── Single setter — only updates if data actually changed ──────────────────
  const setUserOnce = useCallback((incoming: User | null) => {
    setUser(prev => {
      if (!incoming) return null;
      // shallow compare — skip rerender if nothing changed
      if (
        prev?.id === incoming.id &&
        prev?.firstName === incoming.firstName &&
        prev?.lastName === incoming.lastName &&
        prev?.email === incoming.email &&
        prev?.role === incoming.role &&
        prev?.avatarUrl === incoming.avatarUrl &&
        prev?.activityStatus === incoming.activityStatus
      ) {
        return prev; // same reference = no rerender
      }
      return incoming;
    });
  }, []);

  // ── Bootstrap — runs once ──────────────────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initAuth = async () => {
      try {
        const { user: u, session } = await authApi.getSession();

        if (!session) {
          setUser(null);
          setPasswordSet(false);
          return;
        }

        setPasswordSet(session.user?.user_metadata?.passwordSet ?? false);

        // One single API call — get the full backend user
        const backendUser = await authApi.getUser();
        setUserOnce(backendUser);

      } catch (e) {
        console.error('Auth init failed', e);
        setUser(null);
        setPasswordSet(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Only listen for SIGN_OUT — ignore other events to prevent rerender loops
    const unsubscribe = authApi.onAuthStateChange(async (u, session) => {
      if (!session) {
        setUser(null);
        setPasswordSet(false);
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [setUserOnce]);

  // ── Login — one flow, one setUser call ────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);

    if (result.success) {
      const { session } = await authApi.getSession();
      setPasswordSet(session?.user?.user_metadata?.passwordSet ?? false);

      // One call to get full user — not applyUser + refreshUser
      const backendUser = await authApi.getUser();
      setUserOnce(backendUser);
    }

    return { success: result.success, error: result.error };
  }, [setUserOnce]);

  // ── Logout — clear everything ──────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setPasswordSet(false);
    localStorage.removeItem(`activeOrgId`);
    // workspace localStorage cleared in WorkspaceContext via user=null
  }, []);

  const signup = useCallback(async (
    name: string, email: string, password: string, orgData?: Record<string, string>
  ) => {
    const result = await authApi.signup(name, email, password, orgData);
    if (result.success) {
      setPendingEmail(email);
      setAuthFlow('signup');
    }
    return result;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await authApi.loginWithGoogle();
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const result = await authApi.forgotPassword(email);
    if (result.success) {
      setPendingEmail(email);
      setAuthFlow('forgot-password');
    }
    return result;
  }, []);

  const verifyCode = useCallback(async (code: string) => {
    const result = await authApi.verifyCode(code, pendingEmail, authFlow);

    if (authFlow === 'forgot-password') {
      return { success: result.success, error: result.error };
    }

    if (result.success && result.user) {
      const { session } = await authApi.getSession();
      setPasswordSet(session?.user?.user_metadata?.passwordSet ?? false);
      const backendUser = await authApi.getUser();
      setUserOnce(backendUser);
    }

    return { success: result.success, error: result.error };
  }, [authFlow, pendingEmail, setUserOnce]);

  const resendCode = useCallback(async () => {
    await authApi.resendCode(pendingEmail, authFlow);
  }, [authFlow, pendingEmail]);

  const resetPassword = useCallback(async (newPassword: string) => {
    const result = await authApi.resetPassword(newPassword);
    if (result.success) {
      setAuthFlow(null);
      setPendingEmail('');
      const { session } = await authApi.getSession();
      setPasswordSet(session?.user?.user_metadata?.passwordSet ?? false);
    }
    return result;
  }, []);


  const organizationSetup = useCallback(
    async (
      organizationName: string,
      workspaceName?: string,
      onboardingData?: Record<string, unknown>,
    ) => {
      return authApi.organizationSetup(
        organizationName,
        workspaceName ?? organizationName,
        onboardingData,
      );
    },
    []
  );

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!user,   // ← derived from user, not separate state
      isLoading,
      user,
      passwordSet,
      pendingEmail,
      authFlow,
      setUserOnce,
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
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
