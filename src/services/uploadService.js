import { supabase } from '../lib/supabase';

/**
 * Upload player photo directly to Supabase Storage
 * @param {File} file - The image file to upload
 * @returns {Promise<{photo_filename: string, photo_url: string}>}
 */
export const uploadPlayerPhoto = async (file) => {
    try {
        console.log('📤 Uploading photo to Supabase Storage...');

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const photo_filename = `${timestamp}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('player-photos')
            .upload(photo_filename, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('❌ Supabase upload error:', error);
            throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('player-photos')
            .getPublicUrl(photo_filename);

        const photo_url = urlData.publicUrl;

        console.log('✅ Photo uploaded successfully:', photo_filename);

        return {
            success: true,
            photo_filename,
            photo_url,
        };
    } catch (error) {
        console.error('❌ Upload error:', error);
        throw new Error(`Failed to upload photo: ${error.message}`);
    }
};
