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

  const handleGenerate = async (request: {
    prompt: string;
    negativePrompt?: string;
    aspectRatio?: '1:1' | '16:9' | '4:3';
    sourceImage?: File | string;
    strength?: number;
    guidanceScale?: number;
    inferenceSteps?: number;
    scheduler?: string;
    seed?: number;
  }) => {
    setIsGenerating(true);
    
    // Create a loading placeholder
    const loadingImage: GeneratedImage = {
      id: `loading_${Date.now()}`,
      url: '',
      prompt: request.prompt,
      timestamp: new Date(),
      isLoading: true,
      aspectRatio: request.aspectRatio || '1:1',
    };
    
    // Add loading placeholder to the beginning of the array
    setImages(prev => [loadingImage, ...prev]);
    
    try {
      const generatedImage = await ImageGenerationService.generateImage(request);
      
      // Replace loading placeholder with actual image
      setImages(prev => 
        prev.map(img => 
          img.id === loadingImage.id ? generatedImage : img
        )
      );

      // Show success notification
      showSuccess(
        'Image Generated Successfully!',
        `Created a ${request.aspectRatio || '1:1'} image using Pollinations AI.`
      );

      // Scroll to generated images section with enhanced transition
      setTimeout(() => {
        if (imageGridRef.current) {
          // Add a subtle fade-in effect to the scroll target
          imageGridRef.current.style.opacity = '0.7';
          imageGridRef.current.style.transition = 'opacity 0.3s ease-in-out';
          
          imageGridRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
          
          // Restore opacity after scroll
          setTimeout(() => {
            if (imageGridRef.current) {
              imageGridRef.current.style.opacity = '1';
            }
          }, 800);
        }
      }, 300);

      // Save to Supabase if user is authenticated
      if (isConfigured && user) {
        try {
          await saveImage(
            request.prompt,
            generatedImage.url,
            request.aspectRatio || '1:1',
            'pollinations' // Indicate Pollinations AI was used
          );
          showSuccess(
            'Image Saved!',
            'Your generated image has been saved to your history.'
          );
        } catch (saveError) {
          // Provide more specific error messages
          const errorMessage = saveError instanceof Error ? saveError.message : 'Unknown error occurred';
          if (errorMessage.includes('empty (0 bytes)')) {
            showWarning(
              'Image Generation Issue',
              'The image generation service returned an empty image. This may be a temporary issue. Please try again with a different prompt or try again later.'
            );
          } else {
            showWarning(
              'Image Generated but Not Saved',
              `The image was created successfully but could not be saved to your history. ${errorMessage}`
            );
          }
        }
      }
    } catch (error) {
      // Handle error with user notification
      
      // Show error notification
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
      
      // Remove loading placeholder on error
      setImages(prev => prev.filter(img => img.id !== loadingImage.id));
    } finally {
      setIsGenerating(false);
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