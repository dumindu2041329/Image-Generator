# Profile Management Feature

This document describes the comprehensive profile management feature implemented for the Image Generator application.

## Overview

The profile management feature allows authenticated users to manage their account information including:
- Profile image
- Full name
- Email address
- Password

## Features

### Profile Image Management
- Upload custom profile images (JPEG, PNG, WebP)
- Automatic image validation (file type and size)
- Smart image replacement (deletes old image when uploading new one)
- Fallback avatar generation using user initials
- Responsive image display with loading states

### Profile Information
- Update full name with real-time validation
- Change email address with dual-verification flow
- Secure password update with confirmation

### User Experience
- Intuitive form-based interface
- Real-time validation with clear error messages
- Visual feedback through toast notifications
- Responsive design for all device sizes
- Accessible UI with proper ARIA attributes

## Architecture

### Core Components

1. **ProfilePage** (`src/pages/ProfilePage.tsx`)
   - Main profile management interface
   - Organized into logical sections (Profile Image, Profile Info, Email, Password)
   - Form validation and error handling
   - Integration with authentication and toast systems

2. **ProfileImage** (`src/components/ProfileImage.tsx`)
   - Reusable profile image display component
   - Supports different sizes (sm, md, lg, xl)
   - Editable mode with file upload
   - Fallback to initials or user icon
   - Loading states and error handling

3. **ProfileImageService** (`src/services/profileImageService.ts`)
   - Handles profile image upload to Supabase Storage
   - File validation (type, size)
   - Image cleanup (deletes old images)
   - URL management and path extraction

4. **Extended useAuth Hook** (`src/hooks/useAuth.ts`)
   - Added `updateProfile`, `updateEmail`, and `updatePassword` methods
   - Proper error handling and configuration checks

### Navigation Integration

- Added `/profile` route in App.tsx
- Profile option in UserMenu dropdown
- Consistent navigation patterns with other pages

## Implementation Details

### Profile Image Upload Flow
1. User selects image file through ProfileImage component
2. File is validated for type (JPEG/PNG/WebP) and size (<5MB)
3. Existing profile image is deleted from storage
4. New image is uploaded with unique filename
5. User metadata is updated with new avatar URL
6. UI is updated with new image

### Form Validation
- Real-time validation as users type
- Clear error messages for each field
- Prevents submission of invalid data
- Special handling for email changes (dual-verification)

### Security Considerations
- Password confirmation required for sensitive operations
- File type and size validation for uploads
- Proper error handling to prevent information leakage
- Secure Supabase integration

## Styling

The profile management feature uses the application's existing design system:
- Glass morphism effect consistent with app's visual style
- Responsive layout that works on mobile and desktop
- Consistent color scheme and typography
- Smooth animations and transitions

## Usage

### Accessing Profile Management
1. Sign in to the application
2. Click on your profile image in the top-right corner
3. Select "Profile" from the dropdown menu
4. Manage your profile information in the different sections

### Updating Profile Information
1. **Profile Image**: Click on your profile image to upload a new one
2. **Full Name**: Edit in the "Profile Information" section and click "Update Profile"
3. **Email**: Enter new email in the "Email Address" section and click "Update Email"
4. **Password**: Enter new password in the "Change Password" section and click "Change Password"

## Error Handling

The system provides comprehensive error handling:
- File upload errors
- Network connectivity issues
- Validation errors
- Authentication errors
- Supabase service errors

All errors are communicated to users through toast notifications with clear, actionable messages.

## Future Enhancements

Potential improvements for the profile management system:
- Two-factor authentication setup
- Account deletion functionality
- Export personal data option
- Dark/light theme preference
- Language preference settings