import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { ClerkUser, isSupabaseConfigured } from '../lib/supabase';
import { isClerkConfigured } from '../lib/clerk';

export const useAuth = () => {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const clerk = useClerk();
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  // Convert Clerk user to our ClerkUser interface
  const user: ClerkUser | null = clerkUser ? {
    id: clerkUser.id,
    emailAddresses: clerkUser.emailAddresses.map((email: any) => ({ emailAddress: email.emailAddress })),
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl,
    fullName: clerkUser.fullName,
  } : null;

  useEffect(() => {
    const configured = isClerkConfigured() && isSupabaseConfigured();
    setIsConfigured(configured);
    
    if (clerkLoaded) {
      setLoading(false);
    }
  }, [clerkLoaded]);

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      throw new Error('Authentication not configured');
    }

    try {
      const result = await clerk.client.signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await clerk.setActive({ session: result.createdSessionId });
        return { user: result };
      } else {
        throw new Error('Sign in incomplete');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Sign in failed');
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    if (!isConfigured) {
      throw new Error('Authentication not configured');
    }

    try {
      const [firstName, ...lastNameParts] = (fullName || '').split(' ');
      const lastName = lastNameParts.join(' ');

      const result = await clerk.client.signUp.create({
        emailAddress: email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });

      // Prepare email verification
      await result.prepareEmailAddressVerification({ strategy: 'email_code' });
      
      return { user: result, needsVerification: true };
    } catch (error: any) {
      throw new Error(error.message || 'Sign up failed');
    }
  };

  const signOut = async () => {
    if (!isConfigured) return;
    
    try {
      await clerk.signOut();
      // Clean up any auth-related paths left in the URL
      if (window.location.pathname.startsWith('/sign-') || window.location.pathname.startsWith('/factor')) {
        window.history.replaceState(null, '', '/');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Sign out failed');
    }
  };

  const resetPassword = async (email: string) => {
    if (!isConfigured) {
      throw new Error('Authentication not configured');
    }

    try {
      await clerk.client.signIn.create({
        identifier: email,
        strategy: 'reset_password_email_code',
      });
    } catch (error: any) {
      throw new Error(error.message || 'Password reset failed');
    }
  };

  const updateProfile = async (updates: { full_name?: string; avatar_url?: string }) => {
    if (!isConfigured) {
      throw new Error('Authentication not configured');
    }

    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      const updateData: any = {};
      
      if (updates.full_name) {
        const [firstName, ...lastNameParts] = updates.full_name.split(' ');
        updateData.firstName = firstName;
        updateData.lastName = lastNameParts.join(' ');
      }

      await clerkUser?.update(updateData);
      return { user: clerkUser };
    } catch (error: any) {
      throw new Error(error.message || 'Profile update failed');
    }
  };

  const updateProfileImage = async (file: File) => {
    if (!isConfigured) {
      throw new Error('Authentication not configured');
    }

    if (!clerk.user) {
      throw new Error('No user logged in');
    }

    try {
      await clerk.user.setProfileImage({ file });
      return { user: clerk.user };
    } catch (error: any) {
      throw new Error(error.message || 'Profile image update failed');
    }
  };

  const updateEmail = async (newEmail: string, currentPassword?: string) => {
    if (!isConfigured) {
      throw new Error('Authentication not configured');
    }

    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      // If additional verification is required by your Clerk instance, re-authenticate with password
      if (currentPassword) {
        const currentEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
        if (!currentEmail) throw new Error('Current email not found');
        const signInAttempt = await clerk.client.signIn.create({
          identifier: currentEmail,
          password: currentPassword,
        });
        if (signInAttempt.status === 'complete') {
          await clerk.setActive({ session: signInAttempt.createdSessionId });
        } else {
          throw new Error('Re-authentication failed');
        }
      }

      const created = await clerkUser?.createEmailAddress({ email: newEmail });
      if (!created) throw new Error('Failed to create new email address');
      await created.prepareVerification({ strategy: 'email_code' });
      // Do not sign out immediately; allow user to verify the code first
      return { user: clerkUser };
    } catch (error: any) {
      throw new Error(error.message || 'Email update failed');
    }
  };

  const verifyEmailUpdate = async (newEmail: string, code: string) => {
    if (!isConfigured) {
      throw new Error('Authentication not configured');
    }

    if (!clerkUser) {
      throw new Error('No user logged in');
    }

    try {
      const emailObj = clerkUser.emailAddresses.find((e: any) => e.emailAddress === newEmail);
      if (!emailObj) {
        throw new Error('New email not found on account');
      }

      await emailObj.attemptVerification({ code });
      // Make the new address primary
      await clerkUser.update({ primaryEmailAddressId: emailObj.id });
      return { user: clerkUser };
    } catch (error: any) {
      throw new Error(error.message || 'Email verification failed');
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!isConfigured) {
      throw new Error('Authentication not configured');
    }

    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      await clerkUser?.updatePassword({ newPassword });
      return { user: clerkUser };
    } catch (error: any) {
      throw new Error(error.message || 'Password update failed');
    }
  };

  return {
    user,
    loading: loading || !clerkLoaded,
    isConfigured,
    isSignedIn: !!isSignedIn,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updateProfileImage,
    updateEmail,
    verifyEmailUpdate,
    updatePassword,
  };
};
