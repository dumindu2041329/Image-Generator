import { GeneratedImage, ImageGenerationRequest } from '../types';

export class ImageGenerationService {
  private static readonly REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
  // Updated to the correct SDXL model version
  private static readonly SDXL_MODEL = 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc';
  
  // For image-to-image, we'll use the same model with image input
  private static readonly SDXL_IMG2IMG_MODEL = 'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc';
  // Get API key from environment or localStorage
  private static getApiKey(): string | null {
    return process.env.REACT_APP_REPLICATE_API_TOKEN || 
           localStorage.getItem('replicate_api_key') ||
           null;
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
    const apiKey = this.getApiKey();
    console.log('API Key available:', !!apiKey);
    
    if (!apiKey) {
      throw new Error('Replicate API key is required. Please check your REACT_APP_REPLICATE_API_TOKEN environment variable.');
    }

    try {
      const dimensions = this.getImageDimensions(request.aspectRatio);
      
      // Prepare SDXL parameters with correct structure
      const sdxlInput: any = {
        prompt: request.prompt,
        width: dimensions.width,
        height: dimensions.height,
        guidance_scale: request.guidanceScale || 7.5,
        num_inference_steps: request.inferenceSteps || 50,
        seed: request.seed
      };

      // Add negative prompt if provided
      if (request.negativePrompt) {
        sdxlInput.negative_prompt = request.negativePrompt;
      }

      // Add scheduler if not default
      if (request.scheduler && request.scheduler !== 'DPMSolverMultistep') {
        sdxlInput.scheduler = request.scheduler;
      }

      // Handle image-to-image
      if (request.sourceImage) {
        if (typeof request.sourceImage === 'string') {
          sdxlInput.image = request.sourceImage;
        } else {
          sdxlInput.image = await this.fileToBase64(request.sourceImage);
        }
        if (request.strength) {
          sdxlInput.strength = request.strength;
        }
      }

      console.log('SDXL Input:', {
        ...sdxlInput,
        image: sdxlInput.image ? '[IMAGE DATA]' : undefined
      });

      // Create prediction using Replicate API
      const requestBody = {
        version: this.SDXL_MODEL,
        input: sdxlInput
      };

      console.log('Making request to Replicate API...');
      
      const response = await fetch(this.REPLICATE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'SDXL-Image-Generator/1.0'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`SDXL API error (${response.status}): ${errorText}`);
        }
        
        throw new Error(`SDXL API error: ${errorData.detail || errorData.message || response.statusText}`);
      }

      const prediction = await response.json();
      console.log('Prediction created:', prediction);

      if (!prediction.id) {
        throw new Error('Failed to create prediction: No prediction ID received');
      }

      // Wait for the prediction to complete
      const result = await this.waitForPrediction(prediction.id, apiKey);
      
      if (!result.output) {
        throw new Error('SDXL generation failed: No output received');
      }

      // Handle both single image and array of images
      let imageUrl: string;
      if (Array.isArray(result.output)) {
        imageUrl = result.output[0];
      } else if (typeof result.output === 'string') {
        imageUrl = result.output;
      } else {
        throw new Error('Unexpected output format from SDXL');
      }

      const generatedImage: GeneratedImage = {
        id: `sdxl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: imageUrl,
        prompt: request.prompt,
        timestamp: new Date(),
        aspectRatio: request.aspectRatio || '1:1',
      };

      console.log('SDXL generation successful:', generatedImage);
      return generatedImage;

    } catch (error) {
      console.error('SDXL generation failed:', error);
      
      // Provide more helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Invalid API key. Please check your Replicate API token.');
        } else if (error.message.includes('402')) {
          throw new Error('Insufficient credits. Please add funds to your Replicate account.');
        } else if (error.message.includes('429')) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
      }
      
      throw error;
    }
  }

  private static async waitForPrediction(predictionId: string, apiKey: string): Promise<any> {
    const maxAttempts = 120; // 10 minutes max (5 second intervals)
    let attempts = 0;
    
    console.log(`Waiting for prediction ${predictionId}...`);
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${this.REPLICATE_API_URL}/${predictionId}`, {
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Status check failed (${response.status}):`, errorText);
          throw new Error(`Failed to check prediction status: ${response.status} ${errorText}`);
        }

        const prediction = await response.json();
        console.log(`Prediction ${predictionId} status:`, prediction.status, prediction.progress ? `(${Math.round(prediction.progress * 100)}%)` : '');
        
        if (prediction.status === 'succeeded') {
          console.log('Prediction completed successfully:', prediction.output);
          return prediction;
        } else if (prediction.status === 'failed') {
          console.error('Prediction failed:', prediction.error);
          throw new Error(`SDXL generation failed: ${prediction.error || 'Unknown error'}`);
        } else if (prediction.status === 'canceled') {
          throw new Error('SDXL generation was canceled');
        } else if (prediction.status === 'starting' || prediction.status === 'processing') {
          // Still processing, continue waiting
        } else {
          console.log('Unknown prediction status:', prediction.status);
        }
        
        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        attempts++;
        
      } catch (error) {
        console.error(`Error checking prediction status (attempt ${attempts + 1}):`, error);
        
        if (attempts >= maxAttempts - 1) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }
    
    throw new Error('SDXL generation timed out after 10 minutes');
  }

  // Test API key validity
  static async testApiKey(): Promise<boolean> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return false;
    }

    try {
      const response = await fetch('https://api.replicate.com/v1/models', {
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('API key test failed:', error);
      return false;
    }
  }
}
