import { GeneratedImage, ImageGenerationRequest } from '../types';

export class ImageGenerationService {
  private static readonly REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
  private static readonly SDXL_MODEL = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';
  
  // For image-to-image, we'll use a different model
  private static readonly SDXL_IMG2IMG_MODEL = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';
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
    if (!apiKey) {
      throw new Error('Replicate API key is required. Please set REACT_APP_REPLICATE_API_TOKEN or add your key in settings.');
    }

    try {
      const dimensions = this.getImageDimensions(request.aspectRatio);
      
      // Prepare SDXL parameters
      const sdxlInput = {
        prompt: request.prompt,
        negative_prompt: request.negativePrompt || 'blurry, bad quality, distorted, amateur, low resolution',
        width: dimensions.width,
        height: dimensions.height,
        guidance_scale: request.guidanceScale || 7.5,
        num_inference_steps: request.inferenceSteps || 50,
        scheduler: request.scheduler || 'DPMSolverMultistep',
        seed: request.seed || Math.floor(Math.random() * 1000000),
        ...(request.sourceImage && {
          image: typeof request.sourceImage === 'string' ? request.sourceImage : await this.fileToBase64(request.sourceImage),
          strength: request.strength || 0.8
        })
      };

      console.log('Generating image with SDXL:', sdxlInput);

      // Create prediction using Replicate API
      const response = await fetch(this.REPLICATE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: this.SDXL_MODEL,
          input: sdxlInput
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`SDXL API error: ${errorData.detail || response.statusText}`);
      }

      const prediction = await response.json();
      console.log('Prediction created:', prediction.id);

      // Wait for the prediction to complete
      const result = await this.waitForPrediction(prediction.id, apiKey);
      
      if (!result.output || result.output.length === 0) {
        throw new Error('SDXL generation failed: No output received');
      }

      const generatedImage: GeneratedImage = {
        id: `sdxl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: Array.isArray(result.output) ? result.output[0] : result.output,
        prompt: request.prompt,
        timestamp: new Date(),
        aspectRatio: request.aspectRatio || '1:1',
      };

      console.log('SDXL generation successful:', generatedImage.id);
      return generatedImage;

    } catch (error) {
      console.error('SDXL generation failed:', error);
      throw error;
    }
  }

  private static async waitForPrediction(predictionId: string, apiKey: string): Promise<any> {
    const maxAttempts = 60; // 5 minutes max (5 second intervals)
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${this.REPLICATE_API_URL}/${predictionId}`, {
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to check prediction status: ${response.statusText}`);
        }

        const prediction = await response.json();
        console.log(`Prediction ${predictionId} status:`, prediction.status);
        
        if (prediction.status === 'succeeded') {
          return prediction;
        } else if (prediction.status === 'failed') {
          throw new Error(`SDXL generation failed: ${prediction.error || 'Unknown error'}`);
        } else if (prediction.status === 'canceled') {
          throw new Error('SDXL generation was canceled');
        }
        
        // Still processing, wait and try again
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        attempts++;
        
      } catch (error) {
        if (attempts >= maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }
    
    throw new Error('SDXL generation timed out after 5 minutes');
  }


}
