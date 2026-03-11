import { useCallback } from 'react';
import { supabase } from './supabase';
import { apiFetch } from './apiClient';

// ─────────────────────────────────────────────
// Normalised user shape (unchanged)
// ─────────────────────────────────────────────
export const DUMMY_MODE = false;
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}




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
  email: u.email ?? '',
  name:
    u.user_metadata?.full_name ||
    u.user_metadata?.name ||
    u.email?.split('@')[0] ||
    'User',
  role: u.user_metadata?.role ?? 'agent',
});

// ─────────────────────────────────────────────
// AUTH API
// Structure is SAME as your previous file
// ─────────────────────────────────────────────
export const authApi = {
  // ── Session ───────────────────────────────

getSession: async (): Promise<any | null> => {
  console.log("GET SESSION CALLED");

  const { data, error } = await supabase.auth.getSession();

  console.log("SESSION RESULT", data, error);

  const session = data?.session;

  return { session: data, user : {...(session?.user ? fromSupabase(session.user) : null)}}
},

  onAuthStateChange: (
    callback: (user: AuthUser | null) => void
  ): (() => void) => {
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          callback(null);
          return;
        }
        callback(session?.user ? fromSupabase(session.user) : null);
      });

    return () => subscription.unsubscribe();
  },

  // ── Login ───────────────────────────────

  login: async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: AuthUser; access_token?: string; }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error?.code === 'email_not_confirmed') {
      await supabase.auth.resend({ type: 'signup', email });
      return { success: false, error: 'Email not confirmed' };
    }
    if (error) return { success: false, error: error.message };

    const { data: { session } } = await supabase.auth.getSession();

    return {
      success: true,
      user: session?.user ? fromSupabase(session.user) : undefined,
      access_token: session?.access_token

    };
  },

  // ── Sign-up ───────────────────────────────

  signup: async (
    name: string,
    email: string,
    password: string,
    orgData: any
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
           passwordSet: true
        },
      },
    });

    if (error) return { success: false, error: error.message };

    return { success: true };
  },

  // ── Google OAuth ──────────────────────────

  loginWithGoogle: async (): Promise<void> => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
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
    flow: 'signup' | 'forgot-password' | null
  ): Promise<{ success: boolean; error?: string; user?: AuthUser; access_token?: string }> => {
    const type = flow === 'forgot-password' ? 'recovery' : 'email';

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type,
    });

    if (error) return { success: false, error: error.message };

    const { data: { session } } = await supabase.auth.getSession();
    console.log(session);

    return {
      success: true,
      user: session?.user ? fromSupabase(session.user) : undefined,
      access_token: session?.access_token,
    };
  },


  // ── Organization Setup ────────────────────

  organizationSetup: async (
    organizationName: string,
    workspaceName: string,
    access_token: any
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiFetch("/organizations/setup", {
        method: "POST",
        body: JSON.stringify({
          organizationName, // make sure these are available in scope
          workspaceName,
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
    flow: 'signup' | 'forgot-password' | null
  ): Promise<void> => {
    if (flow === 'forgot-password') {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
    } else {
      await supabase.auth.resend({ type: 'signup', email });
    }
  },



  // ── Reset password ────────────────────────

  resetPassword: async (
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.
      updateUser({
        password: newPassword,
        data:{passwordSet: true}
      });
    console.log({ error });

    if (error) return { success: false, error: error.message };

    return { success: true };
  },


  getOrganizations: async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const data = await apiFetch("/organizations/me", {
        method: "GET",
      });

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
  getUser: async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const data = await apiFetch("/users/me", {
        method: "GET",
      });

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
  getWorkspace: async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const data = await apiFetch("/workspaces/me", {
        method: "GET",
      });

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // ── Logout ────────────────────────────────
  /** Sign out the current user. */
  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
  },

};