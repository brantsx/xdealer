import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseConfigState {
  enabled: boolean;
  url?: string;
  anonKey?: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfig: SupabaseConfigState = {
  enabled: Boolean(supabaseUrl && supabaseAnonKey),
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};

export const supabase: SupabaseClient | null = supabaseConfig.enabled
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
