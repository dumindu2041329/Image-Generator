import React, { useState } from 'react';
import { User, LogOut, History, Settings, ChevronDown, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
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
      console.error('Error signing out:', error);
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
    navigate('/profile');
    setIsOpen(false);
  };

  if (!isConfigured) {
    return (
      <button
        onClick={onShowAuth}
        className="glass glass-hover rounded-xl px-4 py-2 flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-all duration-300"
      >
        <User className="w-5 h-5" />
        <span className="hidden sm:inline">Connect Auth</span>
      </button>
    );
  }

  if (!user) {
    return (
      <button
        onClick={onShowAuth}
        className="glass glass-hover rounded-xl px-4 py-2 flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-all duration-300"
      >
        <User className="w-5 h-5" />
        <span className="hidden sm:inline">Sign In</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass glass-hover rounded-xl px-4 py-2 flex items-center gap-2 text-white hover:text-blue-300 transition-all duration-300"
      >
        <ProfileImage
          imageUrl={user.user_metadata?.avatar_url}
          fullName={user.user_metadata?.full_name}
          email={user.email}
          size="sm"
        />
        <span className="hidden sm:inline text-sm">
          {user.user_metadata?.full_name || user.email?.split('@')[0]}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 glass rounded-xl border border-white/20 z-20">
            <div className="p-3">
              <div className="px-3 py-3 border-b border-white/10 mb-2">
                <div className="flex items-center gap-3">
                  <ProfileImage
                    imageUrl={user.user_metadata?.avatar_url}
                    fullName={user.user_metadata?.full_name}
                    email={user.email}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {user.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <UserCircle className="w-4 h-4 flex-shrink-0" />
                <span>Profile</span>
              </button>
              
              <button
                onClick={handleMyImagesClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <History className="w-4 h-4 flex-shrink-0" />
                <span>My Images</span>
              </button>
              
              <hr className="border-white/10 my-2" />
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
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
