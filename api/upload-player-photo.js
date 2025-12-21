const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multiparty = require('multiparty');
const fs = require('fs');
const path = require('path');

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

module.exports = async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse multipart form data
        const form = new multiparty.Form();

        const { fields, files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                else resolve({ fields, files });
            });
        });

        // Get the uploaded file
        const photoFile = files.photo?.[0];
        if (!photoFile) {
            return res.status(400).json({ error: 'No photo file provided' });
        }

        // Generate unique filename with original extension
        const ext = path.extname(photoFile.originalFilename);
        const timestamp = Date.now();
        const photo_filename = `${timestamp}${ext}`;

        // Read file content
        const fileContent = fs.readFileSync(photoFile.path);

        // Upload to R2 bucket ROOT (no folders)
        const uploadCommand = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: photo_filename, // Upload to root
            Body: fileContent,
            ContentType: photoFile.headers['content-type'],
        });

        await s3Client.send(uploadCommand);

        // Clean up temp file
        fs.unlinkSync(photoFile.path);

        // Construct public URL
        const photo_url = `${process.env.R2_PUBLIC_BASE_URL}/${photo_filename}`;

        console.log('✅ Uploaded to R2:', photo_filename);

        // Return success response
        return res.status(200).json({
            success: true,
            photo_filename,
            photo_url,
        });
    } catch (error) {
        console.error('❌ Upload error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Upload failed',
        });
    }
};
