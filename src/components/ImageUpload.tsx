import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { UploadedImage } from '../types';

interface ImageUploadProps {
  onImageUpload: (image: UploadedImage | null) => void;
  uploadedImage: UploadedImage | null;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  uploadedImage,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file (JPG, PNG, GIF, WebP)';
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return 'Image must be smaller than 10MB';
    }

    return null;
  };

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const url = URL.createObjectURL(file);
    
    onImageUpload({
      file,
      url,
      name: file.name
    });
  }, [onImageUpload]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile, disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleRemoveImage = useCallback(() => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.url);
    }
    onImageUpload(null);
    setError(null);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadedImage, onImageUpload]);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        className={`relative rounded-xl border-2 border-dashed transition-all duration-300 ${
          dragActive
            ? 'border-blue-400 bg-blue-500/10'
            : uploadedImage
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-gray-600 hover:border-gray-500'
        } ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {uploadedImage ? (
          // Image Preview
          <div className="relative group">
            <img
              src={uploadedImage.url}
              alt={uploadedImage.name}
              className="w-full h-32 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {uploadedImage.name}
            </div>
          </div>
        ) : (
          // Upload Placeholder
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              {dragActive ? (
                <Upload className="w-8 h-8 text-blue-400" />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-white">
                  {dragActive ? 'Drop image here' : 'Upload source image'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Drag & drop or click to browse
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, GIF, WebP • Max 10MB
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Helper Text */}
      {uploadedImage && !error && (
        <div className="text-xs text-gray-400 text-center">
          Upload a different image to replace this one
        </div>
      )}
    </div>
  );
};

export default ImageUpload;