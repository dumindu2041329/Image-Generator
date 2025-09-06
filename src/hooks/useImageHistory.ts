import { useState, useEffect, useCallback } from 'react';
import { supabase, SavedImage } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useImageHistory = () => {
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isConfigured } = useAuth();

  const fetchSavedImages = useCallback(async () => {
    if (!isConfigured || !user || !supabase) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedImages(data || []);
    } catch (error) {
      console.error('Error fetching saved images:', error);
    } finally {
      setLoading(false);
    }
  }, [isConfigured, user]);

  useEffect(() => {
    if (user && isConfigured) {
      fetchSavedImages();
    } else {
      setSavedImages([]);
    }
  }, [user, isConfigured, fetchSavedImages]);

  const saveImage = async (
    prompt: string,
    generatedImageUrl: string,
    aspectRatio: '1:1' | '16:9' | '4:3',
    style: 'vivid' | 'natural'
  ): Promise<SavedImage | null> => {
    if (!isConfigured || !user || !supabase) {
      console.warn('Cannot save image: Supabase not configured or user not logged in');
      return null;
    }

    try {
      // 1. Fetch the image from the external URL as a blob
      const response = await fetch(generatedImageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch generated image for saving. Status: ${response.status}`);
      }
      const imageBlob = await response.blob();
      const fileExt = imageBlob.type.split('/')[1] || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // 2. Upload the blob to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('generated_images')
        .upload(filePath, imageBlob);

      if (uploadError) {
        throw uploadError;
      }

      // 3. Get the public URL of the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('generated_images')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to get public URL for the uploaded image.');
      }

      // 4. Save the metadata to the database, including the storage path
      const imageData = {
        user_id: user.id,
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
        throw insertError;
      }

      setSavedImages(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error saving image to Supabase:', error);
      return null;
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!isConfigured || !user || !supabase) return;

    try {
      const imageToDelete = savedImages.find(img => img.id === imageId);
      if (!imageToDelete) return;

      // 1. Delete from storage using the direct path
      let filePathToDelete: string | null = imageToDelete.storage_file_path;

      // Fallback for older images that might not have the path stored
      if (!filePathToDelete) {
        console.warn(`storage_file_path not found for image ${imageId}. Falling back to URL parsing.`);
        const urlParts = imageToDelete.image_url.split('/');
        const bucketNameIndex = urlParts.indexOf('generated_images');
        if (bucketNameIndex !== -1) {
          filePathToDelete = urlParts.slice(bucketNameIndex + 1).join('/');
        }
      }

      if (filePathToDelete) {
        await supabase.storage.from('generated_images').remove([filePathToDelete]);
      } else {
        console.error(`Could not determine file path for image ${imageId}. Skipping storage deletion.`);
      }
      
      // 2. Delete from database
      const { error: dbError } = await supabase
        .from('saved_images')
        .delete()
        .eq('id', imageId)
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      setSavedImages(prev => prev.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  };

  const toggleFavorite = async (imageId: string) => {
    if (!isConfigured || !user || !supabase) return;

    try {
      const image = savedImages.find(img => img.id === imageId);
      if (!image) return;

      const { data, error } = await supabase
        .from('saved_images')
        .update({ is_favorite: !image.is_favorite })
        .eq('id', imageId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setSavedImages(prev =>
        prev.map(img => (img.id === imageId ? data : img))
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
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
