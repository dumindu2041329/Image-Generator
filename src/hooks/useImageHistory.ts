import { useState, useEffect, useCallback } from 'react';
import { supabase, getAuthenticatedStorageClient, SavedImage, getUserId } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useImageHistory = () => {
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isConfigured } = useAuth();
  
  const userId = getUserId(user);

  const fetchSavedImages = useCallback(async () => {
    if (!isConfigured || !userId || !supabase) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch saved images error:', error);
        throw error;
      }
      setSavedImages(data || []);
    } catch (error) {
      // Log the error for debugging
      console.error('Fetch saved images error:', error);
    } finally {
      setLoading(false);
    }
  }, [isConfigured, userId]);

  useEffect(() => {
    if (userId && isConfigured) {
      fetchSavedImages();
    } else {
      setSavedImages([]);
    }
  }, [userId, isConfigured, fetchSavedImages]);

  const saveImage = async (
    prompt: string,
    generatedImageUrl: string,
    aspectRatio: '1:1' | '16:9' | '4:3',
    style: 'vivid' | 'natural'
  ): Promise<SavedImage | null> => {
    if (!isConfigured || !userId || !supabase) {
      // Silent failure - authentication not configured
      return null;
    }

    try {
      // 1. Fetch the image from the external URL as a blob
      const response = await fetch(generatedImageUrl);
      if (!response.ok) {
        console.error(`Failed to fetch generated image for saving. Status: ${response.status}, URL: ${generatedImageUrl}`);
        throw new Error(`Failed to fetch generated image for saving. Status: ${response.status}`);
      }
      
      const imageBlob = await response.blob();
      
      // Check if the blob is actually an image and has content
      if (!imageBlob.type.startsWith('image/')) {
        console.error(`Generated image is not a valid image type: ${imageBlob.type}, URL: ${generatedImageUrl}`);
        throw new Error(`Generated image is not a valid image type: ${imageBlob.type}`);
      }
      
      if (imageBlob.size === 0) {
        console.error(`Generated image is empty (0 bytes), URL: ${generatedImageUrl}`);
        throw new Error('Generated image is empty (0 bytes). The image generation service may be experiencing issues. Please try again.');
      }
      const fileExt = imageBlob.type.split('/')[1] || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // 2. Upload the blob to Supabase Storage
      const authStorageClient = await getAuthenticatedStorageClient();
      const { error: uploadError } = await authStorageClient?.storage
        .from('generated_images')
        .upload(filePath, imageBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageBlob.type || 'image/jpeg',
        }) || { error: new Error('Storage client not available') };

      if (uploadError) {
        throw uploadError;
      }

      // 3. Get the public URL of the uploaded image
      const { data: { publicUrl } } = authStorageClient?.storage
        .from('generated_images')
        .getPublicUrl(filePath) || { data: { publicUrl: '' } };

      if (!publicUrl) {
        throw new Error('Failed to get public URL for the uploaded image.');
      }

      // 4. Save the metadata to the database, including the storage path
      const imageData = {
        user_id: userId,
        prompt,
        image_url: publicUrl,
        aspect_ratio: aspectRatio,
        style,
        is_favorite: false,
        storage_file_path: filePath, // Save the direct path
      };

      const { data, error: insertError } = await supabase
        .from('saved_images')
        .insert([imageData])
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }

      setSavedImages(prev => [data, ...prev]);
      return data;
    } catch (error) {
      // Log the error for debugging
      console.error('Save image error:', error);
      return null;
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!isConfigured || !userId || !supabase) return;

    try {
      const imageToDelete = savedImages.find(img => img.id === imageId);
      if (!imageToDelete) return;

      // 1. Delete from storage using the direct path
      let filePathToDelete: string | null = imageToDelete.storage_file_path;

      // Fallback for older images that might not have the path stored
      if (!filePathToDelete) {
        // Fallback to URL parsing without logging
        const urlParts = imageToDelete.image_url.split('/');
        const bucketNameIndex = urlParts.indexOf('generated_images');
        if (bucketNameIndex !== -1) {
          filePathToDelete = urlParts.slice(bucketNameIndex + 1).join('/');
        }
      }

      // Additional validation for file path
      if (filePathToDelete && filePathToDelete.includes('undefined')) {
        console.warn('Invalid file path detected, skipping storage deletion:', filePathToDelete);
        filePathToDelete = null;
      }

      // Try to delete from storage if we have a valid path
      if (filePathToDelete) {
        try {
          // Clean the file path to ensure it's valid
          const cleanPath = filePathToDelete.startsWith('/') ? filePathToDelete.slice(1) : filePathToDelete;
          
          console.log('Attempting to delete file from storage:', cleanPath);
          console.log('File path details:', {
            original: filePathToDelete,
            cleaned: cleanPath,
            userId: userId
          });
          
          // Try the standard remove method using authenticated storage client
          const authStorageClient = await getAuthenticatedStorageClient();
          const { data: removeData, error: storageError } = await authStorageClient?.storage
            .from('generated_images')
            .remove([cleanPath]) || { data: null, error: new Error('Storage client not available') };
          
          console.log('Storage deletion response:', { removeData, storageError });
          
          if (storageError) {
            console.warn('Storage deletion failed:', storageError);
            // Don't throw here - continue with database deletion
            // The file might not exist or there might be permission issues
          } else {
            console.log('Successfully deleted file from storage:', cleanPath);
          }
        } catch (storageError) {
          console.warn('Storage deletion error:', storageError);
          // Don't throw here - continue with database deletion
        }
      } else {
        console.warn('No file path available for storage deletion');
      }
      
      // 2. Delete from database
      const { error: dbError } = await supabase
        .from('saved_images')
        .delete()
        .eq('id', imageId)
        .eq('user_id', userId);

      if (dbError) throw dbError;

      setSavedImages(prev => prev.filter(img => img.id !== imageId));
    } catch (error) {
      // Silent failure, but still throw for caller to handle
      throw error;
    }
  };

  const toggleFavorite = async (imageId: string) => {
    if (!isConfigured || !userId || !supabase) return;

    try {
      const image = savedImages.find(img => img.id === imageId);
      if (!image) return;

      const { data, error } = await supabase
        .from('saved_images')
        .update({ is_favorite: !image.is_favorite })
        .eq('id', imageId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      setSavedImages(prev =>
        prev.map(img => (img.id === imageId ? data : img))
      );
    } catch (error) {
      // Silent failure, but still throw for caller to handle
      throw error;
    }
  };

  return {
    savedImages,
    loading,
    saveImage,
    deleteImage,
    toggleFavorite,
    refreshImages: fetchSavedImages,
  };
};
