import React, { useState } from 'react';
import { X, History, Heart, Trash2, Download, Filter, Search } from 'lucide-react';
import { useImageHistory } from '../hooks/useImageHistory';
import { useAuth } from '../hooks/useAuth';
import ConfirmDialog from './ConfirmDialog';

interface ImageHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImageHistory: React.FC<ImageHistoryProps> = ({ isOpen, onClose }) => {
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; imageId: string }>({ 
    isOpen: false, 
    imageId: ''
  });
  const { savedImages, loading, deleteImage, toggleFavorite } = useImageHistory();
  const { user, isConfigured } = useAuth();

  const filteredImages = savedImages.filter(image => {
    const matchesFilter = filter === 'all' || (filter === 'favorites' && image.is_favorite);
    const matchesSearch = image.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDownload = (imageUrl: string, id: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ai-generated-${id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (imageId: string) => {
    setDeleteConfirm({ isOpen: true, imageId });
  };

  const confirmDelete = async () => {
    try {
      await deleteImage(deleteConfirm.imageId);
      setDeleteConfirm({ isOpen: false, imageId: '' });
    } catch (error) {
      // Silent failure - UI state is reset regardless
      setDeleteConfirm({ isOpen: false, imageId: '' });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, imageId: '' });
  };

  if (!isOpen) return null;

  if (!isConfigured || !user) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Image History</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="text-center">
            <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Sign In Required</h3>
            <p className="text-gray-300 mb-6">
              Sign in to view your saved image history and favorites.
            </p>
            <button
              onClick={onClose}
              className="glass glass-hover rounded-xl px-6 py-3 text-blue-400 font-medium transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="glass border-b border-white/20 p-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <History className="w-8 h-8" />
                My Images
              </h2>
              <p className="text-gray-400 mt-1">
                {filteredImages.length} image{filteredImages.length !== 1 ? 's' : ''} 
                {filter === 'favorites' ? ' in favorites' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="glass glass-hover rounded-xl p-3 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="glass border-b border-white/20 p-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your images..."
                className="w-full pl-10 pr-4 py-2 glass rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  filter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'glass glass-hover text-gray-300'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>All</span>
              </button>
              <button
                onClick={() => setFilter('favorites')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  filter === 'favorites'
                    ? 'bg-pink-500 text-white'
                    : 'glass glass-hover text-gray-300'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Favorites</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 thin-scrollbar">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading your images...</p>
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {filter === 'favorites' ? 'No favorite images yet' : 'No images saved yet'}
                </h3>
                <p className="text-gray-400">
                  {filter === 'favorites' 
                    ? 'Heart some images to see them here!' 
                    : 'Start generating images to build your collection!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredImages.map((image) => (
                  <div key={image.id} className="glass rounded-2xl overflow-hidden group">
                    <div className="relative aspect-square">
                      <img
                        src={image.image_url}
                        alt={image.prompt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Action buttons */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => toggleFavorite(image.id)}
                          className={`glass rounded-full p-2 transition-colors duration-300 ${
                            image.is_favorite 
                              ? 'text-pink-400 bg-pink-500/20' 
                              : 'text-gray-400 hover:text-pink-400'
                          }`}
                          title={image.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Heart className={`w-4 h-4 ${image.is_favorite ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleDownload(image.image_url, image.id)}
                          className="glass rounded-full p-2 text-gray-400 hover:text-blue-400 transition-colors duration-300"
                          title="Download image"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(image.id)}
                          className="glass rounded-full p-2 text-gray-400 hover:text-red-400 transition-colors duration-300"
                          title="Delete image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Favorite indicator */}
                      {image.is_favorite && (
                        <div className="absolute top-2 left-2">
                          <Heart className="w-5 h-5 text-pink-400 fill-current" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <p className="text-gray-300 text-sm line-clamp-2 mb-2">{image.prompt}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{image.aspect_ratio}</span>
                        <span>{image.style}</span>
                        <span>{new Date(image.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        variant="danger"
      />
    </div>
  );
};

export default ImageHistory;
