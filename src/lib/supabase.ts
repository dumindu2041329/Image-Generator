import { createClient } from '@supabase/supabase-js';
import { getClerkToken } from './clerk';

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

// Create Supabase client with Clerk integration
export const createSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      // Custom fetch function to include Clerk JWT token in requests
      fetch: async (url, options = {}) => {
        const clerkToken = await getClerkToken();
        
        if (clerkToken) {
          // Add Clerk JWT token to headers for RLS
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${clerkToken}`,
          };
        }
        
        return fetch(url, options);
      },
    },
  });
};

// Create Supabase client instance
export const supabase = createSupabaseClient();

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

// User interface for Clerk integration
export interface ClerkUser {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  fullName: string | null;
}

// Helper function to get user ID from Clerk user
export const getUserId = (user: ClerkUser | null): string | null => {
  return user?.id || null;
};

// Helper function to get user email from Clerk user
export const getUserEmail = (user: ClerkUser | null): string | undefined => {
  return user?.emailAddresses?.[0]?.emailAddress || undefined;
};

// Helper function to get user full name from Clerk user
export const getUserFullName = (user: ClerkUser | null): string | undefined => {
  return user?.fullName || undefined;
};

// Helper function to get user image URL from Clerk user
export const getUserImageUrl = (user: ClerkUser | null): string | undefined => {
  return user?.imageUrl || undefined;
};
