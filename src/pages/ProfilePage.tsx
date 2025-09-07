import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
// Removed Supabase-based avatar storage in favor of Clerk-hosted avatars
import { getUserId, getUserEmail, getUserFullName, getUserImageUrl } from '../lib/supabase';
import ProfileImage from '../components/ProfileImage';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isConfigured, updateProfile, updateEmail, verifyEmailUpdate, updatePassword, updateProfileImage } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [awaitingEmailVerification, setAwaitingEmailVerification] = useState(false);
  
  // UI states
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState({
    profile: false,
    email: false,
    password: false,
    image: false
  });
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Get user details using helper functions
  const userId = getUserId(user);
  const userEmail = getUserEmail(user);
  const userFullName = getUserFullName(user);
  const userImageUrl = getUserImageUrl(user);

  // Initialize form with user data (only when the signed-in user changes)
  useEffect(() => {
    if (userId) {
      setFullName(userFullName || '');
      setEmail(userEmail || '');
      setProfileImageUrl(userImageUrl || '');
    }
  }, [userId]);

  // Validation functions
  const validateFullName = (name: string): string => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Full name must be at least 2 characters';
    return '';
  };

  const validateEmail = (emailValue: string): string => {
    if (!emailValue.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) return 'Please enter a valid email address';
    return '';
  };

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

  // Handle profile image upload via Clerk only
  const handleImageUpload = async (file: File) => {
    if (!userId) return;

    setLoading(prev => ({ ...prev, image: true }));
    try {
      const result = await updateProfileImage(file);
      const newUrl = result?.user?.imageUrl || profileImageUrl;
      setProfileImageUrl(newUrl);
      showSuccess(
        'Profile Image Updated',
        'Your profile image has been updated successfully.'
      );
    } catch (error) {
      showError(
        'Upload Failed',
        error instanceof Error ? error.message : 'Failed to upload profile image.'
      );
    } finally {
      setLoading(prev => ({ ...prev, image: false }));
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const nameError = validateFullName(fullName);
    if (nameError) {
      setErrors(prev => ({ ...prev, fullName: nameError }));
      return;
    }
    
    setErrors(prev => ({ ...prev, fullName: '' }));
    setLoading(prev => ({ ...prev, profile: true }));

    try {
      await updateProfile({ full_name: fullName });
      showSuccess(
        'Profile Updated',
        'Your profile information has been updated successfully.'
      );
    } catch (error) {
      // Silent failure, but still show error to user
      showError(
        'Update Failed',
        error instanceof Error ? error.message : 'Failed to update profile.'
      );
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  // Handle email update
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors(prev => ({ ...prev, email: emailError }));
      return;
    }

    if (email === userEmail) {
      showInfo('No Changes', 'The email address is the same as your current email.');
      return;
    }
    
    setErrors(prev => ({ ...prev, email: '' }));
    setLoading(prev => ({ ...prev, email: true }));

    try {
      await updateEmail(email);
      showSuccess(
        'Email Update Initiated',
        'Please check your new email address for a verification code to confirm the change.'
      );
      setAwaitingEmailVerification(true);
    } catch (error) {
      // Silent failure, but still show error to user
      showError(
        'Email Update Failed',
        error instanceof Error ? error.message : 'Failed to update email address.'
      );
    } finally {
      setLoading(prev => ({ ...prev, email: false }));
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailVerificationCode.trim()) return;
    setLoading(prev => ({ ...prev, email: true }));
    try {
      await verifyEmailUpdate(email, emailVerificationCode.trim());
      showSuccess('Email Updated', 'Your email address has been verified and set as primary.');
      setAwaitingEmailVerification(false);
      setEmailVerificationCode('');
    } catch (error) {
      showError(
        'Verification Failed',
        error instanceof Error ? error.message : 'Failed to verify the new email address.'
      );
    } finally {
      setLoading(prev => ({ ...prev, email: false }));
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordError = validatePassword(newPassword);
    const confirmError = validateConfirmPassword(newPassword, confirmPassword);
    
    if (passwordError || confirmError) {
      setErrors(prev => ({ 
        ...prev, 
        newPassword: passwordError,
        confirmPassword: confirmError
      }));
      return;
    }
    
    setErrors(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    setLoading(prev => ({ ...prev, password: true }));

    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      showSuccess(
        'Password Updated',
        'Your password has been changed successfully.'
      );
    } catch (error) {
      // Silent failure, but still show error to user
      showError(
        'Password Update Failed',
        error instanceof Error ? error.message : 'Failed to update password.'
      );
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  // Show configuration message if Supabase is not configured
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="glass border-b border-white/20 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => navigate('/')}
                  className="glass glass-hover rounded-xl p-3 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <User className="w-8 h-8" />
                    Profile Settings
                  </h1>
                  <p className="text-gray-400 mt-1">
                    Authentication configuration required
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="glass rounded-2xl p-8 text-center">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Authentication Not Configured</h2>
                <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                  To access profile settings and other authenticated features, you need to configure Supabase authentication. 
                  Please set up your Supabase project and add the required environment variables.
                </p>
                <div className="glass rounded-xl p-6 mb-6 text-left">
                  <h3 className="text-lg font-semibold text-white mb-3">Required Environment Variables:</h3>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="text-blue-300">VITE_SUPABASE_URL=your_supabase_url</div>
                    <div className="text-blue-300">VITE_SUPABASE_ANON_KEY=your_supabase_anon_key</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                >
                  Go Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication required message if user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="glass border-b border-white/20 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => navigate('/')}
                  className="glass glass-hover rounded-xl p-3 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <User className="w-8 h-8" />
                    Profile Settings
                  </h1>
                  <p className="text-gray-400 mt-1">
                    Please sign in to access your profile
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="glass rounded-2xl p-8 text-center">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Sign In Required</h2>
                <p className="text-gray-300 mb-6">
                  You need to be signed in to access your profile settings and manage your account.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                >
                  Go Home to Sign In
                </button>
              </div>
            </div>
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
      
      <div className="relative z-10">
        {/* Header */}
        <div className="glass border-b border-white/20 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate('/')}
                className="glass glass-hover rounded-xl p-3 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <User className="w-8 h-8" />
                  Profile Settings
                </h1>
                <p className="text-gray-400 mt-1">
                  Manage your account information and preferences
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Profile Image Section */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Profile Image</h2>
              <div className="flex items-center gap-6">
                <ProfileImage
                  imageUrl={profileImageUrl}
                  fullName={userFullName}
                  email={userEmail}
                  size="xl"
                  editable={true}
                  onImageChange={handleImageUpload}
                  loading={loading.image}
                />
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    {userFullName || 'User'}
                  </h3>
                  <p className="text-gray-400 mb-4">{userEmail}</p>
                  <p className="text-sm text-gray-300">
                    Click on your profile image to upload a new one. <br />
                    Supported formats: JPEG, PNG, WebP (max 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Information Section */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
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
                      className={`w-full pl-10 pr-4 py-3 glass rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                        errors.fullName ? 'focus:ring-red-500 border-red-500' : 'focus:ring-blue-500'
                      }`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading.profile}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.profile ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {loading.profile ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>

            {/* Email Section */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Email Address</h2>
              <form onSubmit={handleEmailUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 glass rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                        errors.email ? 'focus:ring-red-500 border-red-500' : 'focus:ring-blue-500'
                      }`}
                      placeholder="Enter your email address"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                  )}
                  <p className="text-sm text-gray-400 mt-2">
                    Changing your email will require verification with a code sent to your new email address.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading.email}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.email ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                  {loading.email ? 'Updating...' : 'Update Email'}
                </button>
              </form>

              {awaitingEmailVerification && (
                <form onSubmit={handleVerifyEmail} className="space-y-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Verification Code (sent to {email})
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={emailVerificationCode}
                        onChange={(e) => setEmailVerificationCode(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 glass rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter the code from your email"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Enter the 6-digit code you received to confirm your new email address.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading.email}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading.email ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Mail className="w-5 h-5" />
                    )}
                    {loading.email ? 'Verifying...' : 'Verify Email'}
                  </button>
                </form>
              )}
            </div>

            {/* Password Section */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Change Password</h2>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={loading.password}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-red-600 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.password ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                  {loading.password ? 'Updating...' : 'Change Password'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;