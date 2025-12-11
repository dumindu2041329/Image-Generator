import { Clerk } from '@clerk/clerk-js';

const clerkPubKey = (import.meta as any).env.VITE_CLERK_PUBLISHABLE_KEY;

// Helper to decode JWT and extract claims (for debugging only)
const decodeJWT = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

// Check if Clerk is configured
export const isClerkConfigured = () => {
  return clerkPubKey && 
         !clerkPubKey.includes("YOUR_CLERK_PUBLISHABLE_KEY") &&
         clerkPubKey.startsWith('pk_');
};

// Initialize Clerk only if configured
export const clerk = isClerkConfigured() 
  ? new Clerk(clerkPubKey)
  : null;

// Initialize Clerk
export const initializeClerk = async () => {
  if (!clerk) {
    throw new Error('Clerk not configured');
  }
  
  await clerk.load();
  return clerk;
};

// Helper function to get Clerk JWT token for Supabase RLS
export const getClerkToken = async () => {
  try {
    // Prefer the React Provider's global Clerk instance if available
    const globalClerk: any = (window as any)?.Clerk;

    if (globalClerk?.session) {
      // Try supabase template first, fallback to default token
      try {
        const token = await globalClerk.session.getToken({ template: 'supabase' });
        if (token) {
          const claims = decodeJWT(token);
          console.log('✅ Using Clerk Supabase JWT template');
          console.log('🔑 JWT Claims:', {
            sub: claims?.sub,
            user_id: claims?.user_id,
            iss: claims?.iss,
            exp: claims?.exp ? new Date(claims.exp * 1000).toISOString() : 'unknown'
          });
          return token;
        }
      } catch (templateError) {
        console.warn('⚠️ Supabase template not configured in Clerk, using default token');
      }
      
      // Fallback to default token
      const defaultToken = await globalClerk.session.getToken();
      if (defaultToken) {
        const claims = decodeJWT(defaultToken);
        console.log('✅ Using default Clerk JWT token');
        console.log('🔑 JWT Claims:', {
          sub: claims?.sub,
          user_id: claims?.user_id,
          iss: claims?.iss,
          exp: claims?.exp ? new Date(claims.exp * 1000).toISOString() : 'unknown'
        });
        return defaultToken;
      }
    }

    // Fallback to local Clerk instance (requires manual initialization)
    if (clerk?.session) {
      try {
        const token = await clerk.session.getToken({ template: 'supabase' });
        if (token) return token;
      } catch (templateError) {
        console.warn('Supabase template not configured in Clerk, using default token');
      }
      
      // Fallback to default token
      const defaultToken = await clerk.session.getToken();
      if (defaultToken) return defaultToken;
    }

    console.warn('No active Clerk session found');
    return null;
  } catch (error) {
    console.error('Error getting Clerk token:', error);
    return null;
  }
};

export { clerkPubKey };