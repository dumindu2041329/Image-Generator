# Toast Notification System

This document describes the comprehensive toast notification system implemented for the Image Generator application.

## Overview

The toast notification system provides user-friendly feedback for all user interactions throughout the application. It replaces traditional alert dialogs and provides a modern, non-intrusive way to communicate with users.

## Features

### Toast Types
- **Success** (Green): Confirmations, successful operations
- **Error** (Red): Error messages, failed operations
- **Warning** (Yellow): Important notices, partial failures
- **Info** (Blue): General information, tips

### Key Features
- **Auto-dismiss**: Toasts automatically disappear after a configurable duration
- **Manual dismiss**: Users can click the × button to dismiss toasts manually
- **Progress bar**: Visual indication of remaining time
- **Stacking**: Multiple toasts can be displayed simultaneously
- **Animations**: Smooth entrance and exit animations
- **Responsive**: Works on desktop and mobile devices
- **Accessibility**: Proper ARIA attributes and screen reader support

## Architecture

### Core Components

1. **ToastContext** (`src/contexts/ToastContext.tsx`)
   - Provides global state management for toasts
   - Exports `useToast` hook for consuming components
   - Includes convenience methods: `showSuccess`, `showError`, `showWarning`, `showInfo`

2. **Toast Component** (`src/components/Toast.tsx`)
   - Individual toast component with styling and animations
   - Handles progress bar, icons, and user interactions
   - Supports different types with appropriate colors and icons

3. **ToastContainer** (`src/components/ToastContainer.tsx`)
   - Manages multiple toasts
   - Renders toasts using React Portal for proper z-index management
   - Positioned at top-right of screen

## Usage Examples

### Basic Usage

```typescript
import { useToast } from '../contexts/ToastContext';

const MyComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleSuccess = () => {
    showSuccess('Success!', 'Operation completed successfully.');
  };

  const handleError = () => {
    showError('Error!', 'Something went wrong.');
  };

  const handleWarning = () => {
    showWarning('Warning!', 'Please be careful.');
  };

  const handleInfo = () => {
    showInfo('Info', 'This is important information.');
  };

  // ... rest of component
};
```

### Advanced Usage with Custom Options

```typescript
const { addToast } = useToast();

// Custom duration
addToast({
  type: 'success',
  title: 'Custom Success',
  message: 'This toast will last 10 seconds',
  duration: 10000
});

// Toast with action button
addToast({
  type: 'info',
  title: 'New Feature Available',
  message: 'Click to learn more',
  action: {
    label: 'Learn More',
    onClick: () => {
      // Handle action
    }
  }
});

// Persistent toast (no auto-dismiss)
addToast({
  type: 'error',
  title: 'Critical Error',
  message: 'This requires immediate attention',
  duration: 0 // Won't auto-dismiss
});
```

## Integration Points

The toast system is integrated throughout the application:

### Authentication
- **Sign In**: Success/error notifications
- **Sign Up**: Account creation confirmation
- **Sign Out**: Confirmation message
- **Password Reset**: Email sent confirmation

### Image Generation
- **Generation Success**: Confirmation with image details
- **Generation Failure**: Clear error messages
- **Saving Success**: Confirmation when image is saved to history
- **Saving Warning**: When image generates but can't be saved

### Image Management
- **Download**: Success confirmation
- **Copy Prompt**: Success/failure feedback
- **Add/Remove Favorites**: Immediate feedback
- **Delete**: Confirmation after successful deletion

## Styling

The toast system uses the application's existing design system:

- **Glass morphism effect**: Consistent with app's visual style
- **Color coding**: Matches the app's color scheme
- **Typography**: Uses app's font family and sizing
- **Animations**: Smooth transitions that don't disrupt user experience

## Configuration

### Default Durations
- Success: 5 seconds
- Error: 7 seconds (longer for user to read)
- Warning: 6 seconds
- Info: 5 seconds

### Positioning
- Fixed position at top-right of viewport
- Stacks vertically with 12px spacing
- High z-index (100) to ensure visibility

## Best Practices

1. **Message Clarity**: Use clear, concise messages that explain what happened
2. **Appropriate Types**: Choose the correct type based on the severity and nature of the message
3. **Duration**: Consider message length and importance when setting duration
4. **Actions**: Use action buttons sparingly and only when they provide clear value
5. **Consistency**: Use consistent language and tone across all notifications

## Accessibility

- **ARIA Labels**: Proper `role="alert"` and `aria-live="polite"` attributes
- **Keyboard Navigation**: Close button is keyboard accessible
- **Screen Readers**: Messages are announced to screen reader users
- **Color Independence**: Icons and text provide information beyond just color

## Performance

- **Portal Rendering**: Toasts are rendered outside the main component tree
- **Memory Management**: Automatic cleanup of dismissed toasts
- **Minimal Re-renders**: Optimized with React.useCallback and React.memo patterns

## Browser Support

The toast system works on all modern browsers that support:
- CSS3 transforms and transitions
- React Portals
- ES6 features

## Future Enhancements

Potential improvements for the toast system:
- Sound notifications for important alerts
- Persistent notifications that survive page refreshes
- Grouping related notifications
- Undo functionality for destructive actions
- Email/SMS integration for critical notifications