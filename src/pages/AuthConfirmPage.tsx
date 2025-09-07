import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Mail, ArrowLeft, Loader } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';

const AuthConfirmPage: React.FC = () => {
  const navigate = useNavigate();
  const { isConfigured } = useAuth();
  const { showSuccess } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'info'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isConfigured) {
      setStatus('info');
      setMessage('Authentication is managed by Clerk. This page is no longer needed.');
      return;
    }

    // With Clerk, email verification is handled automatically
    // This page is primarily for backward compatibility
    setStatus('success');
    setMessage('Email verification is handled automatically by Clerk. You can now sign in to your account.');
    
    showSuccess(
      'Welcome to Image Generator',
      'Your account is ready! You can now sign in and start generating images.'
    );

    // Redirect to home page after a short delay
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 3000);
  }, [isConfigured, navigate, showSuccess]);

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
          {status === 'loading' && (
            <>
              <Loader className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold text-white mb-4">Setting Up Authentication</h1>
              <p className="text-gray-300">
                Please wait while we set up your authentication experience...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Welcome!</h1>
              <p className="text-gray-300 mb-6 leading-relaxed">
                {message}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleGoHome}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Go to Home
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-4">
                You will be automatically redirected in a few seconds...
              </p>
            </>
          )}

          {status === 'info' && (
            <>
              <Mail className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Clerk Authentication</h1>
              <p className="text-gray-300 mb-6 leading-relaxed">
                {message}
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleGoHome}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 w-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Go to Home
                </button>
              </div>
            </>
          )}

          {/* Image Generator Branding */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <Mail className="w-5 h-5" />
              <span className="text-sm">Image Generator - Email Verification</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthConfirmPage;