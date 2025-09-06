import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Mail, ArrowLeft, Loader } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';

const AuthConfirmPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isConfigured } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isConfigured) {
      setStatus('error');
      setMessage('Authentication is not configured. Please contact support.');
      return;
    }

    const handleEmailConfirmation = async () => {
      try {
        // Get URL parameters
        const type = searchParams.get('type');
        const token_hash = searchParams.get('token_hash');
        const error = searchParams.get('error');
        const error_description = searchParams.get('error_description');

        if (error) {
          throw new Error(error_description || error);
        }

        if (!token_hash) {
          throw new Error('No confirmation token found in URL');
        }

        if (type === 'email_change') {
          setStatus('success');
          setMessage('Your email address has been updated successfully! You can now sign in with your new email address.');
          
          showSuccess(
            'Email Updated Successfully',
            'Your email address has been verified and updated. Please sign in with your new email address.'
          );

          // Redirect to home page after a short delay
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        } else if (type === 'signup') {
          setStatus('success');
          setMessage('Your email has been verified successfully! You can now sign in to your account.');
          
          showSuccess(
            'Email Verified',
            'Your account has been verified. You can now sign in.'
          );

          // Redirect to home page after a short delay
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        } else if (type === 'recovery') {
          // Redirect to password reset page with the tokens
          const access_token = searchParams.get('access_token');
          const refresh_token = searchParams.get('refresh_token');
          
          if (access_token && refresh_token) {
            // Redirect to the password reset page with the necessary parameters
            navigate(`/reset-password?${searchParams.toString()}`, { replace: true });
            return;
          } else {
            throw new Error('Invalid password reset link. Please request a new one.');
          }
        } else {
          setStatus('success');
          setMessage('Verification completed successfully!');
          
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        }
      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to verify email. Please try again.');
        
        showError(
          'Verification Failed',
          error instanceof Error ? error.message : 'Failed to verify email. Please contact support if the problem persists.'
        );
      }
    };

    handleEmailConfirmation();
  }, [searchParams, isConfigured, navigate, showSuccess, showError]);

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Configuration Error</h1>
          <p className="text-gray-300 mb-6">
            Authentication is not configured. Please contact support.
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
        <div className="glass rounded-3xl p-8 max-w-lg w-full text-center">
          {status === 'loading' && (
            <>
              <Loader className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold text-white mb-4">Verifying Email</h1>
              <p className="text-gray-300">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Email Verified!</h1>
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

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Verification Failed</h1>
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
                <p className="text-sm text-gray-400">
                  If the problem persists, please contact support.
                </p>
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