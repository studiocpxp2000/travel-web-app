const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Initialize S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Multer Storage Engine for S3
const storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        // Construct path: {org_slug}/assets/{timestamp}-{filename}
        const orgSlug = req.user?.org_slug || 'public'; // Fallback if no auth context yet (e.g. superadmin)
        const folder = req.uploadFolder || 'uploads';   // Middleware can set this

        const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
        const fullPath = `${orgSlug}/${folder}/${filename}`;

        cb(null, fullPath);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = { s3, upload };
