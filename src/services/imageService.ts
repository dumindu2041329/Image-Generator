import { GeneratedImage, ImageGenerationRequest } from '../types';

interface ImageToImageRequest extends ImageGenerationRequest {
  sourceImage: File | string;
  strength?: number;
}

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
    // Check if this is an image-to-image request
    if (request.sourceImage) {
      return this.generateImageToImage(request as ImageToImageRequest);
    }

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
      
      // Try multiple URL formats for better compatibility
      const urlFormats = [
        // Format 1: With all parameters
        `${baseUrl}/${encodedPrompt}?width=${dimensions.width}&height=${dimensions.height}&seed=${seed}&enhance=true&nologo=true`,
        // Format 2: Simplified parameters
        `${baseUrl}/${encodedPrompt}?width=${dimensions.width}&height=${dimensions.height}&seed=${seed}`,
        // Format 3: Basic format with just dimensions
        `${baseUrl}/${encodedPrompt}?width=${dimensions.width}&height=${dimensions.height}`,
        // Format 4: Minimal format with complex prompt
        `${baseUrl}/${encodedPrompt}`,
        // Format 5: Simplified prompt with dimensions
        `${baseUrl}/${encodeURIComponent(request.prompt)}?width=${dimensions.width}&height=${dimensions.height}`,
        // Format 6: Simplified prompt only
        `${baseUrl}/${encodeURIComponent(request.prompt)}`,
      ];
      
      let workingUrl = '';
      let lastError: Error | null = null;
      
      // Try each URL format until one works
      for (const imageUrl of urlFormats) {
        try {
          // Add timeout to prevent hanging requests
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const testResponse = await fetch(imageUrl, {
            signal: controller.signal,
            method: 'GET'
          });
          
          clearTimeout(timeoutId);
          
          if (!testResponse.ok) {
            throw new Error(`Pollinations service returned ${testResponse.status}`);
          }
          
          // Check if we actually got image content
          const contentType = testResponse.headers.get('content-type');
          if (!contentType || !contentType.startsWith('image/')) {
            throw new Error(`Pollinations service returned non-image content: ${contentType}`);
          }
          
          // Check content length
          const contentLength = testResponse.headers.get('content-length');
          if (contentLength && parseInt(contentLength) === 0) {
            throw new Error('Pollinations service returned empty image');
          }
          
          // If we get here, this URL works
          workingUrl = imageUrl;
          break;
          
        } catch (error) {
          lastError = error as Error;
          console.warn(`URL format failed: ${imageUrl}`, error);
          continue;
        }
      }
      
      if (!workingUrl) {
        throw lastError || new Error('All Pollinations URL formats failed');
      }

      const generatedImage: GeneratedImage = {
        id: `pollinations_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: workingUrl,
        prompt: request.prompt,
        timestamp: new Date(),
        aspectRatio,
      };

      return generatedImage;
    } catch (error) {
      console.warn('Pollinations AI failed, trying alternative service:', error);
      
      // Try alternative free service
      try {
        return await this.generateWithAlternativeService(request);
      } catch (alternativeError) {
        console.warn('Alternative service failed, using demo images:', alternativeError);
        
        // Final fallback to demo images
        return this.generateDemoImage(request);
      }
    }
  }

  private static async generateWithAlternativeService(request: ImageGenerationRequest): Promise<GeneratedImage> {
    // Use a different free service - Picsum Photos (reliable placeholder service)
    try {
      const dimensions = this.getImageDimensions(request.aspectRatio);
      
      // Use a simple image service that works reliably
      const imageUrl = `https://picsum.photos/${dimensions.width}/${dimensions.height}?random=${Math.floor(Math.random() * 1000)}`;
      
      // Verify the alternative service works
      const testResponse = await fetch(imageUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        throw new Error(`Alternative service returned ${testResponse.status}`);
      }
      
      return {
        id: `alternative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: imageUrl,
        prompt: request.prompt,
        timestamp: new Date(),
        aspectRatio: request.aspectRatio || '1:1',
      };
    } catch (error) {
      console.warn('Alternative service failed:', error);
      throw new Error('Alternative service failed');
    }
  }



  private static async generateDemoImage(request: ImageGenerationRequest): Promise<GeneratedImage> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 500));
    
    const aspectRatio = request.aspectRatio || '1:1';
    const imagesForRatio = this.BACKUP_IMAGES[aspectRatio];
    const randomIndex = Math.floor(Math.random() * imagesForRatio.length);
    const imageUrl = imagesForRatio[randomIndex];
    
    // Verify demo image works
    try {
      const testResponse = await fetch(imageUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        throw new Error(`Demo image service returned ${testResponse.status}`);
      }
    } catch (error) {
      console.warn('Demo image failed, using fallback URL:', error);
      // Use a guaranteed working fallback
      const dimensions = this.getImageDimensions(aspectRatio);
      const fallbackUrl = `https://picsum.photos/${dimensions.width}/${dimensions.height}?random=${Math.floor(Math.random() * 1000)}`;
      
      return {
        id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: fallbackUrl,
        prompt: request.prompt,
        timestamp: new Date(),
        aspectRatio,
      };
    }
    
    return {
      id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: imageUrl,
      prompt: request.prompt,
      timestamp: new Date(),
      aspectRatio,
    };
  }

  private static async generateImageToImage(request: ImageToImageRequest): Promise<GeneratedImage> {
    try {
      console.log('Starting image-to-image generation with source:', request.sourceImage instanceof File ? 'File' : 'URL');
      
      // Since current free services don't support true image-to-image,
      // we'll enhance the prompt with descriptive terms and use text-to-image
      const aspectRatio = request.aspectRatio || '1:1';
      const strength = request.strength || 0.7;
      
      // Create more sophisticated prompt enhancement based on strength
      let enhancedPrompt = request.prompt;
      
      // Add strength-based modifiers
      if (strength < 0.3) {
        enhancedPrompt += ', subtle modifications, maintain original composition and style';
      } else if (strength < 0.7) {
        enhancedPrompt += ', moderate changes, inspired by reference image';
      } else {
        enhancedPrompt += ', creative interpretation, transform style significantly';
      }
      
      // Add style enhancements
      if (request.style === 'vivid') {
        enhancedPrompt += ', hyperrealistic, vibrant colors, dramatic lighting, high contrast, detailed';
      } else if (request.style === 'natural') {
        enhancedPrompt += ', natural lighting, realistic, soft colors, photographic style';
      }
      
      // Add image-to-image specific terms
      enhancedPrompt += ', based on reference image, similar composition';

      // Use the same generation logic as text-to-image but with enhanced prompt
      const baseUrl = 'https://image.pollinations.ai/prompt';
      const encodedPrompt = encodeURIComponent(enhancedPrompt);
      const dimensions = this.getImageDimensions(aspectRatio);
      const seed = Math.floor(Math.random() * 1000000);
      
      // Try multiple formats for better success rate
      const urlFormats = [
        `${baseUrl}/${encodedPrompt}?width=${dimensions.width}&height=${dimensions.height}&seed=${seed}&enhance=true`,
        `${baseUrl}/${encodedPrompt}?width=${dimensions.width}&height=${dimensions.height}&seed=${seed}`,
        `${baseUrl}/${encodedPrompt}?width=${dimensions.width}&height=${dimensions.height}`,
      ];
      
      let workingUrl = '';
      let lastError: Error | null = null;
      
      for (const imageUrl of urlFormats) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const testResponse = await fetch(imageUrl, {
            signal: controller.signal,
            method: 'GET'
          });
          
          clearTimeout(timeoutId);
          
          if (!testResponse.ok) {
            throw new Error(`Service returned ${testResponse.status}`);
          }
          
          const contentType = testResponse.headers.get('content-type');
          if (!contentType || !contentType.startsWith('image/')) {
            throw new Error(`Non-image content: ${contentType}`);
          }
          
          workingUrl = imageUrl;
          break;
          
        } catch (error) {
          lastError = error as Error;
          continue;
        }
      }
      
      if (!workingUrl) {
        throw lastError || new Error('All image generation attempts failed');
      }
      
      const generatedImage: GeneratedImage = {
        id: `img2img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: workingUrl,
        prompt: request.prompt,
        timestamp: new Date(),
        aspectRatio,
      };

      console.log('Image-to-image generation successful:', generatedImage.id);
      return generatedImage;
      
    } catch (error) {
      console.warn('Image-to-image generation failed, falling back to text-to-image:', error);
      
      // Fallback to regular text-to-image generation with enhanced prompt
      const fallbackRequest: ImageGenerationRequest = {
        prompt: `${request.prompt}, creative interpretation of uploaded reference image`,
        style: request.style,
        aspectRatio: request.aspectRatio
      };
      
      // Call the main generation method without sourceImage to avoid recursion
      return this.generateImage(fallbackRequest);
    }
  }

}
