# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **Free AI Image Generator** built with React, TypeScript, and Vite. The application generates AI images using the free Pollinations AI service with optional user authentication via Clerk and image storage via Supabase.

### Key Features
- **100% Free Image Generation** using Pollinations AI (no API keys required)
- **Optional User Authentication** with Clerk for saving image history
- **Cloud Storage** with Supabase for authenticated users
- **Multiple Aspect Ratios** (1:1, 16:9, 4:3) and styles (vivid, natural)
- **Responsive Design** with Tailwind CSS and glassmorphism UI

## Development Commands

### Essential Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Development Workflow
```bash
# Install dependencies
npm install

# Start development with hot reload
npm run dev
# Opens at http://localhost:5173

# Build and test production bundle
npm run build && npm run preview
```

## Architecture Overview

### Core Application Structure

**Entry Point & Routing**
- `src/main.tsx` - Application entry point with React root rendering
- `src/App.tsx` - Main app component with routing and authentication providers
- Uses React Router for client-side routing with lazy-loaded pages

**Authentication Architecture**
- **Dual Provider System**: Clerk (for auth) + Supabase (for data storage)
- `src/lib/clerk.ts` - Clerk configuration and JWT token management
- `src/lib/supabase.ts` - Supabase client with Clerk JWT integration
- `src/hooks/useAuth.ts` - Unified authentication hook
- Custom RLS (Row Level Security) policies using Clerk JWT `sub` claim as user ID

**Image Generation System**
- `src/services/imageService.ts` - Multi-tier image generation service
- **Primary**: Pollinations AI (free, no API key)
- **Fallback 1**: Alternative free services
- **Fallback 2**: Demo placeholder images
- Supports prompt enhancement based on style preferences

**State Management**
- React hooks for local state management
- `src/hooks/useImageHistory.ts` - Manages saved images with Supabase integration
- `src/contexts/ToastContext.tsx` - Global toast notification system

### Key Components Architecture

**Page Components** (`src/pages/`)
- `HomePage.tsx` - Main image generation interface
- `MyImagesPage.tsx` - User's saved images with favorites/deletion
- `ProfilePage.tsx` - User profile management
- Auth-related pages for confirmation flows

**UI Components** (`src/components/`)
- `PromptInput.tsx` - Advanced prompt input with settings (aspect ratio, style)
- `ImageGrid.tsx` & `ImageCard.tsx` - Image display and interaction
- `AuthModal.tsx` - Authentication modal with Clerk integration
- `Header.tsx` & `UserMenu.tsx` - Navigation and user management

### Data Flow Architecture

1. **Image Generation Flow**:
   ```
   User Input → PromptInput → ImageGenerationService → Display → Optional Save (if authenticated)
   ```

2. **Authentication Flow**:
   ```
   Clerk Auth → JWT Token → Supabase RLS → Database Operations
   ```

3. **Storage Flow**:
   ```
   Generated Image → Fetch Blob → Upload to Supabase Storage → Save Metadata to Database
   ```

## Configuration Management

### Environment Variables
Required for full functionality:
```bash
# Supabase Configuration (optional but recommended)
VITE_SUPABASE_URL="your_supabase_project_url"
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"

# Clerk Configuration (optional but recommended)
VITE_CLERK_PUBLISHABLE_KEY="pk_test_your_clerk_key"
```

**Graceful Degradation**: App works without these credentials but with limited functionality.

### Database Setup
If using Supabase, run the SQL scripts in order:
1. `src/sql/supabase_setup_generated_images.sql` - Main database schema and RLS policies

### Authentication Setup
- **Clerk**: Configure JWT templates for Supabase integration
- **Supabase**: Use RLS policies that read Clerk JWT tokens via `auth_ext_id()` function

## Build & Deployment Configuration

### Vite Configuration (`vite.config.ts`)
- **Chunk Splitting**: Optimized vendor chunks for React, routing, Clerk, Supabase, and utilities
- **Build Optimization**: ESBuild minification, tree shaking
- **Dev Optimization**: Dependency pre-bundling with exclusions for problematic packages

### Styling Architecture
- **Tailwind CSS** with custom utilities and components
- **Glassmorphism Design** with custom CSS classes (`glass`, `glass-hover`)
- **Gradient System** for text and backgrounds
- **Custom Animations** (floating, shimmer, pulse-glow)
- **Responsive Scrollbars** with gradient styling

## Testing & Quality

### Code Quality Tools
- **ESLint** with TypeScript and React configurations
- **TypeScript** in strict mode with comprehensive type checking
- **Clerk + Supabase Types** for full type safety

### Error Handling Strategy
- **Progressive Enhancement**: Graceful degradation when services unavailable
- **Multi-tier Fallbacks**: Primary service → Alternative → Demo images
- **User Feedback**: Toast notifications for all user actions
- **Error Boundaries**: Component-level error handling

## Key Development Notes

### Authentication Integration
- The app uses Clerk's `sub` claim as the user ID throughout the system
- Supabase RLS policies authenticate using Clerk JWT tokens
- Custom `auth_ext_id()` function extracts user ID from JWT for database operations

### Image Generation Resilience
- Multiple URL formats attempted for Pollinations AI
- Automatic fallback to alternative services if primary fails
- Content validation (MIME type, content length) before displaying images

### Performance Optimizations
- Lazy loading for non-critical pages
- Optimized chunk splitting in Vite config
- Image loading states and skeleton UI
- Debounced operations where appropriate

### UI/UX Patterns
- **Glass morphism** design system with consistent visual hierarchy
- **Progressive disclosure** (e.g., expandable settings in PromptInput)
- **Contextual feedback** through toast notifications
- **Responsive design** with mobile-first approach

This architecture supports both anonymous usage (basic image generation) and authenticated usage (with history, favorites, and cloud storage) through a unified, type-safe interface.
