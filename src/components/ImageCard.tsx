import React, { useState } from 'react';
import { Download, Copy, Clock, Check, RectangleHorizontal } from 'lucide-react';
import { GeneratedImage } from '../types';
import { copyToClipboard } from '../utils/clipboard';

interface ImageCardProps {
  image: GeneratedImage;
}

const ImageCard: React.FC<ImageCardProps> = ({ image }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `ai-generated-${image.aspectRatio || '1:1'}-${image.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyPrompt = async () => {
    try {
      await copyToClipboard(image.prompt);
      setCopyStatus('success');
    } catch (err) {
      console.error('Failed to copy prompt:', err);
      setCopyStatus('error');
      // As a final resort, show the prompt in an alert
      alert(`Could not copy automatically. Please copy this prompt manually:\n\n"${image.prompt}"`);
    }

    // Reset status after 2 seconds
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((timestamp.getTime() - Date.now()) / (1000 * 60)),
      'minute'
    );
  };

  const getAspectRatioClass = (aspectRatio?: string) => {
    switch (aspectRatio) {
      case '16:9':
        return 'aspect-video'; // 16:9
      case '4:3':
        return 'aspect-[4/3]'; // 4:3
      case '1:1':
      default:
        return 'aspect-square'; // 1:1
    }
  };

  const getAspectRatioLabel = (aspectRatio?: string) => {
    switch (aspectRatio) {
      case '16:9':
        return 'Landscape';
      case '4:3':
        return 'Classic';
      case '1:1':
      default:
        return 'Square';
    }
  };

  if (image.isLoading) {
    return (
      <div className="glass rounded-2xl overflow-hidden floating-animation">
        <div className={`bg-gray-800 relative overflow-hidden ${getAspectRatioClass(image.aspectRatio)}`}>
          <div className="absolute inset-0 shimmer"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300">Creating your image...</p>
              <p className="text-gray-500 text-sm mt-1">{getAspectRatioLabel(image.aspectRatio)} format</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="h-4 bg-gray-700 rounded animate-pulse mb-2"></div>
          <div className="h-3 bg-gray-700 rounded animate-pulse w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden group hover:scale-105 transition-all duration-300 floating-animation">
      <div className="relative overflow-hidden">
        <img
          src={image.url}
          alt={image.prompt}
          className={`w-full object-cover transition-transform duration-300 group-hover:scale-110 ${getAspectRatioClass(image.aspectRatio)}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Aspect Ratio Badge */}
        <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="glass rounded-lg px-2 py-1 text-xs text-white border border-white/20">
            <div className="flex items-center gap-1">
              <RectangleHorizontal className="w-3 h-3" />
              <span>{image.aspectRatio || '1:1'}</span>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleDownload}
            className="glass glass-hover rounded-full p-2 text-white hover:text-blue-400 transition-colors duration-300"
            title="Download image"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyPrompt}
            className={`glass glass-hover rounded-full p-2 text-white transition-colors duration-300 ${
              copyStatus === 'success' 
                ? 'text-green-400' 
                : copyStatus === 'error' 
                ? 'text-red-400' 
                : 'hover:text-green-400'
            }`}
            title={
              copyStatus === 'success' 
                ? 'Copied!' 
                : copyStatus === 'error' 
                ? 'Copy failed' 
                : 'Copy prompt'
            }
          >
            {copyStatus === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Copy status indicator */}
        {copyStatus !== 'idle' && (
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className={`glass rounded-lg px-3 py-1 text-sm ${
              copyStatus === 'success' 
                ? 'text-green-400 border-green-500/30' 
                : 'text-red-400 border-red-500/30'
            }`}>
              {copyStatus === 'success' ? 'Copied!' : 'Failed'}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <p className="text-gray-300 text-sm line-clamp-2 mb-3">{image.prompt}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>{formatTimestamp(image.timestamp)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <RectangleHorizontal className="w-3 h-3" />
            <span>{getAspectRatioLabel(image.aspectRatio)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
