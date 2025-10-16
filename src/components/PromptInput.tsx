import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Send, Wand2, Settings, Zap, RectangleHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

interface PromptInputProps {
  onGenerate: (request: {
    prompt: string;
    aspectRatio?: '1:1' | '16:9' | '4:3';
  }) => void;
  isGenerating: boolean;
}

export interface PromptInputRef {
  focus: () => void;
}

const PromptInput = forwardRef<PromptInputRef, PromptInputProps>(({ onGenerate, isGenerating }, ref) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3'>('1:1');
  const [showSettings, setShowSettings] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onGenerate({
        prompt: prompt.trim(),
        aspectRatio
      });
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    adjustTextareaHeight();
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [prompt]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }), []);

  const suggestedPrompts = [
    'A serene mountain landscape at sunset',
    'Cyberpunk city with neon lights',
    'Magical forest with glowing mushrooms',
    'Futuristic spaceship in deep space',
    'Abstract geometric art in vibrant colors',
    'Cozy cottage in a snowy winter scene',
    'Majestic dragon soaring through clouds',
    'Underwater coral reef with tropical fish',
  ];

  const aspectRatioOptions = [
    { 
      value: '1:1', 
      label: 'Square', 
      ratio: '1:1',
      description: 'Perfect for social media posts',
      icon: '⬜',
      dimensions: '512×512'
    },
    { 
      value: '16:9', 
      label: 'Landscape', 
      ratio: '16:9',
      description: 'Great for wallpapers and presentations',
      icon: '🖥️',
      dimensions: '768×432'
    },
    { 
      value: '4:3', 
      label: 'Classic', 
      ratio: '4:3',
      description: 'Traditional photo format',
      icon: '📷',
      dimensions: '640×480'
    },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 mb-6 sm:mb-8 md:mb-12">
      {/* Free AI Notice */}
      <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 border-l-4 border-green-500">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <div>
            <p className="text-green-200 font-medium text-sm sm:text-base">100% Free AI Image Generation</p>
            <p className="text-green-300 text-xs sm:text-sm">Powered by Pollinations AI • No API keys, no limits, no costs!</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="glass rounded-xl sm:rounded-2xl p-1">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 p-2 sm:p-4">
            <div className="flex-1 relative">
              <Wand2 className="absolute left-3 sm:left-4 top-3 sm:top-4 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={handlePromptChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                placeholder="Describe the image you want to generate..."
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-transparent text-white placeholder-gray-400 text-sm sm:text-base md:text-lg focus:outline-none resize-none overflow-y-auto min-h-[48px] sm:min-h-[56px] max-h-[200px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500"
                disabled={isGenerating}
                rows={1}
              />
            </div>
            
            <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`glass-hover rounded-lg sm:rounded-xl p-2 sm:p-4 transition-all duration-300 relative flex-1 sm:flex-none ${
                  showSettings 
                    ? 'text-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/25' 
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Settings"
              >
                <div className="flex items-center justify-center sm:gap-2">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="sm:hidden ml-1.5 text-xs">Settings</span>
                  {showSettings ? (
                    <ChevronUp className="hidden sm:block w-4 h-4" />
                  ) : (
                    <ChevronDown className="hidden sm:block w-4 h-4" />
                  )}
                </div>
                {/* Active indicator */}
                {showSettings && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                )}
              </button>

              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className="glass-hover rounded-lg sm:rounded-xl px-4 sm:px-6 py-2 sm:py-4 flex items-center justify-center gap-1.5 sm:gap-2 text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group flex-1 sm:flex-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-1.5 sm:gap-2">
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">
                    {isGenerating ? 'Generate' : 'Generate'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Enhanced Settings Panel */}
          {showSettings && (
            <div className="border-t border-white/20 bg-gray-800/30 backdrop-blur-sm">
              <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 md:space-y-8">
                <div className="text-center">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Generation Settings</h3>
                  <p className="text-xs sm:text-sm text-gray-400">Customize your AI image generation</p>
                </div>

                {/* Aspect Ratio Selection - More Prominent */}
                <div>
                  <label className="block text-sm sm:text-base text-white mb-3 sm:mb-4 font-semibold flex items-center gap-2">
                    <RectangleHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    Choose Aspect Ratio
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    {aspectRatioOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAspectRatio(option.value)}
                        className={`relative p-3 sm:p-4 rounded-lg sm:rounded-xl text-left transition-all duration-300 transform hover:scale-105 ${
                          aspectRatio === option.value
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400'
                            : 'glass glass-hover text-gray-300 hover:bg-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                          <span className="text-xl sm:text-2xl">{option.icon}</span>
                          <div>
                            <div className="font-semibold text-sm sm:text-base">{option.label}</div>
                            <div className="text-xs sm:text-sm opacity-80">{option.ratio}</div>
                          </div>
                        </div>
                        <div className="text-xs opacity-75 mb-1 sm:mb-2">{option.description}</div>
                        <div className="text-xs font-mono opacity-60">{option.dimensions}px</div>
                        
                        {/* Selection Indicator */}
                        {aspectRatio === option.value && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Free AI Info */}
                <div className="glass rounded-lg sm:rounded-xl p-4 sm:p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30">
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-semibold text-white mb-2">🎆 Completely Free AI Generation</div>
                    <div className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4">
                      Your images are generated using Pollinations AI for high-quality results:
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-300">Pollinations AI - Free & Unlimited</span>
                    </div>
                  </div>
                </div>

                {/* Current Settings Summary */}
                <div className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30">
                  <div className="text-xs sm:text-sm text-green-300 mb-2 font-medium">Ready to Generate:</div>
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <RectangleHorizontal className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">
                        {aspectRatioOptions.find(opt => opt.value === aspectRatio)?.label} ({aspectRatio})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">
                        100% Free
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </form>

      {/* Suggested Prompts */}
      <div className="mt-4 sm:mt-6">
        <p className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3 text-center">✨ Try these creative prompts:</p>
        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
          {suggestedPrompts.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setPrompt(suggestion)}
              disabled={isGenerating}
              className="glass glass-hover rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-300 transition-all duration-300 hover:text-white disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

PromptInput.displayName = 'PromptInput';

export default PromptInput;
