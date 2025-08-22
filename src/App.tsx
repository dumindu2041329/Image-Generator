import React, { useState, useEffect, useRef } from 'react';
import { GeneratedImage } from './types';
import { ImageGenerationService } from './services/imageService';
import { useImageHistory } from './hooks/useImageHistory';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import PromptInput from './components/PromptInput';
import ImageGrid from './components/ImageGrid';
import Footer from './components/Footer';

function App() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { saveImage } = useImageHistory();
  const { user, isConfigured } = useAuth();
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
    setError(null);
    
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

      // Save to Supabase if user is authenticated
      if (isConfigured && user) {
        try {
          await saveImage(
            prompt,
            generatedImage.url,
            aspectRatio || '1:1',
            style || 'vivid'
          );
        } catch (saveError) {
          console.warn('Failed to save image to history:', saveError);
          // Don't show error to user, just log it
        }
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
      
      // Set error message
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to generate image. Please try again.');
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
        
        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto px-4 mb-6">
            <div className="glass rounded-2xl p-4 border-l-4 border-red-500">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <div>
                  <p className="text-red-200 font-medium">Generation Failed</p>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-300 hover:text-red-200 transition-colors"
                >
                  ×
                </button>
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
}

export default App;
