import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface ProfileImageUploadResult {
  url: string;
  path: string;
}

export class ProfileImageService {
  private static readonly BUCKET_NAME = 'profile_images';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  /**
   * Validates image file before upload
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please use JPEG, PNG, or WebP images.'
      };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'File too large. Please use an image smaller than 5MB.'
      };
    }

    return { valid: true };
  }

  /**
   * Uploads a profile image to Supabase Storage
   */
  static async uploadProfileImage(
    userId: string, 
    file: File
  ): Promise<ProfileImageUploadResult> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    // Validate file
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      // Generate unique filename
      const fileExt = file.type.split('/')[1] || 'jpg';
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Delete existing profile image if any
      await this.deleteExistingProfileImage(userId);

      // Upload new image
      const { error: uploadError } = await supabase!.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase!.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      return {
        url: publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Profile image upload error:', error);
      throw error;
    }
  }

  /**
   * Deletes existing profile images for a user
   */
  static async deleteExistingProfileImage(userId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      // List existing files for the user
      const { data: files, error: listError } = await supabase!.storage
        .from(this.BUCKET_NAME)
        .list(userId);

      if (listError) {
        console.warn('Failed to list existing profile images:', listError);
        return;
      }

      if (files && files.length > 0) {
        // Delete all existing files
        const filePaths = files.map(file => `${userId}/${file.name}`);
        const { error: deleteError } = await supabase!.storage
          .from(this.BUCKET_NAME)
          .remove(filePaths);

        if (deleteError) {
          console.warn('Failed to delete existing profile images:', deleteError);
        }
      }
    } catch (error) {
      console.warn('Error during profile image cleanup:', error);
    }
  }

  /**
   * Deletes a specific profile image
   */
  static async deleteProfileImage(filePath: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      const { error } = await supabase!.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Profile image delete error:', error);
      throw error;
    }
  }

  /**
   * Gets the current profile image URL from user metadata
   */
  static getProfileImageUrl(user: { user_metadata?: { avatar_url?: string } } | null): string | undefined {
    return user?.user_metadata?.avatar_url;
  }

  /**
   * Extracts file path from profile image URL
   */
  static extractFilePathFromUrl(url: string): string | null {
    try {
      const urlParts = url.split('/');
      const bucketIndex = urlParts.indexOf(this.BUCKET_NAME);
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        return urlParts.slice(bucketIndex + 1).join('/');
      }
      return null;
    } catch (error) {
      console.error('Error extracting file path from URL:', error);
      return null;
    }
  }
}