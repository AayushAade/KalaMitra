import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Missing environment variable: EXPO_PUBLIC_SUPABASE_URL. Please check your mobile/.env configuration.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing environment variable: EXPO_PUBLIC_SUPABASE_ANON_KEY. Please check your mobile/.env configuration.'
  );
}

// Create a single type-safe Supabase client singleton instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
