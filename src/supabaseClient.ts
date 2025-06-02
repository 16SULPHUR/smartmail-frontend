// src/supabaseClient.ts
import { createClient, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get the current session's access token
export const getSupabaseAccessToken = (): string | null => {
  const sessionData = localStorage.getItem('sb-' + new URL(supabaseUrl).hostname.split('.')[0] + '-auth-token'); // Adjust based on actual key used by Supabase v2+
  if (sessionData) {
    try {
      const session: Session = JSON.parse(sessionData);
      return session.access_token || null;
    } catch (e) {
      console.error("Error parsing session data from localStorage", e);
      return null;
    }
  }
  return null;
};