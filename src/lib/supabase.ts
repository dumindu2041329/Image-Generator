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
          // For storage API calls, DON'T set Content-Type for file uploads
          // Let the browser/Supabase determine the correct MIME type from the blob
          // Only set JSON content-type for non-file operations (like listing, deleting)
          const headers = options.headers as Record<string, string> || {};
          const isFileUpload = options.body && (options.body instanceof Blob || options.body instanceof File || options.body instanceof FormData);
          
          if (options.body && !headers['Content-Type'] && !isFileUpload) {
            // Only set JSON content type for metadata operations, not file uploads
            options.headers = {
              ...options.headers,
              'Content-Type': 'application/json',
            };
          }
          // For file uploads, let Supabase/browser handle Content-Type automatically
        }
        
        if (clerkToken) {
          // Add Clerk JWT token to headers for RLS
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${clerkToken}`,
          };
          // Debug: log token info for troubleshooting
          console.log('Supabase request with valid token (length:', clerkToken.length, ')');
        } else {
          console.warn('⚠️  No Clerk token available for Supabase request - this will likely cause 400/401 errors');
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
        
        // Fix storage API requests - only format JSON bodies, not file uploads
        if (urlString.includes('/storage/v1/object/') && options.body) {
          const isFileUpload = options.body instanceof Blob || options.body instanceof File || options.body instanceof FormData;
          
          if (!isFileUpload && typeof options.body === 'string') {
            try {
              // Only format JSON strings, not file data
              const parsedBody = JSON.parse(options.body);
              options.body = JSON.stringify(parsedBody);
            } catch (error) {
              console.warn('Failed to parse storage request body:', error);
            }
          }
          // For file uploads (Blob/File/FormData), leave body as-is
        }
        
        return fetch(url, options);
      },
    },
  });
};

// Create Supabase client instance
export const supabase = createSupabaseClient();

// Reuse the main client to avoid multiple GoTrueClient instances
export const getAuthenticatedStorageClient = async () => {
  return supabase; // Reuse main client to avoid multiple GoTrueClient instances
};

// Database schema types
export interface SavedImage {
  id: string;
  user_id: string;
  prompt: string;
  image_url: string;
  aspect_ratio: '1:1' | '16:9' | '4:3';
  style: 'vivid' | 'natural'; // Only vivid and natural are allowed by database check constraint
  created_at: string;
  is_favorite: boolean;
  storage_file_path?: string | null; // Optional since Pollinations images may not be stored
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
