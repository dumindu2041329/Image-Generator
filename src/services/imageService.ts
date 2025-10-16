import { GeneratedImage, ImageGenerationRequest } from '../types';

export class ImageGenerationService {
  private static readonly SERVER_API_URL = '/api/generate-image';
  
  // Development mode fallback - generate Pollinations URL directly
  private static generatePollinationsURL(prompt: string, aspectRatio: string = '1:1'): string {
    const getDimensions = (aspectRatio: string) => {
      switch (aspectRatio) {
        case '16:9':
          return { width: 768, height: 432 };
        case '4:3':
          return { width: 640, height: 480 };
        case '1:1':
        default:
          return { width: 512, height: 512 };
      }
    };

    const dimensions = getDimensions(aspectRatio);
    const enhancedPrompt = prompt + ', high quality, detailed';
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const seed = Math.floor(Math.random() * 1000000);
    
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dimensions.width}&height=${dimensions.height}&seed=${seed}&enhance=true&nologo=true`;
  }

  static async generateImage(request: ImageGenerationRequest): Promise<GeneratedImage> {
    try {
      // Validate request
      if (!request.prompt || request.prompt.trim().length === 0) {
        throw new Error('Prompt is required');
      }

      console.log('🎨 Generating image with Pollinations AI:', request.prompt);

      const requestBody = {
        prompt: request.prompt.trim(),
        aspectRatio: request.aspectRatio || '1:1'
      };

      console.log('Request body:', requestBody);
      console.log('Making request to:', this.SERVER_API_URL);
      
      let response;
      try {
        response = await fetch(this.SERVER_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
      } catch (fetchError) {
        console.warn('API server not available, using direct Pollinations integration');
        // Fallback to direct Pollinations URL generation for development
        const imageUrl = this.generatePollinationsURL(request.prompt.trim(), request.aspectRatio || '1:1');
        const generatedImage = {
          id: `pollinations_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: imageUrl,
          prompt: request.prompt.trim(),
          aspectRatio: request.aspectRatio || '1:1',
          timestamp: new Date()
        };
        console.log('✅ Direct Pollinations generation successful:', generatedImage.id);
        console.log('Generated image URL:', generatedImage.url);
        return generatedImage;
      }

      console.log('Server response status:', response.status);
      console.log('Server response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Special handling for 404 - likely development mode
        if (response.status === 404) {
          console.warn('API endpoint not found (404), using direct Pollinations integration for development');
          const imageUrl = this.generatePollinationsURL(request.prompt.trim(), request.aspectRatio || '1:1');
          const generatedImage = {
            id: `pollinations_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: imageUrl,
            prompt: request.prompt.trim(),
            aspectRatio: request.aspectRatio || '1:1',
            timestamp: new Date()
          };
          console.log('✅ Direct Pollinations generation successful:', generatedImage.id);
          console.log('Generated image URL:', generatedImage.url);
          return generatedImage;
        }
        
        let errorData;
        try {
          // Clone the response so we can read it twice if needed
          const responseClone = response.clone();
          errorData = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON:', jsonError);
          try {
            const responseClone = response.clone();
            const textError = await responseClone.text();
            console.error('Raw error response:', textError);
            errorData = { error: `Server error (${response.status}): ${textError}` };
          } catch (textError) {
            console.error('Failed to read error response as text:', textError);
            errorData = { error: `Server error (${response.status})` };
          }
        }
        
        console.error('❌ Server API error:', errorData);
        const errorMessage = errorData.error || `Server error (${response.status})`;
        throw new Error(errorMessage);
      }

      let generatedImage;
      try {
        generatedImage = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse successful response as JSON:', jsonError);
        throw new Error('Server returned invalid response format');
      }
      
      // Validate response structure
      if (!generatedImage || !generatedImage.url || !generatedImage.id) {
        console.error('Invalid response structure:', generatedImage);
        throw new Error('Server returned incomplete image data');
      }
      
      // Convert timestamp back to Date object
      generatedImage.timestamp = new Date(generatedImage.timestamp);
      
      console.log('✅ Pollinations generation successful:', generatedImage.id);
      console.log('Generated image URL:', generatedImage.url);
      return generatedImage;

    } catch (error) {
      console.error('❌ Pollinations generation failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to generate image. Please try again.');
    }
  }

  // Test Pollinations API connection (always returns true since no API key needed)
  static async testApiKey(): Promise<boolean> {
    return true; // Pollinations AI requires no API key
  }
}
