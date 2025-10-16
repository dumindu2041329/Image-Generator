import React, { useState } from 'react';
import { Sparkles, Zap, Infinity as InfinityIcon } from 'lucide-react';
import UserMenu from './UserMenu';
import AuthModal from './AuthModal';

const Header: React.FC = () => {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <header className="relative py-4 sm:py-6 md:py-8 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          {/* User Menu */}
          <div className="flex justify-end mb-4 sm:mb-6 md:mb-8">
            <UserMenu 
              onShowAuth={() => setShowAuth(true)}
            />
          </div>

          {/* Main Header Content */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur opacity-75 pulse-glow"></div>
                <div className="relative glass rounded-full p-2 sm:p-3">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                </div>
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 px-2">
              <span className="gradient-text">Free AI Image Generator</span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mb-4 sm:mb-6 max-w-2xl mx-auto px-4">
              Transform your imagination into stunning visuals with completely free AI image generation. 
              No API keys, no limits, no costs - just pure creativity unleashed!
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400 px-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
                <span>Lightning Fast</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <InfinityIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
                <span>Unlimited Free</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                <span>High Quality</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
      />
    </>
  );
};

export default Header;
