export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
  isLoading?: boolean;
  aspectRatio?: '1:1' | '16:9' | '4:3';
}

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '16:9' | '4:3';
  sourceImage?: File | string; // For image-to-image generation
  strength?: number; // How much to modify the source image (0-1)
  // SDXL specific parameters
  guidanceScale?: number; // How closely to follow the prompt (1-20)
  inferenceSteps?: number; // Number of inference steps (20-100)
  scheduler?: 'DPMSolverMultistep' | 'DDIM' | 'K_EULER' | 'K_EULER_ANCESTRAL' | 'PNDM' | 'KLMS';
  seed?: number; // Random seed for reproducible results
}

export interface UploadedImage {
  file: File;
  url: string;
  name: string;
}
