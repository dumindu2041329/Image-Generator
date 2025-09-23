import React from 'react';
import { Heart, Github, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-20 py-8 px-4 border-t border-white/10">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center gap-6 mb-4">
          <a
            href="https://github.com/dumindu2041329"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-400 transition-colors duration-300"
            title="GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
          <a
            href="https://www.linkedin.com/in/dumindu-damsara-0049ab246/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-400 transition-colors duration-300"
            title="LinkedIn"
          >
            <Linkedin className="w-5 h-5" />
          </a>
        </div>
        
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} AI Image Generator. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
