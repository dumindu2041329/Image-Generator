import React, { useState } from 'react';
import { Sparkles, Zap, Infinity } from 'lucide-react';
import UserMenu from './UserMenu';
import AuthModal from './AuthModal';
import ImageHistory from './ImageHistory';

const Header: React.FC = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <header className="relative py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* User Menu */}
          <div className="flex justify-end mb-8">
            <UserMenu 
              onShowHistory={() => setShowHistory(true)}
              onShowAuth={() => setShowAuth(true)}
            />
          </div>

          {/* Main Header Content */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur opacity-75 pulse-glow"></div>
                <div className="relative glass rounded-full p-3">
                  <Sparkles className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="gradient-text">Free AI Image Generator</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
              Transform your imagination into stunning visuals with completely free AI image generation. 
              No API keys, no limits, no costs - just pure creativity unleashed!
            </p>
            
            <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Lightning Fast</span>
              </div>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Infinity className="w-4 h-4 text-green-400" />
                <span>Unlimited Free</span>
              </div>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
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
      <ImageHistory 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
      />
    </>
  );
};

export default Header;
