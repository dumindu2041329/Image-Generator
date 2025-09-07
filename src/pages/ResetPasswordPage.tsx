import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { isConfigured } = useAuth();
  const { showInfo } = useToast();

  useEffect(() => {
    if (isConfigured) {
      showInfo(
        'Password Reset',
        'Password reset is now handled by Clerk authentication. Please use the sign-in page to reset your password.'
      );
    }
  }, [isConfigured, showInfo]);

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-6">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700 text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Configuration Error</h1>
          <p className="text-gray-300 mb-6">
            Authentication is not configured. Please set up Clerk authentication.
          </p>
          <button
            onClick={handleGoHome}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 w-full"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="bg-gray-800 rounded-3xl p-8 max-w-lg w-full border border-gray-700 text-center">
          <Mail className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Password Reset with Clerk</h1>
          <p className="text-gray-300 mb-6 leading-relaxed">
            Password reset is now handled by Clerk authentication. To reset your password, please use the "Forgot Password" option on the sign-in page.
          </p>
          <div className="space-y-4">
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 w-full"
            >
              <ArrowLeft className="w-5 h-5" />
              Go to Home & Sign In
            </button>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-400 text-center">
              Clerk provides secure password reset with email verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;