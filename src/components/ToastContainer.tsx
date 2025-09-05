import React from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../contexts/ToastContext';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  // Create portal to render toasts at the body level
  const toastPortal = (
    <div className="fixed top-4 right-4 z-[100] space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            toast={toast}
            onRemove={removeToast}
          />
        </div>
      ))}
    </div>
  );

  // Only render if there are toasts and if we can access document.body
  if (toasts.length === 0 || typeof document === 'undefined') {
    return null;
  }

  return createPortal(toastPortal, document.body);
};

export default ToastContainer;