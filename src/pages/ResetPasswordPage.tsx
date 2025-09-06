import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updatePassword, isConfigured } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [errors, setErrors] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    // Check if we have the required parameters for password reset
    const type = searchParams.get('type');
    const access_token = searchParams.get('access_token');
    const refresh_token = searchParams.get('refresh_token');

    if (type === 'recovery' && access_token && refresh_token) {
      setIsValidToken(true);
    } else {
      showError(
        'Invalid Reset Link',
        'The password reset link is invalid or has expired. Please request a new one.'
      );
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 3000);
    }
  }, [searchParams, isConfigured, navigate, showError]);

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validateConfirmPassword = (password: string, confirm: string): string => {
    if (!confirm) return 'Please confirm your password';
    if (password !== confirm) return 'Passwords do not match';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordError = validatePassword(newPassword);
    const confirmError = validateConfirmPassword(newPassword, confirmPassword);
    
    if (passwordError || confirmError) {
      setErrors({
        newPassword: passwordError,
        confirmPassword: confirmError
      });
      return;
    }
    
    setErrors({ newPassword: '', confirmPassword: '' });
    setLoading(true);

    try {
      await updatePassword(newPassword);
      showSuccess(
        'Password Reset Successfully',
        'Your password has been updated. You can now sign in with your new password.'
      );
      
      // Clear form and redirect to home
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } catch (error) {
      console.error('Password reset error:', error);
      showError(
        'Password Reset Failed',
        error instanceof Error ? error.message : 'Failed to reset password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

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

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <div className="glass rounded-3xl p-8 max-w-lg w-full text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Invalid Reset Link</h1>
            <p className="text-gray-300 mb-6 leading-relaxed">
              The password reset link is invalid or has expired. Please request a new password reset from the sign-in page.
            </p>
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 w-full"
            >
              <ArrowLeft className="w-5 h-5" />
              Go to Home
            </button>
          </div>
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
        <div className="glass rounded-3xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Reset Your Password</h1>
            <p className="text-gray-300">
              Enter your new password below to complete the reset process.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 glass rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    errors.newPassword ? 'focus:ring-red-500 border-red-500' : 'focus:ring-blue-500'
                  }`}
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.newPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 glass rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    errors.confirmPassword ? 'focus:ring-red-500 border-red-500' : 'focus:ring-blue-500'
                  }`}
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={handleGoHome}
                className="w-full glass glass-hover rounded-xl py-3 text-gray-300 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Home
              </button>
            </div>
          </form>

          {/* Security Note */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-400 text-center">
              After resetting your password, you'll be automatically signed out and need to sign in again with your new password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;