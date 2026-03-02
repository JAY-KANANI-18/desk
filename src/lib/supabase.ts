import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────
// Replace the placeholder strings below with your real credentials.
// Get them from: https://app.supabase.com/project/_/settings/api
// ─────────────────────────────────────────────────────────────

const supabaseUrl = 'https://placeholder.supabase.co';
const supabaseAnonKey = 'placeholder-key';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn(
    '[Supabase] ⚠️  Credentials not configured.\n' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.\n' +
    'Get them from https://app.supabase.com/project/_/settings/api'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
