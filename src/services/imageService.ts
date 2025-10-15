import { GeneratedImage, ImageGenerationRequest } from '../types';

export class ImageGenerationService {
  // Use our server-side API endpoint instead of calling Replicate directly
  private static readonly SERVER_API_URL = '/api/generate-image';
  
  // Check if we're in development or production
  private static getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      // Client-side
      return window.location.origin;
    }
    return '';
  }

  private static getImageDimensions(aspectRatio: '1:1' | '16:9' | '4:3' = '1:1'): { width: number; height: number } {
    switch (aspectRatio) {
      case '16:9':
        return { width: 1344, height: 768 };
      case '4:3':
        return { width: 1152, height: 896 };
      case '1:1':
      default:
        return { width: 1024, height: 1024 };
    }
  }

  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  static async generateImage(request: ImageGenerationRequest): Promise<GeneratedImage> {
    try {
      console.log('🎨 Generating image via server API:', request.prompt);

      // Prepare request body for server API
      const requestBody: any = {
        prompt: request.prompt,
        aspectRatio: request.aspectRatio || '1:1',
        guidanceScale: request.guidanceScale || 7.5,
        inferenceSteps: request.inferenceSteps || 50,
        scheduler: request.scheduler || 'DPMSolverMultistep',
        seed: request.seed
      };

      // Add optional parameters
      if (request.negativePrompt) {
        requestBody.negativePrompt = request.negativePrompt;
      }

      // Handle image-to-image
      if (request.sourceImage) {
        if (typeof request.sourceImage === 'string') {
          requestBody.sourceImage = request.sourceImage;
        } else {
          requestBody.sourceImage = await this.fileToBase64(request.sourceImage);
        }
        if (request.strength) {
          requestBody.strength = request.strength;
        }
      }

      console.log('Making request to server API...');
      
      // Call our server-side API endpoint
      const response = await fetch(this.SERVER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Server response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Server API error:', errorData);
        
        // Extract error message
        const errorMessage = errorData.error || `Server error (${response.status})`;
        throw new Error(errorMessage);
      }

      const generatedImage = await response.json();
      
      // Convert timestamp back to Date object
      generatedImage.timestamp = new Date(generatedImage.timestamp);
      
      console.log('✅ SDXL generation successful:', generatedImage.id);
      return generatedImage;

    } catch (error) {
      console.error('❌ SDXL generation failed:', error);
      
      // Re-throw with user-friendly message
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to generate image. Please try again.');
    }
  }

  // Test server API connection
  static async testApiKey(): Promise<boolean> {
    try {
      console.log('Testing server API connection...');
      
      const response = await fetch(this.SERVER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'test',
          aspectRatio: '1:1',
          guidanceScale: 7.5,
          inferenceSteps: 20
        })
      });

      // Even if generation fails, a 500 error means the API is configured
      // A 401/403 would mean API key issues
      return response.status !== 401 && response.status !== 403;
      
    } catch (error) {
      console.error('Server API test failed:', error);
      return false;
    }
  }
}
