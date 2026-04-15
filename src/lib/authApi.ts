import { supabase } from "./supabase";
import { apiFetch } from "./apiClient";
import { api } from "./api";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const DUMMY_MODE = false;

// ─── Mock users ───────────────────────────────────────────────────────────────
// Each entry maps to a role in the authorization system.
// Password for all demo accounts: demo123
// OTP for email verification / password reset: 123456
export const MOCK_USERS: (AuthUser & { password: string })[] = [
  { id: 'u1', email: 'owner@demo.com', password: 'demo123', name: 'Owen Owner', role: 'owner' },
  { id: 'u2', email: 'admin@demo.com', password: 'demo123', name: 'Alex Admin', role: 'admin' },
  { id: 'u3', email: 'supervisor@demo.com', password: 'demo123', name: 'Sara Supervisor', role: 'supervisor' },
  { id: 'u4', email: 'agent@demo.com', password: 'demo123', name: 'Amy Agent', role: 'agent' },
];

// ─────────────────────────────────────────────
// Supabase → AuthUser mapper
// ─────────────────────────────────────────────
const fromSupabase = (
  u: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, any>;
  }
): AuthUser => ({
  id: u.id,
  email: u.email ?? "",
  name:
    u.user_metadata?.full_name ||
    u.user_metadata?.name ||
    u.email?.split("@")[0] ||
    "User",
  role: u.user_metadata?.role ?? "agent",
});

// ─────────────────────────────────────────────
// AUTH API
// ─────────────────────────────────────────────
export const authApi = {
  // ── Session ───────────────────────────────
  getSession: async (): Promise<{
    session: any | null;
    user: AuthUser | null;
  }> => {
    console.log("GET SESSION CALLED");

    const { data, error } = await supabase.auth.getSession();

    console.log("SESSION RESULT", data, error);

    const session = data?.session ?? null;

    return {
      session, // ✅ FIXED
      user: session?.user ? fromSupabase(session.user) : null,
    };
  },

  onAuthStateChange: (
    callback: (user: AuthUser | null, session: any | null) => void
  ): (() => void) => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        callback(null, session);
        return;
      }

      callback(session?.user ? fromSupabase(session.user) : null, session);
    });

    return () => subscription.unsubscribe();
  },

  // ── Login ───────────────────────────────
  login: async (
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    error?: string;
    user?: AuthUser;
    session?: any;
  }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error?.code === "email_not_confirmed") {
      await supabase.auth.resend({ type: "signup", email });
      return { success: false, error: "Email not confirmed" };
    }

    if (error) return { success: false, error: error.message };

    return {
      success: true,
      user: data?.user ? fromSupabase(data.user) : undefined,
      session: data?.session
    };
  },

  // ── Sign-up ───────────────────────────────
  signup: async (
    name: string,
    email: string,
    password: string,
    orgData?: any
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          passwordSet: true,
        },
      },
    });

    if (error) return { success: false, error: error.message };

    return { success: true };
  },

  // ── Google OAuth ──────────────────────────
  loginWithGoogle: async (): Promise<void> => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  },

  // ── Forgot password ───────────────────────
  forgotPassword: async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) return { success: false, error: error.message };

    return { success: true };
  },

  // ── Verify OTP ────────────────────────────
  verifyCode: async (
    code: string,
    email: string,
    flow: "signup" | "forgot-password" | null
  ): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
    const type = flow === "forgot-password" ? "recovery" : "email";

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type,
    });

    if (error) return { success: false, error: error.message };

    return {
      success: true,
      user: data?.user ? fromSupabase(data.user) : undefined,
    };
  },

  // ── Organization Setup ────────────────────
  organizationSetup: async (
    organizationName: string,
    workspaceName: string,
    onboardingData?: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiFetch("/organizations/setup", {
        method: "POST",
        body: JSON.stringify({
          organizationName,
          workspaceName,
          onboardingData,
        }),
      });

      return { success: true };
    } catch (error) {
      console.error("Organization setup failed", error);
      return { success: false, error: "Failed to setup organization" };
    }
  },

  // ── Resend OTP ────────────────────────────
  resendCode: async (
    email: string,
    flow: "signup" | "forgot-password" | null
  ): Promise<void> => {
    if (flow === "forgot-password") {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
    } else {
      await supabase.auth.resend({ type: "signup", email });
    }
  },

  // ── Reset password ────────────────────────
  resetPassword: async (
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      data: { passwordSet: true },
    });

    if (error) return { success: false, error: error.message };

    return { success: true };
  },

  getOrganizations: async (): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> => await api.get("/user/organizations"),




  getUser: async () =>
    api.get("/user")


  ,

  getWorkspace: async (): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> =>  await api.get("/user/workspaces"),

  // ── Logout ────────────────────────────────
  logout: async (): Promise<void> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const activeWorkspaceRaw = localStorage.getItem("active_workspace");
      const activeWorkspace = activeWorkspaceRaw
        ? JSON.parse(activeWorkspaceRaw)
        : null;

      if (
        session &&
        typeof navigator !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window
      ) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        const deviceKey = localStorage.getItem("axodesk:push-device-key");

        if (subscription || deviceKey) {
          await apiFetch(
            "/notifications/devices/unregister",
            {
              method: "POST",
              body: JSON.stringify({
                deviceKey: deviceKey || undefined,
                token: subscription?.endpoint,
                reason: "user-logout",
              }),
            },
            activeWorkspace,
          ).catch(() => undefined);
        }

        if (subscription) {
          await subscription.unsubscribe().catch(() => undefined);
        }
      }
    } catch {
      // best effort cleanup before auth sign-out
    }

    await supabase.auth.signOut();
    localStorage.clear();
  },
};
