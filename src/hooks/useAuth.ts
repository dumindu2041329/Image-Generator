import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, resetPasswordForEmail } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);

    if (!configured) {
      setLoading(false);
      return;
    }

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (_, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase!.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    if (!isConfigured) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (!isConfigured) return;
    
    const { error } = await supabase!.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    if (!isConfigured) {
      throw new Error('Supabase not configured');
    }

    await resetPasswordForEmail(email);
  };

  const updateProfile = async (updates: { full_name?: string; avatar_url?: string }) => {
    if (!isConfigured) {
      throw new Error('Supabase not configured');
    }

    if (!user) {
      throw new Error('No user logged in');
    }

    const { data, error } = await supabase!.auth.updateUser({
      data: updates
    });

    if (error) throw error;
    return data;
  };

  const updateEmail = async (newEmail: string) => {
    if (!isConfigured) {
      throw new Error('Supabase not configured');
    }

    if (!user) {
      throw new Error('No user logged in');
    }

    const { data, error } = await supabase!.auth.updateUser({
      email: newEmail
    });

    if (error) throw error;
    
    // Automatically sign out after email update
    // This ensures security and forces re-authentication with the new email
    await signOut();
    
    return data;
  };

  const updatePassword = async (newPassword: string) => {
    if (!isConfigured) {
      throw new Error('Supabase not configured');
    }

    if (!user) {
      throw new Error('No user logged in');
    }

    const { data, error } = await supabase!.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return data;
  };

  return {
    user,
    loading,
    isConfigured,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updateEmail,
    updatePassword,
  };
};
