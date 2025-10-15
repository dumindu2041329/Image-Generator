import React, { forwardRef } from 'react';
import { GeneratedImage } from '../types';
import ImageCard from './ImageCard';
import { Image as ImageIcon } from 'lucide-react';

interface ImageGridProps {
  images: GeneratedImage[];
  onEditImage?: (imageUrl: string, prompt: string) => void;
}

const ImageGrid = forwardRef<HTMLDivElement, ImageGridProps>(({ images, onEditImage }, ref) => {
  if (images.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 text-center py-16">
        <div className="glass rounded-2xl p-12">
          <ImageIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl text-gray-400 mb-2">No images yet</h3>
          <p className="text-gray-500">Generate your first AI image by entering a prompt above!</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Your Generated Images</h2>
        <p className="text-gray-400">
          {images.filter(img => !img.isLoading).length} image{images.filter(img => !img.isLoading).length !== 1 ? 's' : ''} generated
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images.map((image) => (
          <ImageCard key={image.id} image={image} onEdit={onEditImage} />
        ))}
      </div>
    </div>
  );
});

ImageGrid.displayName = 'ImageGrid';

export default ImageGrid;
