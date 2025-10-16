import React, { useState } from 'react';
import { User, LogOut, History, ChevronDown, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { getUserFullName, getUserEmail, getUserImageUrl } from '../lib/supabase';
import ProfileImage from './ProfileImage';

interface UserMenuProps {
  onShowAuth: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onShowAuth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, isConfigured } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
      showSuccess(
        'Signed Out Successfully',
        'You have been signed out of your account.'
      );
    } catch (error) {
      // Silent failure with user notification
      showError(
        'Sign Out Failed',
        'An error occurred while signing out. Please try again.'
      );
    }
  };

  const handleMyImagesClick = () => {
    navigate('/my-images');
    setIsOpen(false);
  };

  const handleProfileClick = () => {
    // Always allow navigation to profile page - it will handle auth state internally
    navigate('/profile');
    setIsOpen(false);
  };

  const handleSignInClick = () => {
    // Only show auth modal if user is not already authenticated
    if (!user) {
      onShowAuth();
    }
  };

  if (!isConfigured) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={onShowAuth}
          className="glass glass-hover rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 flex items-center gap-1.5 sm:gap-2 text-blue-400 hover:text-blue-300 transition-all duration-300"
        >
          <User className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm hidden sm:inline">Connect Auth</span>
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={handleSignInClick}
          className="glass glass-hover rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 flex items-center gap-1.5 sm:gap-2 text-blue-400 hover:text-blue-300 transition-all duration-300"
        >
          <User className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm hidden sm:inline">Sign In</span>
        </button>
      </div>
    );
  }

  const userFullName = getUserFullName(user);
  const userEmail = getUserEmail(user);
  const userImageUrl = getUserImageUrl(user);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass glass-hover rounded-lg sm:rounded-xl px-2 sm:px-4 py-2 flex items-center gap-1 sm:gap-2 text-white hover:text-blue-300 transition-all duration-300"
      >
        <ProfileImage
          imageUrl={userImageUrl}
          fullName={userFullName}
          email={userEmail}
          size="sm"
        />
        <span className="hidden sm:inline text-sm">
          {userFullName || userEmail?.split('@')[0] || 'User'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 glass rounded-lg sm:rounded-xl border border-white/20 z-20 shadow-xl">
            <div className="p-2 sm:p-3">
              <div className="px-2 sm:px-3 py-2 sm:py-3 border-b border-white/10 mb-1.5 sm:mb-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <ProfileImage
                    imageUrl={userImageUrl}
                    fullName={userFullName}
                    email={userEmail}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-white font-medium truncate">
                      {userFullName || 'User'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <UserCircle className="w-4 h-4 flex-shrink-0" />
                <span>Profile</span>
              </button>
              
              <button
                onClick={handleMyImagesClick}
                className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <History className="w-4 h-4 flex-shrink-0" />
                <span>My Images</span>
              </button>
              
              <hr className="border-white/10 my-1.5 sm:my-2" />
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
