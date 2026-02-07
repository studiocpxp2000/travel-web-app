/**
 * Script to update S3 bucket CORS configuration
 * This enables cross-origin downloads from the frontend
 * 
 * Run: node scripts/update_s3_cors.js
 */

require('dotenv').config();
const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const bucketName = process.env.AWS_BUCKET_NAME;

const corsConfiguration = {
    CORSRules: [
        {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
            AllowedOrigins: [
                'http://localhost:5173',
                'http://localhost:3000',
                'http://127.0.0.1:5173',
                'http://127.0.0.1:3000',
                // Add production domains here
                '*' // Remove this in production for security
            ],
            ExposeHeaders: [
                'ETag',
                'Content-Length',
                'Content-Type',
                'Content-Disposition'
            ],
            MaxAgeSeconds: 3600
        }
    ]
};

async function updateCors() {
    console.log(`Updating CORS for bucket: ${bucketName}`);
    console.log('CORS Configuration:', JSON.stringify(corsConfiguration, null, 2));

    try {
        const command = new PutBucketCorsCommand({
            Bucket: bucketName,
            CORSConfiguration: corsConfiguration
        });

        await s3.send(command);
        console.log('\n✅ CORS configuration updated successfully!');

        // Verify by fetching the configuration
        const getCommand = new GetBucketCorsCommand({ Bucket: bucketName });
        const result = await s3.send(getCommand);
        console.log('\nVerified CORS Rules:', JSON.stringify(result.CORSRules, null, 2));

    } catch (error) {
        console.error('\n❌ Failed to update CORS:', error.message);
        if (error.Code === 'AccessDenied') {
            console.error('Your AWS credentials may not have permission to update bucket CORS.');
            console.error('Required permission: s3:PutBucketCors');
        }
        process.exit(1);
    }
}

updateCors();
