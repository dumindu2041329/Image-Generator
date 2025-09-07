import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'reset';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const { user: clerkUser } = useUser();
  const { isConfigured } = useAuth();
  const { showSuccess } = useToast();

  // Close modal automatically if user becomes authenticated
  useEffect(() => {
    if (clerkUser && isOpen) {
      showSuccess(
        'Welcome!',
        'You have successfully signed in to your account.'
      );
      onClose();
    }
  }, [clerkUser, isOpen, onClose, showSuccess]);

  // Reset mode when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Check if there's a hash that should override the initialMode
      const hash = window.location.hash;
      if (hash === '#sign-up') {
        setMode('signup');
      } else if (hash === '#sign-in') {
        setMode('signin');
      } else {
        setMode(initialMode);
      }
    }
  }, [isOpen, initialMode]);

  // Handle hash changes for Clerk routing
  useEffect(() => {
    if (!isOpen) return; // Only process hash changes when modal is open
    
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#sign-up') {
        setMode('signup');
      } else if (hash === '#sign-in') {
        setMode('signin');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Check hash on initial render
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      // Clear hash when modal closes
      if (window.location.hash === '#sign-up' || window.location.hash === '#sign-in') {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  if (!isConfigured) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Authentication Required</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Clerk Configuration Required</h3>
            <p className="text-gray-300 mb-6">
              To enable user authentication, please configure your Clerk project and add the publishable key to your environment variables.
            </p>
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <code className="text-green-400 text-sm">
                VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
              </code>
            </div>
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 rounded-xl px-6 py-3 text-blue-400 font-medium transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors bg-black/20 rounded-full p-2"
        >
          <X className="w-5 h-5" />
        </button>
        
        {mode === 'signin' ? (
          <SignIn 
            signUpUrl="#sign-up"
            afterSignInUrl="/"
            redirectUrl="/"
            routing="hash"
          />
        ) : (
          <SignUp 
            signInUrl="#sign-in"
            afterSignUpUrl="/"
            redirectUrl="/"
            routing="hash"
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;
