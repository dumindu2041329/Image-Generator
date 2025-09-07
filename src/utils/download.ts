/**
 * Downloads an image from a URL by fetching it as a blob and creating a download link
 * This handles CORS issues that might prevent direct downloads
 */
export const downloadImage = async (
  imageUrl: string, 
  filename: string,
  onSuccess?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    // Fetch the image as a blob to handle CORS issues
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    window.URL.revokeObjectURL(url);
    
    onSuccess?.();
  } catch (error) {
    console.error('Download error:', error);
    
    // Fallback: try direct download if blob method fails
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onSuccess?.();
    } catch (fallbackError) {
      console.error('Fallback download error:', fallbackError);
      onError?.(error as Error);
    }
  }
};

/**
 * Generates a filename for AI-generated images
 */
export const generateImageFilename = (
  aspectRatio: string = '1:1',
  imageId: string,
  extension: string = 'jpg'
): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  return `ai-generated-${aspectRatio}-${imageId}-${timestamp}.${extension}`;
};
