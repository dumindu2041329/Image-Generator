import { Clerk } from '@clerk/clerk-js';

const clerkPubKey = (import.meta as any).env.VITE_CLERK_PUBLISHABLE_KEY;

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
  if (!clerk?.user) {
    return null;
  }
  
  try {
    // Get JWT token with Supabase template
    const token = await clerk.session?.getToken({ template: 'supabase' });
    return token;
  } catch (error) {
    // Silent failure - just return null without logging to console
    return null;
  }
};

export { clerkPubKey };