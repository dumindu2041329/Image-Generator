import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Toast as ToastType } from '../contexts/ToastContext';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Animation states
  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    // Wait for exit animation before removing
    setTimeout(() => onRemove(toast.id), 300);
  };

  // Progress bar for duration
  const [progress, setProgress] = useState(100);
  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const decrement = (100 / toast.duration!) * 100; // Update every 100ms
        return Math.max(0, prev - decrement);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [toast.duration]);

  const getToastStyles = () => {
    const baseStyles = "relative overflow-hidden glass border-l-4";
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} border-green-500 bg-green-500/10`;
      case 'error':
        return `${baseStyles} border-red-500 bg-red-500/10`;
      case 'warning':
        return `${baseStyles} border-yellow-500 bg-yellow-500/10`;
      case 'info':
        return `${baseStyles} border-blue-500 bg-blue-500/10`;
      default:
        return `${baseStyles} border-gray-500 bg-gray-500/10`;
    }
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5";
    
    switch (toast.type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-400`} />;
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-400`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-400`} />;
      case 'info':
        return <Info className={`${iconClass} text-blue-400`} />;
      default:
        return <Info className={`${iconClass} text-gray-400`} />;
    }
  };

  const getProgressBarColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className={`
        rounded-xl p-4 max-w-sm w-full transition-all duration-300 transform
        ${getToastStyles()}
        ${isVisible && !isRemoving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className={`h-full transition-all duration-100 linear ${getProgressBarColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium text-sm leading-5">
            {toast.title}
          </h4>
          
          {toast.message && (
            <p className="text-gray-300 text-sm mt-1 leading-5">
              {toast.message}
            </p>
          )}

          {/* Action button */}
          {toast.action && (
            <div className="mt-3">
              <button
                onClick={toast.action.onClick}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleRemove}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-white/10"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;