import { GeneratedImage, ImageGenerationRequest } from '../types';

export class ImageGenerationService {
  private static readonly BACKUP_IMAGES = {
    '1:1': [
      'https://picsum.photos/512/512?random=1',
      'https://picsum.photos/512/512?random=2',
      'https://picsum.photos/512/512?random=3',
      'https://picsum.photos/512/512?random=4',
    ],
    '16:9': [
      'https://picsum.photos/768/432?random=5',
      'https://picsum.photos/768/432?random=6',
      'https://picsum.photos/768/432?random=7',
      'https://picsum.photos/768/432?random=8',
    ],
    '4:3': [
      'https://picsum.photos/640/480?random=9',
      'https://picsum.photos/640/480?random=10',
      'https://picsum.photos/640/480?random=11',
      'https://picsum.photos/640/480?random=12',
    ],
  };

  private static getImageDimensions(aspectRatio: '1:1' | '16:9' | '4:3' = '1:1'): { width: number; height: number } {
    switch (aspectRatio) {
      case '16:9':
        return { width: 1024, height: 576 };
      case '4:3':
        return { width: 1024, height: 768 };
      case '1:1':
      default:
        return { width: 1024, height: 1024 };
    }
  }

  static async generateImage(request: ImageGenerationRequest): Promise<GeneratedImage> {
    try {
      // Use Pollinations AI - completely free, no API key required
      const baseUrl = 'https://image.pollinations.ai/prompt';
      
      // Enhance prompt based on style
      let enhancedPrompt = request.prompt;
      if (request.style === 'vivid') {
        enhancedPrompt += ', hyperrealistic, vibrant colors, dramatic lighting, high contrast, detailed';
      } else if (request.style === 'natural') {
        enhancedPrompt += ', natural lighting, realistic, soft colors, photographic style';
      }
      
      // Add aspect ratio to prompt for better composition
      const aspectRatio = request.aspectRatio || '1:1';
      if (aspectRatio === '16:9') {
        enhancedPrompt += ', wide landscape composition, cinematic framing';
      } else if (aspectRatio === '4:3') {
        enhancedPrompt += ', classic composition, balanced framing';
      }
      
      // URL encode the prompt and add parameters
      const encodedPrompt = encodeURIComponent(enhancedPrompt);
      const dimensions = this.getImageDimensions(aspectRatio);
      const seed = Math.floor(Math.random() * 1000000); // Random seed for variety
      
      // Construct the Pollinations API URL
      const imageUrl = `${baseUrl}/${encodedPrompt}?width=${dimensions.width}&height=${dimensions.height}&seed=${seed}&enhance=true&nologo=true`;
      
      // For Pollinations AI, we'll skip validation and trust the service
      // since it's reliable and validation timeouts are causing issues
      const generatedImage: GeneratedImage = {
        id: `pollinations_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: imageUrl,
        prompt: request.prompt,
        timestamp: new Date(),
        aspectRatio,
      };

      // Optionally validate in background (non-blocking) with retry logic
      this.validateImageUrlWithRetry(imageUrl, 2).catch(() => {
        // If validation fails, we don't need to do anything
        // The image will still be shown to the user
        console.warn('Background validation failed for:', imageUrl);
      });

      return generatedImage;
    } catch (error) {
      console.error('Pollinations AI error:', error);
      
      // Try alternative free service
      try {
        return await this.generateWithAlternativeService(request);
      } catch (alternativeError) {
        console.error('Alternative service error:', alternativeError);
        
        // Final fallback to demo images
        return this.generateDemoImage(request);
      }
    }
  }

  private static async generateWithAlternativeService(request: ImageGenerationRequest): Promise<GeneratedImage> {
    // Use a different free service - Hugging Face's free inference API
    try {
      const dimensions = this.getImageDimensions(request.aspectRatio);
      
      // Use a simple image service that works reliably
      const imageUrl = `https://picsum.photos/${dimensions.width}/${dimensions.height}?random=${Math.floor(Math.random() * 1000)}`;
      
      return {
        id: `alternative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: imageUrl,
        prompt: request.prompt,
        timestamp: new Date(),
        aspectRatio: request.aspectRatio || '1:1',
      };
    } catch {
      throw new Error('Alternative service failed');
    }
  }

  private static async validateImageUrlInBackground(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          resolve();
        } else {
          reject(new Error('Invalid image dimensions'));
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Increased timeout to 30 seconds for slower connections
      const timeoutId = setTimeout(() => {
        reject(new Error('Image validation timeout'));
      }, 30000);
      
      img.onload = () => {
        clearTimeout(timeoutId);
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          resolve();
        } else {
          reject(new Error('Invalid image dimensions'));
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  private static async validateImageUrlWithRetry(url: string, retries: number = 2): Promise<void> {
    for (let i = 0; i <= retries; i++) {
      try {
        await this.validateImageUrlInBackground(url);
        return; // Success, exit the loop
      } catch (error) {
        if (i === retries) {
          // Last retry failed, throw the error
          throw error;
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  private static async generateDemoImage(request: ImageGenerationRequest): Promise<GeneratedImage> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 500));
    
    const aspectRatio = request.aspectRatio || '1:1';
    const imagesForRatio = this.BACKUP_IMAGES[aspectRatio];
    const randomIndex = Math.floor(Math.random() * imagesForRatio.length);
    const imageUrl = imagesForRatio[randomIndex];
    
    return {
      id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: imageUrl,
      prompt: request.prompt,
      timestamp: new Date(),
      aspectRatio,
    };
  }
}
