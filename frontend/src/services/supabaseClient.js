/**
 * Optional Supabase Client configuration for frontend direct queries
 */

export const getSupabaseConfig = () => {
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  };
};
