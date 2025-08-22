import React from 'react';
import { Heart, Github, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-20 py-8 px-4 border-t border-white/10">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-gray-400">Made with</span>
          <Heart className="w-4 h-4 text-red-500" />
          <span className="text-gray-400">by Dualite Alpha</span>
        </div>
        
        <div className="flex items-center justify-center gap-6 mb-4">
          <a
            href="#"
            className="text-gray-400 hover:text-blue-400 transition-colors duration-300"
            title="GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
          <a
            href="#"
            className="text-gray-400 hover:text-blue-400 transition-colors duration-300"
            title="Twitter"
          >
            <Twitter className="w-5 h-5" />
          </a>
        </div>
        
        <p className="text-sm text-gray-500">
          © 2025 AI Image Generator. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
