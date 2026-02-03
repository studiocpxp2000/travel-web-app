const QRCode = require('qrcode');
const { s3 } = require('../config/s3');
const { Upload } = require('@aws-sdk/lib-storage');

// Generate QR Code and Upload to S3
exports.generateAndUploadQR = async (data, orgSlug, userId) => {
    try {
        // 1. Generate QR as Buffer
        const qrBuffer = await QRCode.toBuffer(data, {
            errorCorrectionLevel: 'H',
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });

        // 2. Define S3 Key
        const key = `${orgSlug}/users/${userId}/qr/code.png`;

        // 3. Upload to S3
        const upload = new Upload({
            client: s3,
            params: {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
                Body: qrBuffer,
                ContentType: 'image/png',
                // ACL: 'public-read' // Optional: if we want public access
            }
        });

        const result = await upload.done();

        // Return the Location (URL)
        return result.Location;
    } catch (error) {
        console.error('QR Generation Error:', error);
        throw error;
    }
};
