import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && 
         supabaseAnonKey && 
         !supabaseUrl.includes("YOUR_SUPABASE_URL") && 
         !supabaseAnonKey.includes("YOUR_SUPABASE_ANON_KEY") &&
         !supabaseUrl.includes("API_KEY_ADDED");
};

// Create Supabase client only if configured
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Helper function to reset password with custom redirect
export const resetPasswordForEmail = async (email: string) => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/confirm`
  });
  
  if (error) throw error;
};

// Database schema types
export interface SavedImage {
  id: string;
  user_id: string;
  prompt: string;
  image_url: string;
  aspect_ratio: '1:1' | '16:9' | '4:3';
  style: 'vivid' | 'natural';
  created_at: string;
  is_favorite: boolean;
  storage_file_path: string | null;
}
