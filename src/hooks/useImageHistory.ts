import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, getAuthenticatedStorageClient, SavedImage, getUserId } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useImageHistory = () => {
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isConfigured } = useAuth();
  
  const userId = getUserId(user);

  const fetchSavedImages = useCallback(async () => {
    if (!isConfigured || !userId || !supabase) {
      console.log('fetchSavedImages skipped:', { isConfigured, userId: !!userId, supabase: !!supabase });
      return;
    }

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
      
      // Filter out any null or invalid entries
      const validData = (data || []).filter((item: any) => {
        if (!item || typeof item !== 'object' || !item.id) {
          console.warn('Invalid image data found:', item);
          return false;
        }
        return true;
      });
      
      setSavedImages(validData);
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

  // Track pending saves to prevent concurrent duplicates
  const pendingSavesRef = useRef(new Set<string>());

  const saveImage = async (
    prompt: string,
    generatedImageUrl: string,
    aspectRatio: '1:1' | '16:9' | '4:3',
    style: string = 'pollinations'
  ): Promise<SavedImage | null> => {
    if (!isConfigured || !userId || !supabase) {
      console.warn('Cannot save image: not configured or missing user/supabase');
      return null;
    }

    // Create a unique key for this save operation
    const saveKey = `${userId}:${generatedImageUrl}`;
    
    // Check if this exact save is already in progress
    if (pendingSavesRef.current.has(saveKey)) {
      console.log('⏳ Save already in progress for this image, skipping duplicate save');
      return null;
    }
    
    // Mark this save as pending
    pendingSavesRef.current.add(saveKey);

    console.log('saveImage called with:', { prompt: prompt.substring(0, 50), generatedImageUrl, aspectRatio, style, userId });

    // HYBRID APPROACH: Try to upload to storage, fallback to direct URL if needed
    try {
      // First check if we already have this image saved (by URL or similar prompt)
      const { data: recentDuplicate } = await supabase
        .from('saved_images')
        .select('id, prompt, image_url')
        .eq('user_id', userId)
        .or(`image_url.eq.${generatedImageUrl},prompt.eq.${prompt}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (recentDuplicate?.id) {
        console.log('🔍 Found existing image with same URL or prompt, skipping save:', recentDuplicate.id);
        pendingSavesRef.current.delete(saveKey);
        return recentDuplicate as SavedImage;
      }
      const validStyle = style === 'vivid' || style === 'natural' ? style : 'vivid';
      
      // First, try to fetch and upload the image to storage for better reliability
      let storageUploadCompleted = false;
      try {
        console.log('🖼️ Attempting to fetch image for storage upload:', generatedImageUrl.substring(0, 100) + '...');
        
        const response = await fetch(generatedImageUrl, {
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });
        
        console.log('📥 Fetch response status:', response.status, response.statusText);
        
        if (response.ok) {
          const imageBlob = await response.blob();
          console.log('✅ Image blob fetched:', { type: imageBlob.type, size: imageBlob.size });
          
          if (imageBlob.size > 0 && imageBlob.type.startsWith('image/')) {
            console.log('✅ Blob is valid image, proceeding with storage upload');
            // Upload to Supabase Storage
            const fileExt = imageBlob.type.split('/')[1] || 'jpg';
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;
            
            console.log('📤 Uploading to storage:', { filePath, size: imageBlob.size, type: imageBlob.type });
            
            const authStorageClient = await getAuthenticatedStorageClient();
            if (!authStorageClient) {
              console.error('❌ Storage client not available!');
              throw new Error('Storage client not available');
            }
            
            const { error: uploadError, data: uploadData } = await authStorageClient.storage
              .from('generated_images')
              .upload(filePath, imageBlob, {
                cacheControl: '3600',
                upsert: false,
                contentType: imageBlob.type,
              });
            
            if (uploadError) {
              console.error('❌ Storage upload failed:', { uploadError, filePath });
              throw uploadError;
            }
            
            console.log('✅ Storage upload successful:', uploadData);
            
            // Get public URL
            const { data: { publicUrl } } = authStorageClient.storage
              .from('generated_images')
              .getPublicUrl(filePath);
            
            if (!publicUrl) {
              console.error('❌ Failed to get public URL');
              throw new Error('Failed to get public URL');
            }
            
            console.log('✅ Public URL obtained:', publicUrl.substring(0, 100) + '...');
            
            // Save with storage URL
            const imageData = {
              user_id: userId,
              prompt: prompt,
              image_url: publicUrl,
              aspect_ratio: aspectRatio,
              style: validStyle,
              is_favorite: false,
              storage_file_path: filePath,
            };
            
            // Idempotency: avoid duplicate rows by same URL for same user
            const { data: existingStorage } = await supabase
              .from('saved_images')
              .select('id')
              .eq('user_id', userId)
              .eq('image_url', publicUrl)
              .limit(1)
              .maybeSingle();
            if (existingStorage?.id) {
              console.log('ℹ️ Duplicate detected (storage URL), skipping insert');
              pendingSavesRef.current.delete(saveKey);
              setTimeout(() => fetchSavedImages(), 500);
              return existingStorage as any;
            }
            
            console.log('💾 Saving to database with storage URL');
            const { data, error: insertError } = await supabase
              .from('saved_images')
              .insert(imageData)
              .select()
              .single();
            
            if (insertError) {
              // Check if it's a unique constraint violation
              if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
                console.log('⚠️ Unique constraint violation - image already exists');
                pendingSavesRef.current.delete(saveKey);
                setTimeout(() => fetchSavedImages(), 500);
                storageUploadCompleted = true; // Still mark as completed to prevent fallback
                return null;
              }
              console.error('❌ Database insert failed:', insertError);
              throw insertError;
            }
            
            // Insert was successful (no error), even if data is null
            console.log('✅ Storage upload + database insert successful!', data ? 'with data' : 'without returned data');
            pendingSavesRef.current.delete(saveKey);
            // Trigger a fresh fetch of saved images instead of adding directly
            setTimeout(() => fetchSavedImages(), 500);
            storageUploadCompleted = true; // Mark as completed to prevent fallback
            return data || {}; // Return empty object if no data, but still successful
          } else {
            console.warn('⚠️ Invalid blob: size=' + imageBlob.size + ', type=' + imageBlob.type);
          }
        } else {
          console.error('❌ Fetch failed:', response.status, response.statusText);
        }
      } catch (fetchError) {
        console.error('❌ Storage upload failed, will use fallback:', fetchError);
      }
      
      // Check if storage upload was completed successfully
      if (storageUploadCompleted) {
        console.log('✅ Storage upload was completed, no need for fallback');
        return null;
      }
      
      // Fallback: Save original URL directly (ONLY if storage upload didn't succeed)
      console.log('📌 Using direct URL fallback');
      const imageData = {
        user_id: userId,
        prompt: prompt,
        image_url: generatedImageUrl,
        aspect_ratio: aspectRatio,
        style: validStyle,
        is_favorite: false,
      };

      // Idempotency: skip if a row with same URL already exists
      const { data: existing } = await supabase
        .from('saved_images')
        .select('id')
        .eq('user_id', userId)
        .eq('image_url', generatedImageUrl)
        .limit(1)
        .maybeSingle();
      if (existing?.id) {
        console.log('ℹ️ Duplicate detected (direct URL), skipping insert');
        pendingSavesRef.current.delete(saveKey);
        setTimeout(() => fetchSavedImages(), 500);
        return existing as any;
      }

      const { data, error: insertError } = await supabase
        .from('saved_images')
        .insert(imageData)
        .select()
        .single();

      if (insertError) {
        // Check if it's a unique constraint violation
        if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
          console.log('⚠️ Unique constraint violation - image already exists');
          pendingSavesRef.current.delete(saveKey);
          setTimeout(() => fetchSavedImages(), 500);
          return null;
        }
        console.error('Database insert failed:', {
          error: insertError,
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        });
        return null;
      }

      // Insert was successful (no error), even if data is null
      console.log('🎆 Direct URL database insert successful!', data ? 'with data' : 'without returned data');
      pendingSavesRef.current.delete(saveKey);
      // Trigger a fresh fetch of saved images instead of adding directly
      setTimeout(() => fetchSavedImages(), 500);
      return data || {}; // Return empty object if no data, but still successful
    } catch (error) {
      console.error('saveImage catch block:', error);
      pendingSavesRef.current.delete(saveKey);
      return null;
    } finally {
      // Always clean up the pending save marker
      pendingSavesRef.current.delete(saveKey);
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
      if (!image) {
        console.warn('Image not found for favorite toggle:', imageId);
        return;
      }

      const newFavoriteStatus = !image.is_favorite;
      console.log('Toggling favorite for image:', imageId, 'from', image.is_favorite, 'to', newFavoriteStatus);

      const { data, error } = await supabase
        .from('saved_images')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', imageId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating favorite status:', error);
        throw error;
      }

      console.log('Database update successful, received data:', data);

      // Update the state with the new data
      setSavedImages(prev =>
        prev.map(img => {
          if (img.id === imageId) {
            // Use the data from the database if it's valid, otherwise update locally
            if (data && typeof data === 'object' && data.id) {
              console.log('Updating image with database data:', data);
              return data;
            } else {
              console.log('Updating image locally with new favorite status');
              return { ...img, is_favorite: newFavoriteStatus };
            }
          }
          return img;
        })
      );
    } catch (error) {
      console.error('Toggle favorite error:', error);
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
