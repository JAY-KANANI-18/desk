const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const DUMMY_MODE = false;
export const MOCK_USERS: (AuthUser & { password: string })[] = [];

type AuthSession = {
  access_token: string;
  expires_at: number;
  expires_in: number;
  token_type: "Bearer";
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name?: string;
      name?: string;
      role?: string;
      passwordSet?: boolean;
      emailVerified?: boolean;
      currentOrganizationId?: string | null;
      currentWorkspaceId?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      avatarUrl?: string | null;
    };
  };
};

type AuthEnvelope = {
  session: AuthSession | null;
  user: AuthUser | null;
  csrfToken?: string | null;
  accessToken?: string | null;
};

let currentSession: AuthSession | null = null;
let currentUser: AuthUser | null = null;
let csrfToken: string | null = null;
let refreshPromise: Promise<AuthEnvelope> | null = null;
const listeners = new Set<(user: AuthUser | null, session: AuthSession | null) => void>();

function notify() {
  for (const listener of listeners) {
    listener(currentUser, currentSession);
  }
}

function applyEnvelope(payload: AuthEnvelope) {
  currentSession = payload.session;
  currentUser = payload.user ?? (payload.session ? fromSession(payload.session) : null);
  csrfToken = payload.csrfToken ?? csrfToken;
  notify();
  return {
    session: currentSession,
    user: currentUser,
  };
}

function clearAuthState() {
  currentSession = null;
  currentUser = null;
  csrfToken = null;
  notify();
}

function fromSession(session: AuthSession): AuthUser {
  return {
    id: session.user.id,
    email: session.user.email,
    name:
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      session.user.email.split("@")[0] ||
      "User",
    role: session.user.user_metadata?.role ?? "agent",
  };
}

async function authFetch(path: string, options: RequestInit = {}, requireAuth = false) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (
    options.body &&
    typeof FormData !== "undefined" &&
    !(options.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  if (requireAuth) {
    const token = await authApi.getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || "Request failed");
  }

  return payload?.data ?? payload;
}

async function ensureSession(forceRefresh = false): Promise<AuthEnvelope> {
  const now = Math.floor(Date.now() / 1000);
  const isFresh = currentSession && currentSession.expires_at - 30 > now;

  if (!forceRefresh && isFresh) {
    return {
      session: currentSession,
      user: currentUser,
      csrfToken,
      accessToken: currentSession?.access_token,
    };
  }

  if (!refreshPromise) {
    refreshPromise = authFetch("/auth/session", {
      method: "GET",
      headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
    }).then((payload) => {
      if (!payload?.session) {
        clearAuthState();
        return {
          session: null,
          user: null,
          csrfToken: null,
          accessToken: null,
        };
      }

      applyEnvelope(payload);
      return payload as AuthEnvelope;
    }).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export const authApi = {
  getSession: async (): Promise<{ session: AuthSession | null; user: AuthUser | null }> => {
    const result = await ensureSession();
    return {
      session: result.session ?? null,
      user: result.user ?? null,
    };
  },

  getAccessToken: async (): Promise<string | null> => {
    const result = await ensureSession();
    return result.session?.access_token ?? null;
  },

  refreshSession: async () => {
    const payload = await authFetch(
      "/auth/refresh",
      {
        method: "POST",
        headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
      },
      false,
    );

    applyEnvelope(payload);
    return payload as AuthEnvelope;
  },

  onAuthStateChange: (
    callback: (user: AuthUser | null, session: AuthSession | null) => void
  ): (() => void) => {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },

  login: async (
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    error?: string;
    user?: AuthUser;
    session?: AuthSession;
  }> => {
    try {
      const payload = await authFetch("/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const { session, user } = applyEnvelope(payload);
      return { success: true, user: user ?? undefined, session: session ?? undefined };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Login failed" };
    }
  },

  signup: async (
    email: string,
    password: string,
    _orgData?: any
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await authFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Sign up failed" };
    }
  },

  loginWithGoogle: async (): Promise<void> => {
    const redirectTo = `${window.location.origin}/inbox`;
    window.location.href = `${API_BASE}/auth/oauth/google/start?redirectTo=${encodeURIComponent(redirectTo)}`;
  },

  forgotPassword: async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await authFetch("/auth/password/forgot", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Request failed" };
    }
  },

  verifyCode: async (
    code: string,
    email: string,
    flow: "signup" | "forgot-password" | null
  ): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
    try {
      const payload = await authFetch("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({
          email,
          code,
          flow: flow ?? "signup",
        }),
      });
      const { user } = applyEnvelope(payload);
      return {
        success: true,
        user: user ?? undefined,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Verification failed" };
    }
  },

  resendCode: async (
    email: string,
    flow: "signup" | "forgot-password" | null
  ): Promise<void> => {
    await authFetch("/auth/otp/resend", {
      method: "POST",
      body: JSON.stringify({
        email,
        flow: flow ?? "signup",
      }),
    });
  },

  resetPassword: async (
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload = await authFetch(
        "/auth/password/reset",
        {
          method: "POST",
          body: JSON.stringify({ newPassword }),
        },
        true,
      );

      if (payload?.session) {
        applyEnvelope(payload);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Reset failed" };
    }
  },

  organizationSetup: async (
    organizationName: string,
    workspaceName: string,
    onboardingData?: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await authFetch(
        "/organizations/setup",
        {
          method: "POST",
          body: JSON.stringify({
            organizationName,
            workspaceName,
            onboardingData,
          }),
        },
        true,
      );

      await authApi.refreshSession();

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to setup organization" };
    }
  },

  getOrganizations: async () => authFetch("/user/organizations", { method: "GET" }, true),

  getUser: async () => authFetch("/user", { method: "GET" }, true),

  getWorkspace: async () => authFetch("/user/workspaces", { method: "GET" }, true),

  logout: async (): Promise<void> => {
    try {
      await authFetch("/auth/signout", { method: "POST" }, true);
    } catch {
      // best effort
    } finally {
      clearAuthState();
      localStorage.clear();
    }
  },
};

(authApi as any).signUp = authApi.signup;
(authApi as any).signIn = authApi.login;
(authApi as any).signOut = authApi.logout;
(authApi as any).verifyOtp = authApi.verifyCode;
(authApi as any).signInWithGoogle = authApi.loginWithGoogle;
