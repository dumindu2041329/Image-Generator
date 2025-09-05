import React, { useState, useEffect, useRef } from 'react';
import { GeneratedImage } from '../types';
import { ImageGenerationService } from '../services/imageService';
import { useImageHistory } from '../hooks/useImageHistory';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import Header from '../components/Header';
import PromptInput from '../components/PromptInput';
import ImageGrid from '../components/ImageGrid';
import Footer from '../components/Footer';

const HomePage: React.FC = () => {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { saveImage } = useImageHistory();
  const { user, isConfigured } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const prevUserRef = useRef(user);

  // This effect clears the locally generated images when the user logs out.
  useEffect(() => {
    // Check if the user state has transitioned from logged-in to logged-out
    if (prevUserRef.current && !user) {
      setImages([]);
    }
    // Update the ref to the current user for the next render cycle
    prevUserRef.current = user;
  }, [user]);

  const handleGenerate = async (prompt: string, style?: 'vivid' | 'natural', aspectRatio?: '1:1' | '16:9' | '4:3') => {
    setIsGenerating(true);
    
    // Create a loading placeholder
    const loadingImage: GeneratedImage = {
      id: `loading_${Date.now()}`,
      url: '',
      prompt,
      timestamp: new Date(),
      isLoading: true,
      aspectRatio: aspectRatio || '1:1',
    };
    
    // Add loading placeholder to the beginning of the array
    setImages(prev => [loadingImage, ...prev]);
    
    try {
      const generatedImage = await ImageGenerationService.generateImage({ 
        prompt, 
        style,
        aspectRatio
      });
      
      // Replace loading placeholder with actual image
      setImages(prev => 
        prev.map(img => 
          img.id === loadingImage.id ? generatedImage : img
        )
      );

      // Show success notification
      showSuccess(
        'Image Generated Successfully!',
        `Created a ${aspectRatio || '1:1'} image with ${style || 'vivid'} style.`
      );

      // Save to Supabase if user is authenticated
      if (isConfigured && user) {
        try {
          await saveImage(
            prompt,
            generatedImage.url,
            aspectRatio || '1:1',
            style || 'vivid'
          );
          showSuccess(
            'Image Saved!',
            'Your generated image has been saved to your history.'
          );
        } catch (saveError) {
          console.warn('Failed to save image to history:', saveError);
          showWarning(
            'Image Generated but Not Saved',
            'The image was created successfully but could not be saved to your history.'
          );
        }
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
      
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
          <div className="max-w-4xl mx-auto px-4 mb-6">
            <div className="glass rounded-2xl p-4 border-l-4 border-green-500">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <div>
                  <p className="text-green-200 font-medium">Authentication Active</p>
                  <p className="text-green-300 text-sm">Your generated images are automatically saved to your history!</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <PromptInput onGenerate={handleGenerate} isGenerating={isGenerating} />
        <ImageGrid images={images} />
        <Footer />
      </div>
    </div>
  );
};

export default HomePage;