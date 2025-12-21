/**
 * Upload player photo to Cloudflare R2 via Vercel serverless function
 * @param {File} file - The image file to upload
 * @returns {Promise<{photo_filename: string, photo_url: string}>}
 */
export const uploadPlayerPhoto = async (file) => {
    try {
        const formData = new FormData();
        formData.append('photo', file);

        console.log('📤 Uploading photo to R2...');

        const response = await fetch('/api/upload-player-photo', {
            method: 'POST',
            body: formData,
        });

        // Check if we're in local dev and API is not available
        if (response.status === 404) {
            console.warn('⚠️ API endpoint not found - Using local development mock');
            console.warn('📝 Note: Image uploads only work on Vercel deployment');

            // Mock response for local development
            const mockFilename = `${Date.now()}_${file.name}`;
            const mockUrl = URL.createObjectURL(file); // Local blob URL for preview

            return {
                success: true,
                photo_filename: mockFilename,
                photo_url: mockUrl,
            };
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Upload failed');
        }

        console.log('✅ Photo uploaded:', result.photo_filename);
        return result;
    } catch (error) {
        console.error('❌ Upload error:', error);
        throw error;
    }
};
