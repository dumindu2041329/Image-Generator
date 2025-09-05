import React, { useState } from 'react';
import { User, Camera, Upload } from 'lucide-react';

interface ProfileImageProps {
  imageUrl?: string;
  fullName?: string;
  email?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  onImageChange?: (file: File) => void;
  loading?: boolean;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  imageUrl,
  fullName,
  email,
  size = 'md',
  editable = false,
  onImageChange,
  loading = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-8 h-8', icon: 'w-3 h-3', text: 'text-xs' },
    md: { container: 'w-12 h-12', icon: 'w-5 h-5', text: 'text-sm' },
    lg: { container: 'w-20 h-20', icon: 'w-8 h-8', text: 'text-lg' },
    xl: { container: 'w-32 h-32', icon: 'w-12 h-12', text: 'text-2xl' },
  };

  const config = sizeConfig[size];

  // Generate initials from name or email
  const getInitials = () => {
    if (fullName) {
      return fullName
        .split(' ')
        .map(name => name.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageChange) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return;
      }
      
      onImageChange(file);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Reset error when imageUrl changes
  React.useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <div className="animate-spin rounded-full border-2 border-white/30 border-t-white w-1/2 h-1/2"></div>
        </div>
      );
    }

    if (imageUrl && !imageError) {
      return (
        <img
          src={imageUrl}
          alt={fullName || 'Profile'}
          onError={handleImageError}
          className="w-full h-full object-cover"
        />
      );
    }

    // Fallback to initials or user icon
    const initials = getInitials();
    if (initials && initials !== 'U') {
      return (
        <span className={`font-semibold text-white ${config.text}`}>
          {initials}
        </span>
      );
    }

    return <User className={`text-white ${config.icon}`} />;
  };

  if (editable) {
    return (
      <div className="relative">
        <div className={`
          ${config.container} 
          rounded-full 
          bg-gradient-to-r from-blue-500 to-purple-600 
          flex items-center justify-center 
          overflow-hidden 
          border-2 border-white/20
          cursor-pointer
          group
          hover:scale-105
          transition-all duration-200
        `}>
          {renderContent()}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <Camera className="w-1/3 h-1/3 text-white" />
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={loading}
        />

        {/* Upload indicator */}
        {editable && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
            <Upload className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`
      ${config.container} 
      rounded-full 
      bg-gradient-to-r from-blue-500 to-purple-600 
      flex items-center justify-center 
      overflow-hidden 
      border-2 border-white/20
    `}>
      {renderContent()}
    </div>
  );
};

export default ProfileImage;