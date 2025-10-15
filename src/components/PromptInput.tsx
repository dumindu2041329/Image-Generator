import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Send, Wand2, Loader2, Settings, Zap, RectangleHorizontal, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { UploadedImage } from '../types';

interface PromptInputProps {
  onGenerate: (prompt: string, style?: 'vivid' | 'natural', aspectRatio?: '1:1' | '16:9' | '4:3', sourceImage?: File | string, strength?: number) => void;
  isGenerating: boolean;
}

export interface PromptInputRef {
  setEditMode: (imageUrl: string, originalPrompt: string) => void;
}

const PromptInput = forwardRef<PromptInputRef, PromptInputProps>(({ onGenerate, isGenerating }, ref) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3'>('1:1');
  const [showSettings, setShowSettings] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [strength, setStrength] = useState(0.7);
  const [showImageToImage, setShowImageToImage] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onGenerate(
        prompt.trim(), 
        style, 
        aspectRatio, 
        uploadedImage?.file, 
        uploadedImage ? strength : undefined
      );
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
    setEditMode: (imageUrl: string, originalPrompt: string) => {
      // Convert URL to File-like object for editing
      fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
          const file = new File([blob], 'edit-source.jpg', { type: blob.type });
          const url = URL.createObjectURL(file);
          
          setUploadedImage({
            file,
            url,
            name: 'Source image for editing'
          });
          
          setPrompt(`Edit this image: ${originalPrompt}`);
          setShowImageToImage(true);
          setStrength(0.5); // Moderate transformation for editing
        })
        .catch(console.error);
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
      dimensions: '1024×1024'
    },
    { 
      value: '16:9', 
      label: 'Landscape', 
      ratio: '16:9',
      description: 'Great for wallpapers and presentations',
      icon: '🖥️',
      dimensions: '1024×576'
    },
    { 
      value: '4:3', 
      label: 'Classic', 
      ratio: '4:3',
      description: 'Traditional photo format',
      icon: '📷',
      dimensions: '1024×768'
    },
  ] as const;

  const styleOptions = [
    {
      value: 'vivid',
      label: 'Vivid',
      icon: '✨',
      description: 'Dramatic lighting, vibrant colors, and high detail'
    },
    {
      value: 'natural',
      label: 'Natural',
      icon: '🌿',
      description: 'More natural, realistic images with soft colors'
    }
  ] as const;

  return (
    <div className="max-w-4xl mx-auto px-4 mb-12">
      {/* Free API Notice */}
      <div className="glass rounded-2xl p-4 mb-6 border-l-4 border-green-500">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-green-200 font-medium">100% Free AI Generation</p>
            <p className="text-green-300 text-sm">Powered by Pollinations AI - No API keys required, unlimited usage!</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="glass rounded-2xl p-1">
          <div className="flex items-center gap-4 p-4">
            <div className="flex-1 relative">
              <Wand2 className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
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
                className="w-full pl-12 pr-4 py-4 bg-transparent text-white placeholder-gray-400 text-lg focus:outline-none resize-none overflow-y-auto min-h-[56px] max-h-[200px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500"
                disabled={isGenerating}
                rows={1}
              />
            </div>
            
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`glass-hover rounded-xl p-4 transition-all duration-300 relative ${
                showSettings 
                  ? 'text-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/25' 
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Settings"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {showSettings ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
              {/* Active indicator */}
              {showSettings && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowImageToImage(!showImageToImage)}
              className={`glass-hover rounded-xl p-4 transition-all duration-300 relative ${
                showImageToImage || uploadedImage
                  ? 'text-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/25' 
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Image-to-Image"
            >
              <ImageIcon className="w-5 h-5" />
              {uploadedImage && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full"></div>
              )}
            </button>
            
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className="glass-hover rounded-xl px-6 py-4 flex items-center gap-2 text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-2">
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">
                  {isGenerating ? 'Generate' : 'Generate'}
                </span>
              </div>
            </button>
          </div>

          {/* Enhanced Settings Panel */}
          {showSettings && (
            <div className="border-t border-white/20 bg-gray-800/30 backdrop-blur-sm">
              <div className="p-6 space-y-8">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Generation Settings</h3>
                  <p className="text-sm text-gray-400">Customize your AI image generation</p>
                </div>

                {/* Aspect Ratio Selection - More Prominent */}
                <div>
                  <label className="block text-base text-white mb-4 font-semibold flex items-center gap-2">
                    <RectangleHorizontal className="w-5 h-5 text-blue-400" />
                    Choose Aspect Ratio
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aspectRatioOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAspectRatio(option.value)}
                        className={`relative p-4 rounded-xl text-left transition-all duration-300 transform hover:scale-105 ${
                          aspectRatio === option.value
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400'
                            : 'glass glass-hover text-gray-300 hover:bg-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{option.icon}</span>
                          <div>
                            <div className="font-semibold text-base">{option.label}</div>
                            <div className="text-sm opacity-80">{option.ratio}</div>
                          </div>
                        </div>
                        <div className="text-xs opacity-75 mb-2">{option.description}</div>
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

                {/* Style Selection */}
                <div>
                  <label className="block text-base text-white mb-4 font-semibold flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-purple-400" />
                    Generation Style
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {styleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStyle(option.value as 'vivid' | 'natural')}
                        className={`p-4 rounded-xl text-left transition-all duration-300 transform hover:scale-105 ${
                          style === option.value
                            ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25 ring-2 ring-purple-400'
                            : 'glass glass-hover text-gray-300 hover:bg-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl">{option.icon}</span>
                          <div className="font-semibold">{option.label}</div>
                        </div>
                        <div className="text-sm opacity-80">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Settings Summary */}
                <div className="glass rounded-xl p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30">
                  <div className="text-sm text-blue-300 mb-2 font-medium">Current Configuration:</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <RectangleHorizontal className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">
                        {aspectRatioOptions.find(opt => opt.value === aspectRatio)?.label} ({aspectRatio})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-300">
                        {styleOptions.find(opt => opt.value === style)?.label} Style
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Image-to-Image Panel */}
          {showImageToImage && (
            <div className="border-t border-white/20 bg-purple-800/20 backdrop-blur-sm">
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center justify-center gap-2">
                    <ImageIcon className="w-5 h-5 text-purple-400" />
                    Image-to-Image Generation
                  </h3>
                  <p className="text-sm text-gray-400">Upload a source image and describe how to transform it</p>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-base text-white mb-4 font-semibold">
                    Source Image
                  </label>
                  <ImageUpload
                    onImageUpload={setUploadedImage}
                    uploadedImage={uploadedImage}
                    disabled={isGenerating}
                  />
                </div>

                {/* Strength Control */}
                {uploadedImage && (
                  <div>
                    <label className="block text-base text-white mb-4 font-semibold">
                      Transformation Strength: {Math.round(strength * 100)}%
                    </label>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={strength}
                        onChange={(e) => setStrength(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Subtle (10%)</span>
                        <span>Balanced (50%)</span>
                        <span>Strong (100%)</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Lower values keep more of the original image, higher values create more dramatic changes
                      </p>
                    </div>
                  </div>
                )}

                {/* Usage Tips */}
                <div className="glass rounded-xl p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                  <div className="text-sm text-purple-300 mb-2 font-medium">💡 Tips for better results:</div>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Describe what you want to change about the image</li>
                    <li>• Use specific style keywords (e.g., "cartoon", "oil painting", "photorealistic")</li>
                    <li>• Lower strength preserves more original details</li>
                    <li>• Higher strength allows more creative freedom</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Suggested Prompts */}
      <div className="mt-6">
        <p className="text-sm text-gray-400 mb-3 text-center">✨ Try these creative prompts:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {suggestedPrompts.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setPrompt(suggestion)}
              disabled={isGenerating}
              className="glass glass-hover rounded-full px-4 py-2 text-sm text-gray-300 transition-all duration-300 hover:text-white disabled:opacity-50"
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
