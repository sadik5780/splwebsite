import { supabase } from '../lib/supabase';

/**
 * Upload player photo directly to Supabase Storage
 * @param {File} file - The image file to upload
 * @returns {Promise<{photo_filename: string, photo_url: string}>}
 */
export const uploadPlayerPhoto = async (file) => {
    try {
        if (!supabase) {
            return { success: false, error: 'Supabase disabled' };
        }

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
            throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('player-photos')
            .getPublicUrl(photo_filename);

        const photo_url = urlData.publicUrl;

        return {
            success: true,
            photo_filename,
            photo_url,
        };
    } catch (error) {
        throw new Error(`Failed to upload photo: ${error.message}`);
    }
};
