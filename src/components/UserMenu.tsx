import React, { useState } from 'react';
import { User, LogOut, History, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface UserMenuProps {
  onShowHistory: () => void;
  onShowAuth: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onShowHistory, onShowAuth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, isConfigured } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
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
          <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl border border-white/20 z-20">
            <div className="p-2">
              <div className="px-3 py-2 border-b border-white/10 mb-2">
                <p className="text-sm text-white font-medium">
                  {user.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              
              <button
                onClick={() => {
                  onShowHistory();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <History className="w-4 h-4" />
                <span>My Images</span>
              </button>
              
              <button
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              
              <hr className="border-white/10 my-2" />
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
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
