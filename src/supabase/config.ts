import { createClient } from "@supabase/supabase-js";

// Load configuration variables from Vite environment variables.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

/**
 * Supabase client instance.
 * For Phase 0, if env variables are not present, we output a warning but continue
 * to allow the front-end layout/shell to render and compile cleanly.
 */
let supabase: any = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials are missing. Please copy '.env.example' to '.env.local' and provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
  
  // Create a dummy client mock to prevent runtime crashes during layout demo
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
