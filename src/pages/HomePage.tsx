import React, { useState, useEffect, useRef } from 'react';
import { GeneratedImage } from '../types';
import { ImageGenerationService } from '../services/imageService';
import { useImageHistory } from '../hooks/useImageHistory';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import Header from '../components/Header';
import PromptInput, { PromptInputRef } from '../components/PromptInput';
import ImageGrid from '../components/ImageGrid';
import Footer from '../components/Footer';

const HomePage: React.FC = () => {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { saveImage } = useImageHistory();
  const { user, isConfigured } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const prevUserRef = useRef(user);
  const imageGridRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<PromptInputRef>(null);

  // This effect clears the locally generated images when the user logs out.
  useEffect(() => {
    // Check if the user state has transitioned from logged-in to logged-out
    if (prevUserRef.current && !user) {
      setImages([]);
    }
    // Update the ref to the current user for the next render cycle
    prevUserRef.current = user;
  }, [user]);

  const handleGenerate = (request: {
    prompt: string;
    aspectRatio?: '1:1' | '16:9' | '4:3';
    generationStyle?: 'vivid' | 'natural';
  }) => {
    setIsGenerating(true);
    const startTime = performance.now();
    
    try {
      // Generate image with Pollinations AI - NOW SYNCHRONOUS FOR MAXIMUM SPEED!
      const generatedImage = ImageGenerationService.generateImage(request);
      
      const generationTime = Math.round(performance.now() - startTime);
      
      // Start preloading the image immediately for faster display
      ImageGenerationService.preloadImage(generatedImage.url).catch(() => {
        // Ignore preload errors - image will still load normally
      });
      
      // Immediately add the generated image to the top of the list
      setImages(prev => [generatedImage, ...prev]);
      
      // Show success notification immediately with generation time
      showSuccess(
        'Image Generated Instantly!',
        `Created a ${request.aspectRatio || '1:1'} image in ${generationTime}ms using Pollinations AI.`
      );

      // Ultra-fast scroll to generated images section
      setTimeout(() => {
        if (imageGridRef.current) {
          imageGridRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 50); // Reduced to 50ms for maximum speed

      // Save to Supabase in the background (non-blocking)
      if (isConfigured && user) {
        // Don't await - let it run in background so image shows immediately
        saveImage(
          request.prompt,
          generatedImage.url,
          request.aspectRatio || '1:1',
          request.generationStyle || 'vivid' // Use selected style from UI
        ).then(() => {
          // Only show save success if no other notifications are showing
          setTimeout(() => {
            showSuccess(
              'Image Saved!',
              'Your generated image has been saved to your history.'
            );
          }, 1000); // Delay so it doesn't conflict with generation success message
        }).catch((saveError) => {
          // For Pollinations AI, saving failures are less critical since images are always viewable
          console.warn('Save to history failed:', saveError);
          setTimeout(() => {
            showWarning(
              'Image Generated Successfully',
              'Your image was created but could not be saved to your history. The image is still available above!'
            );
          }, 1000); // Delay so it doesn't conflict with generation success message
        });
      }
    } catch (error) {
      // Handle error with user notification
      if (error instanceof Error) {
        showError(
          'Image Generation Failed',
          error.message
        );
      } else {
        showError(
          'Image Generation Failed',
          'An unexpected error occurred. Please try again.'
        );
      }
    } finally {
      // Set generating to false after a minimal delay to show the loading state briefly
      setTimeout(() => setIsGenerating(false), 100);
    }
  };


  return (
    <div className="min-h-screen">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10">
        <Header />
        
        {/* Success notification for authenticated users */}
        {isConfigured && user && (
          <div className="max-w-4xl mx-auto px-3 sm:px-4 mb-4 sm:mb-6">
            <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 border-l-4 border-green-500">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs sm:text-sm font-bold">✓</span>
                </div>
                <div>
                  <p className="text-green-200 font-medium text-sm sm:text-base">Authentication Active</p>
                  <p className="text-green-300 text-xs sm:text-sm">Your generated images are automatically saved to your history!</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <PromptInput ref={promptInputRef} onGenerate={handleGenerate} isGenerating={isGenerating} />
        <ImageGrid ref={imageGridRef} images={images} />
        <Footer />
      </div>
    </div>
  );
};

export default HomePage;