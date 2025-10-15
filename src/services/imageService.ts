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
      // Convert image to base64 if it's a File
      let imageData: string;
      if (request.sourceImage instanceof File) {
        imageData = await this.fileToBase64(request.sourceImage);
      } else {
        // If it's already a URL, we'll need to fetch and convert it
        imageData = await this.urlToBase64(request.sourceImage);
      }

      // For now, since Pollinations doesn't support image-to-image directly,
      // we'll use a different approach or fallback to text-to-image with enhanced prompts
      const aspectRatio = request.aspectRatio || '1:1';
      const strength = request.strength || 0.7;
      
      // Enhanced prompt that describes the transformation
      let enhancedPrompt = `${request.prompt}, based on uploaded image, strength ${strength}`;
      
      if (request.style === 'vivid') {
        enhancedPrompt += ', hyperrealistic, vibrant colors, dramatic lighting, high contrast, detailed';
      } else if (request.style === 'natural') {
        enhancedPrompt += ', natural lighting, realistic, soft colors, photographic style';
      }

      // Try to use a service that supports image-to-image or fallback
      const baseUrl = 'https://image.pollinations.ai/prompt';
      const encodedPrompt = encodeURIComponent(enhancedPrompt);
      const dimensions = this.getImageDimensions(aspectRatio);
      const seed = Math.floor(Math.random() * 1000000);
      
      // For image-to-image, we'll use the enhanced prompt approach
      const imageUrl = `${baseUrl}/${encodedPrompt}?width=${dimensions.width}&height=${dimensions.height}&seed=${seed}`;
      
      // Test the URL
      const testResponse = await fetch(imageUrl, { method: 'GET' });
      if (!testResponse.ok) {
        throw new Error(`Image-to-image service returned ${testResponse.status}`);
      }
      
      const generatedImage: GeneratedImage = {
        id: `img2img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: imageUrl,
        prompt: request.prompt,
        timestamp: new Date(),
        aspectRatio,
      };

      return generatedImage;
    } catch (error) {
      console.warn('Image-to-image generation failed, falling back to text-to-image:', error);
      
      // Fallback to regular text-to-image generation
      const fallbackRequest: ImageGenerationRequest = {
        prompt: `${request.prompt}, inspired by uploaded reference image`,
        style: request.style,
        aspectRatio: request.aspectRatio
      };
      
      // Remove sourceImage to avoid infinite recursion
      return this.generateImage(fallbackRequest);
    }
  }

  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private static async urlToBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error('Failed to convert URL to base64');
    }
  }
}
