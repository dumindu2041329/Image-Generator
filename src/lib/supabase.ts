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
        
        // Set proper headers for Supabase
        options.headers = {
          'apikey': supabaseAnonKey,
          ...options.headers,
        };
        
        // Only set Content-Type for REST API calls (not storage)
        const urlString = url.toString();
        if (urlString.includes('/rest/v1/')) {
          const headers = options.headers as Record<string, string> || {};
          if (!headers['Content-Type']) {
            options.headers = {
              ...options.headers,
              'Content-Type': 'application/json',
            };
          }
        } else if (urlString.includes('/storage/v1/object/')) {
          // For storage API calls, ensure proper Content-Type is set
          const headers = options.headers as Record<string, string> || {};
          if (options.body && !headers['Content-Type']) {
            options.headers = {
              ...options.headers,
              'Content-Type': 'application/json',
            };
          }
        }
        
        if (clerkToken) {
          // Add Clerk JWT token to headers for RLS
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${clerkToken}`,
          };
          // Debug: log token for troubleshooting
          console.log('Supabase request with token:', clerkToken.substring(0, 50) + '...');
        } else {
          console.warn('No Clerk token available for Supabase request');
        }
        
        // Debug storage requests
        if (urlString.includes('/storage/v1/object/')) {
          console.log('Storage API request:', {
            url: urlString,
            method: options.method,
            headers: options.headers,
            body: options.body
          });
        }
        
        // Fix storage API requests - ensure body is properly formatted
        if (urlString.includes('/storage/v1/object/') && options.body) {
          try {
            // If body is a string, parse it and re-stringify to ensure proper formatting
            if (typeof options.body === 'string') {
              const parsedBody = JSON.parse(options.body);
              options.body = JSON.stringify(parsedBody);
            }
          } catch (error) {
            console.warn('Failed to parse storage request body:', error);
          }
        }
        
        return fetch(url, options);
      },
    },
  });
};

// Create Supabase client instance
export const supabase = createSupabaseClient();

// Create a completely clean storage client without any custom fetch
export const createStorageClient = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  // Use the default Supabase client without any custom fetch modifications
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Create storage client instance
export const storageClient = createStorageClient();

// Helper function to get authenticated storage client
export const getAuthenticatedStorageClient = async () => {
  if (!storageClient) return null;
  
  const clerkToken = await getClerkToken();
  console.log('Getting authenticated storage client, token available:', !!clerkToken);
  
  if (!clerkToken) return storageClient;
  
  // Create a new client with authentication for this specific request
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
      },
    },
  });
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

// User interface for Clerk integration
export interface ClerkUser {
  id: string; // Clerk user IDs are strings like "user_abc123"
  emailAddresses: Array<{ emailAddress: string }>;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  fullName: string | null;
}

// Helper function to get user ID from Clerk user
export const getUserId = (user: ClerkUser | null): string | null => {
  return user?.id || null; // String ID used across app & storage
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
