import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isPlaceholderUrl = !supabaseUrl || supabaseUrl.includes('your-project') || supabaseUrl.includes('example.supabase.co');
const isPlaceholderKey = !supabaseAnonKey || supabaseAnonKey.includes('your-supabase') || supabaseAnonKey === 'missing-key';

export const isSupabaseConfigured = !isPlaceholderUrl && !isPlaceholderKey;
export const isDevelopment = import.meta.env.DEV;

export function debugLog(scope, message, detail) {
  if (!isDevelopment) return;
  if (detail) {
    console.info(`[${scope}] ${message}`, detail);
    return;
  }
  console.info(`[${scope}] ${message}`);
}

export function debugError(scope, error) {
  if (!isDevelopment) return;
  console.error(`[${scope}]`, error);
}

if (!isSupabaseConfigured) {
  console.warn('Supabase env is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'missing-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },

    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);