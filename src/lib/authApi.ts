import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// DUMMY_MODE
//   true  → uses mock data, zero network calls, instant login
//   false → delegates every call to Supabase (production)
//
// To go live: set DUMMY_MODE = false and ensure Supabase credentials are set
// in .env (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY).
// ─────────────────────────────────────────────────────────────────────────────
export const DUMMY_MODE = true;

const delay = (ms = 600) => new Promise<void>(r => setTimeout(r, ms));

// ─── Normalised user shape (same in both modes) ───────────────────────────────
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
  { id: 'u1', email: 'owner@demo.com',      password: 'demo123', name: 'Owen Owner',      role: 'owner'      },
  { id: 'u2', email: 'admin@demo.com',      password: 'demo123', name: 'Alex Admin',      role: 'admin'      },
  { id: 'u3', email: 'supervisor@demo.com', password: 'demo123', name: 'Sara Supervisor', role: 'supervisor' },
  { id: 'u4', email: 'agent@demo.com',      password: 'demo123', name: 'Amy Agent',       role: 'agent'      },
];

const DUMMY_OTP = '123456';
const SESSION_KEY = 'dummy_auth_session_v1';

// ─── Session helpers (dummy mode only) ───────────────────────────────────────
const saveSession = (user: AuthUser) =>
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));

const clearSession = () =>
  localStorage.removeItem(SESSION_KEY);

const readSession = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

// ─── Supabase → AuthUser mapper ───────────────────────────────────────────────
const fromSupabase = (u: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }): AuthUser => ({
  id: u.id,
  email: u.email ?? '',
  name:
    (u.user_metadata?.full_name as string) ||
    (u.user_metadata?.name as string) ||
    u.email?.split('@')[0] ||
    'User',
  role: (u.user_metadata?.role as string) ?? 'agent',
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTH API
// All methods return the same shape regardless of DUMMY_MODE.
// Swap the implementation by flipping the flag above — no other changes needed.
// ─────────────────────────────────────────────────────────────────────────────
export const authApi = {
  // ── Session ───────────────────────────────────────────────────────────────

  /** Returns the currently authenticated user, or null. */
  getSession: async (): Promise<AuthUser | null> => {
    if (DUMMY_MODE) {
      await delay(80);
      return readSession();
    }
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ? fromSupabase(session.user) : null;
  },

  /**
   * Subscribe to auth state changes.
   * Returns an unsubscribe function.
   * In dummy mode fires once with the current session (no real-time events).
   */
  onAuthStateChange: (callback: (user: AuthUser | null) => void): (() => void) => {
    if (DUMMY_MODE) {
      const user = readSession();
      const t = setTimeout(() => callback(user), 0);
      return () => clearTimeout(t);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        callback(null);
        return;
      }
      callback(session?.user ? fromSupabase(session.user) : null);
    });
    return () => subscription.unsubscribe();
  },

  // ── Login ─────────────────────────────────────────────────────────────────

  /** Email + password sign-in. */
  login: async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
    if (DUMMY_MODE) {
      await delay();
      const found = MOCK_USERS.find(u => u.email === email && u.password === password);
      if (!found) return { success: false, error: 'Invalid email or password.' };
      const user: AuthUser = { id: found.id, email: found.email, name: found.name, role: found.role };
      saveSession(user);
      return { success: true, user };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    const { data: { session } } = await supabase.auth.getSession();
    return { success: true, user: session?.user ? fromSupabase(session.user) : undefined };
  },

  // ── Sign-up ───────────────────────────────────────────────────────────────

  /** Create a new account. Triggers email verification flow. */
  signup: async (
    name: string,
    email: string,
    password: string,
    orgData?: Record<string, string>
  ): Promise<{ success: boolean; error?: string }> => {
    if (DUMMY_MODE) {
      await delay();
      if (MOCK_USERS.find(u => u.email === email)) {
        return { success: false, error: 'An account with this email already exists.' };
      }
      // Session is NOT saved here — user must verify OTP first.
      return { success: true };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, ...orgData } },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  // ── Google OAuth ──────────────────────────────────────────────────────────

  /** Initiate Google OAuth. In dummy mode logs in as the owner account. */
  loginWithGoogle: async (): Promise<void> => {
    if (DUMMY_MODE) {
      const owner = MOCK_USERS[0];
      saveSession({ id: owner.id, email: owner.email, name: owner.name, role: owner.role });
      window.location.href = '/inbox';
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/inbox` },
    });
  },

  // ── Forgot password ───────────────────────────────────────────────────────

  /** Send a password-reset OTP / link to the given email. */
  forgotPassword: async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (DUMMY_MODE) {
      await delay();
      // Accept any email in demo mode
      return { success: true };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  // ── Verify OTP ────────────────────────────────────────────────────────────

  /**
   * Verify the 6-digit OTP.
   * In dummy mode the only accepted code is "123456".
   * After a successful signup verification the new user is saved to the session.
   */
  verifyCode: async (
    code: string,
    email: string,
    flow: 'signup' | 'forgot-password' | null
  ): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
    if (DUMMY_MODE) {
      await delay();
      if (code !== DUMMY_OTP) {
        return { success: false, error: `Invalid code. Use ${DUMMY_OTP} in demo mode.` };
      }
      if (flow === 'signup') {
        const newUser: AuthUser = {
          id: `u_${Date.now()}`,
          email,
          name: email.split('@')[0],
          role: 'agent',
        };
        saveSession(newUser);
        return { success: true, user: newUser };
      }
      return { success: true };
    }
    const type = flow === 'forgot-password' ? 'recovery' : 'email';
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type });
    if (error) return { success: false, error: error.message };
    const { data: { session } } = await supabase.auth.getSession();
    return { success: true, user: session?.user ? fromSupabase(session.user) : undefined };
  },

  // ── Resend OTP ────────────────────────────────────────────────────────────

  /** Re-send the OTP email. No-op in dummy mode. */
  resendCode: async (
    email: string,
    flow: 'signup' | 'forgot-password' | null
  ): Promise<void> => {
    if (DUMMY_MODE) {
      await delay(300);
      return;
    }
    if (flow === 'forgot-password') {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
    } else {
      await supabase.auth.resend({ type: 'signup', email });
    }
  },

  // ── Reset password ────────────────────────────────────────────────────────

  /** Set a new password (called after OTP verification). */
  resetPassword: async (
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (DUMMY_MODE) {
      await delay();
      return { success: true };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  // ── Logout ────────────────────────────────────────────────────────────────

  /** Sign out the current user. */
  logout: async (): Promise<void> => {
    if (DUMMY_MODE) {
      clearSession();
      return;
    }
    await supabase.auth.signOut();
  },
};
