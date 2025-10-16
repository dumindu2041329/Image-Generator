import React, { useState, useEffect, useMemo } from 'react';
import { History, Heart, Trash2, Download, Filter, Search, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useImageHistory } from '../hooks/useImageHistory';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';

const MyImagesPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; imageId: string }>({ 
    isOpen: false, 
    imageId: ''
  });
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [imagesPerPage] = useState(12);
  
  const { savedImages, loading, deleteImage, toggleFavorite } = useImageHistory();
  const { user, isConfigured } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // Debug: Log when savedImages changes
  useEffect(() => {
    console.log('savedImages state updated:', savedImages.length, 'images');
    savedImages.forEach((img, index) => {
      console.log(`Image ${index}:`, { id: img.id, is_favorite: img.is_favorite, prompt: img.prompt?.substring(0, 50) });
    });
  }, [savedImages]);

  const filteredImages = savedImages.filter(image => {
    // Skip null or undefined images
    if (!image) return false;
    
    const matchesFilter = filter === 'all' || (filter === 'favorites' && image.is_favorite);
    const matchesSearch = image.prompt?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
    return matchesFilter && matchesSearch;
  });
  
  // Calculate pagination values
  const totalPages = Math.ceil(filteredImages.length / imagesPerPage);
  const indexOfLastImage = currentPage * imagesPerPage;
  const indexOfFirstImage = indexOfLastImage - imagesPerPage;
  const currentImages = filteredImages.slice(indexOfFirstImage, indexOfLastImage);
  
  // Reset to first page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);
  
  // Pagination controls
  const goToPage = (pageNumber: number) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  const handleDownload = async (imageUrl: string, id: string) => {
    if (downloadingIds.has(id)) return;
    
    setDownloadingIds(prev => new Set(prev).add(id));
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
      link.download = `ai-generated-${id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(url);
      
      showSuccess(
        'Download Started',
        'Your image is being downloaded.'
      );
    } catch (error) {
      console.error('Download error:', error);
      showError(
        'Download Failed',
        'Could not download the image. Please try again.'
      );
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleDelete = (imageId: string) => {
    setDeleteConfirm({ isOpen: true, imageId });
  };

  const confirmDelete = async () => {
    try {
      await deleteImage(deleteConfirm.imageId);
      setDeleteConfirm({ isOpen: false, imageId: '' });
      showSuccess(
        'Image Deleted',
        'The image has been permanently removed from your collection.'
      );
    } catch (error) {
      // Provide more specific error messages
      setDeleteConfirm({ isOpen: false, imageId: '' });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('storage') || errorMessage.includes('400')) {
        showError(
          'Delete Failed',
          'Could not delete the image file from storage, but it has been removed from your collection. This may be due to a temporary storage issue.'
        );
      } else {
        showError(
          'Delete Failed',
          `Could not delete the image. ${errorMessage}`
        );
      }
    }
  };

  const handleToggleFavorite = async (imageId: string, currentFavoriteStatus: boolean) => {
    try {
      console.log('Starting favorite toggle for image:', imageId, 'current status:', currentFavoriteStatus);
      await toggleFavorite(imageId);
      console.log('Favorite toggle completed for image:', imageId);
      
      if (currentFavoriteStatus) {
        showSuccess(
          'Removed from Favorites',
          'The image has been removed from your favorites.'
        );
      } else {
        showSuccess(
          'Added to Favorites',
          'The image has been added to your favorites.'
        );
      }
    } catch (error) {
      console.error('Error in handleToggleFavorite:', error);
      // Silent failure with user notification
      showError(
        'Failed to Update Favorite',
        'Could not update the favorite status. Please try again.'
      );
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, imageId: '' });
  };

  if (!isConfigured || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="glass rounded-2xl p-8 max-w-md w-full border border-white/20">
            <div className="text-center">
              <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Sign In Required</h3>
              <p className="text-gray-300 mb-6">
                Sign in to view your saved image history and favorites.
              </p>
              <button
                onClick={() => navigate('/')}
                className="glass glass-hover rounded-xl px-6 py-3 text-blue-400 font-medium transition-all duration-300"
              >
                Go Back to Generator
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="glass border-b border-white/20 p-3 sm:p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
              <button
                onClick={() => navigate('/')}
                className="glass glass-hover rounded-lg sm:rounded-xl p-2 sm:p-3 text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                  <History className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                  My Images
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">
                  {filteredImages.length} image{filteredImages.length !== 1 ? 's' : ''} 
                  {filter === 'favorites' ? ' in favorites' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="glass border-b border-white/20 p-3 sm:p-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your images..."
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 glass rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-sm sm:text-base transition-all duration-300 ${
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
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-sm sm:text-base transition-all duration-300 ${
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
        <div className="p-3 sm:p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
                <p className="text-sm sm:text-base text-gray-400">Loading your images...</p>
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <History className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2 px-4">
                  {filter === 'favorites' ? 'No favorite images yet' : 'No images saved yet'}
                </h3>
                <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6 px-4">
                  {filter === 'favorites' 
                    ? 'Heart some images to see them here!' 
                    : 'Start generating images to build your collection!'}
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="glass glass-hover rounded-lg sm:rounded-xl px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-blue-400 font-medium transition-all duration-300"
                >
                  Generate Your First Image
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                  {currentImages.filter(image => image).map((image) => (
                    <div key={image.id} className="glass rounded-xl sm:rounded-2xl overflow-hidden group">
                      <div className="relative aspect-square">
                        <img
                          src={image.image_url || ''}
                          alt={image.prompt || 'Generated image'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Action buttons */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={() => handleToggleFavorite(image.id, image.is_favorite || false)}
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
                            onClick={() => handleDownload(image.image_url || '', image.id)}
                            disabled={downloadingIds.has(image.id)}
                            className={`glass rounded-full p-2 transition-colors duration-300 ${
                              downloadingIds.has(image.id)
                                ? 'opacity-50 cursor-not-allowed text-gray-500'
                                : 'text-gray-400 hover:text-blue-400'
                            }`}
                            title={downloadingIds.has(image.id) ? 'Downloading...' : 'Download image'}
                          >
                            {downloadingIds.has(image.id) ? (
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
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
                      
                      <div className="p-3 sm:p-4">
                        <p className="text-gray-300 text-xs sm:text-sm line-clamp-2 mb-2">{image.prompt || 'No prompt available'}</p>
                        <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-gray-500">
                          <span>{image.aspect_ratio || 'Unknown'}</span>
                          <span>{image.style || 'Unknown'}</span>
                          <span>{image.created_at ? new Date(image.created_at).toLocaleDateString() : 'Unknown date'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-8 gap-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`glass rounded-xl p-2 ${
                        currentPage === 1 
                          ? 'opacity-50 cursor-not-allowed text-gray-500' 
                          : 'glass-hover text-gray-300 hover:text-white'
                      }`}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Show pages around current page
                        let pageNum;
                        if (totalPages <= 5) {
                          // If 5 or fewer pages, show all
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          // If near start, show first 5 pages
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          // If near end, show last 5 pages
                          pageNum = totalPages - 4 + i;
                        } else {
                          // Otherwise show 2 before and 2 after current page
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-500 text-white'
                                : 'glass glass-hover text-gray-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`glass rounded-xl p-2 ${
                        currentPage === totalPages 
                          ? 'opacity-50 cursor-not-allowed text-gray-500' 
                          : 'glass-hover text-gray-300 hover:text-white'
                      }`}
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
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

export default MyImagesPage;