import { GeneratedImage, ImageGenerationRequest } from '../types';

/**
 * Image Generation Service - Pollinations AI
 * 
 * This service uses Pollinations AI for completely free image generation.
 * No API keys required, no rate limits, no costs!
 * 
 * Pollinations AI: https://pollinations.ai/
 */

export class ImageGenerationService {
  // Pre-compute common values for speed
  private static readonly DIMENSIONS = {
    '16:9': { width: 1024, height: 576 },  // Increased resolution for better quality
    '4:3': { width: 768, height: 576 },    // Increased resolution
    '1:1': { width: 768, height: 768 }     // Increased resolution
  };
  
  private static readonly BASE_URL = 'https://image.pollinations.ai/prompt/';
  
  /**
   * Generate an image using Pollinations AI - Optimized for Speed
   */
  static generateImage(request: ImageGenerationRequest): GeneratedImage {
    // Remove async/await since URL generation is synchronous
    
    // Quick validation
    if (!request.prompt?.trim()) {
      throw new Error('Prompt is required');
    }

    const prompt = request.prompt.trim();
    const aspectRatio = request.aspectRatio || '1:1';
    
    // Use pre-computed dimensions for speed
    const dimensions = this.DIMENSIONS[aspectRatio as keyof typeof this.DIMENSIONS] || this.DIMENSIONS['1:1'];
    
    // Optimize prompt enhancement
    const enhancedPrompt = `${prompt}, masterpiece, best quality, highly detailed`;
    
    // Fast random seed generation
    const seed = (Date.now() % 1000000) + Math.floor(Math.random() * 1000);
    
    // Pre-encode common parameters for speed
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    
    // Build optimized URL with performance parameters
    const imageUrl = `${this.BASE_URL}${encodedPrompt}?width=${dimensions.width}&height=${dimensions.height}&seed=${seed}&enhance=true&nologo=true&model=flux&steps=20`;
    
    // Generate unique ID using high-performance method
    const id = `pollinations_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    
    const generatedImage: GeneratedImage = {
      id,
      url: imageUrl,
      prompt,
      aspectRatio,
      timestamp: new Date()
    };
    
    // Only log in development for performance
    if (import.meta.env.DEV) {
      console.log('🎨 Fast Pollinations generation:', {
        id,
        prompt: prompt.length > 50 ? `${prompt.slice(0, 50)}...` : prompt,
        dimensions,
        seed
      });
    }
    
    return generatedImage;
  }
  
  /**
   * Pre-generate multiple images for instant switching
   */
  static generateVariations(request: ImageGenerationRequest, count: number = 3): GeneratedImage[] {
    if (!request.prompt?.trim()) {
      throw new Error('Prompt is required');
    }
    
    const variations: GeneratedImage[] = [];
    const baseTime = Date.now();
    
    for (let i = 0; i < count; i++) {
      const variationRequest = {
        ...request,
        prompt: i === 0 ? request.prompt : `${request.prompt}, variation ${i + 1}`
      };
      
      // Generate with slight time offset to ensure unique seeds
      setTimeout(() => {
        const variation = this.generateImage(variationRequest);
        variations.push(variation);
      }, i * 10);
    }
    
    return variations;
  }

  /**
   * Get optimized dimensions for faster generation
   */
  static getDimensions(aspectRatio?: string): { width: number; height: number } {
    return this.DIMENSIONS[aspectRatio as keyof typeof this.DIMENSIONS] || this.DIMENSIONS['1:1'];
  }

  /**
   * Test API connection (always returns true since no API key needed)
   */
  static testApiKey(): boolean {
    return true; // Pollinations AI requires no API key - made synchronous for speed
  }
  
  /**
   * Pre-warm image URLs for instant loading
   */
  static preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  }
  
  /**
   * Generate and preload image for instant display
   */
  static async generateAndPreload(request: ImageGenerationRequest): Promise<GeneratedImage> {
    const generatedImage = this.generateImage(request);
    
    // Start preloading immediately but don't wait for it
    this.preloadImage(generatedImage.url).catch(() => {
      // Ignore preload errors - image will load normally when displayed
    });
    
    return generatedImage;
  }
}
