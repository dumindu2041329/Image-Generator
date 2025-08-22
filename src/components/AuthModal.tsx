import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const { signIn, signUp, resetPassword, isConfigured } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setError('Authentication is not configured. Please connect your Supabase project.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        onClose();
      } else if (mode === 'signup') {
        await signUp(email, password, fullName);
        setMode('signin');
        setError('Account created! Check your email to verify your account, then sign in.');
      } else if (mode === 'reset') {
        await resetPassword(email);
        setResetEmailSent(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError('');
    setResetEmailSent(false);
    setShowPassword(false);
  };

  const switchMode = (newMode: 'signin' | 'signup' | 'reset') => {
    setMode(newMode);
    resetForm();
  };

  if (!isOpen) return null;

  if (!isConfigured) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full border border-white/20">
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
            <h3 className="text-lg font-semibold text-white mb-2">Supabase Project Required</h3>
            <p className="text-gray-300 mb-6">
              To enable user authentication and save your generated images, please connect your Supabase project first.
            </p>
            <button
              onClick={onClose}
              className="glass glass-hover rounded-xl px-6 py-3 text-blue-400 font-medium transition-all duration-300"
            >
              Connect Supabase Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 max-w-md w-full border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {mode === 'reset' && resetEmailSent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Check Your Email</h3>
            <p className="text-gray-300 mb-6">
              We've sent you a password reset link. Check your email and follow the instructions.
            </p>
            <button
              onClick={() => switchMode('signin')}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 glass rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 glass rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 glass rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 
               mode === 'signin' ? 'Sign In' : 
               mode === 'signup' ? 'Create Account' : 
               'Send Reset Email'}
            </button>

            <div className="text-center space-y-2">
              {mode === 'signin' ? (
                <>
                  <p className="text-gray-400">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Sign up
                    </button>
                  </p>
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    Forgot your password?
                  </button>
                </>
              ) : mode === 'signup' ? (
                <p className="text-gray-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Back to Sign In
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
