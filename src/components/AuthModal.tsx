import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';

// Dark theme configuration for Clerk components
const darkThemeConfig = {
  baseTheme: dark,
  elements: {
    formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white transition-colors",
    card: "bg-gray-900 border-gray-700 shadow-2xl relative", // Added relative for positioning close button
    headerTitle: "text-white font-bold",
    headerSubtitle: "text-gray-300",
    socialButtonsBlockButton: "bg-gray-800 border-gray-600 text-white hover:bg-gray-700 transition-colors",
    socialButtonsBlockButtonText: "text-white",
    formFieldInput: "bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors",
    formFieldLabel: "text-gray-300 font-medium",
    identityPreviewText: "text-gray-300",
    formFieldHintText: "text-gray-400 text-sm",
    formFieldErrorText: "text-red-400 text-sm",
    footerActionText: "text-gray-300",
    footerActionLink: "text-blue-400 hover:text-blue-300 transition-colors",
    dividerLine: "bg-gray-600",
    dividerText: "text-gray-400",
    formResendCodeLink: "text-blue-400 hover:text-blue-300 transition-colors",
    otpCodeFieldInput: "bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors",
    formHeaderTitle: "text-white font-bold",
    formHeaderSubtitle: "text-gray-300",
    alertText: "text-gray-300",
    formFieldSuccessText: "text-green-400 text-sm",
    formFieldWarningText: "text-yellow-400 text-sm",
    formFieldInputShowPasswordButton: "text-gray-400 hover:text-gray-300 transition-colors",
    formFieldInputShowPasswordIcon: "text-gray-400",
    formFieldInputHidePasswordIcon: "text-gray-400",
    // Additional styling for better UX
    formFieldInputShowPasswordButtonHover: "text-gray-300",
    formFieldInputShowPasswordButtonActive: "text-gray-200",
    formFieldInputShowPasswordButtonFocus: "text-gray-200",
    formFieldInputShowPasswordButtonDisabled: "text-gray-500",
    formFieldInputShowPasswordButtonHoverDisabled: "text-gray-500",
    formFieldInputShowPasswordButtonActiveDisabled: "text-gray-500",
    formFieldInputShowPasswordButtonFocusDisabled: "text-gray-500",
    formFieldInputShowPasswordButtonHoverActive: "text-gray-200",
    formFieldInputShowPasswordButtonHoverFocus: "text-gray-200",
    formFieldInputShowPasswordButtonActiveFocus: "text-gray-200",
    formFieldInputShowPasswordButtonHoverActiveFocus: "text-gray-200",
    formFieldInputShowPasswordButtonHoverActiveDisabled: "text-gray-500",
    formFieldInputShowPasswordButtonHoverFocusDisabled: "text-gray-500",
    formFieldInputShowPasswordButtonActiveFocusDisabled: "text-gray-500",
    formFieldInputShowPasswordButtonHoverActiveFocusDisabled: "text-gray-500"
  }
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'reset';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const [showCloseButton, setShowCloseButton] = useState(false);
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
      setMode(initialMode);
      setShowCloseButton(false);
      // Show close button after Clerk form loads (delay to ensure form is rendered)
      const timer = setTimeout(() => {
        setShowCloseButton(true);
      }, 500); // 500ms delay to ensure Clerk form is fully loaded
      return () => {
        clearTimeout(timer);
      };
    } else {
      setShowCloseButton(false);
    }
  }, [isOpen]); // Removed initialMode dependency to prevent retriggering on mode changes

  // Listen for Clerk virtual navigation events from Provider router hooks
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: Event) => {
      const custom = e as CustomEvent<string>;
      const to = custom.detail || '';
      if (to.includes('sign-up')) setMode('signup');
      if (to.includes('sign-in')) setMode('signin');
      // Keep close button visible during mode transitions - don't hide it
    };

    window.addEventListener('clerk:navigate', handler as EventListener);
    return () => window.removeEventListener('clerk:navigate', handler as EventListener);
  }, [isOpen]);

  // After successful auth, ensure URL is cleaned up to home path
  useEffect(() => {
    if (!isOpen && (window.location.pathname.startsWith('/sign-') || window.location.pathname.startsWith('/factor'))) {
      window.history.replaceState(null, '', '/');
    }
  }, [isOpen]);

  // Keep URL reflecting current auth view while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const desiredPath = mode === 'signup' ? '/sign-up' : '/sign-in';
    if (window.location.pathname !== desiredPath) {
      window.history.replaceState(null, '', desiredPath);
    }
  }, [isOpen, mode]);

  // Handle initial mode setting separately to avoid affecting close button timing
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

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
        {/* Close button positioned over the Clerk form - only show after form loads */}
        {showCloseButton && (
          <button
            onClick={onClose}
            aria-label="Close authentication"
            className="absolute top-4 right-4 z-50 text-gray-400 hover:text-white transition-all duration-300 bg-black/20 hover:bg-black/40 rounded-full p-2 animate-fade-in"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        {mode === 'signin' ? (
          <SignIn 
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/"
            redirectUrl="/"
            routing="path"
            appearance={darkThemeConfig}
          />
        ) : (
          <SignUp 
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignUpUrl="/"
            redirectUrl="/"
            routing="path"
            appearance={darkThemeConfig}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;
