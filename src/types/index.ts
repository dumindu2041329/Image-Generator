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
  style?: 'vivid' | 'natural';
  aspectRatio?: '1:1' | '16:9' | '4:3';
}
