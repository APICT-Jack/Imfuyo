const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'imfuyo/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

// Storage for videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'imfuyo/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv'],
    transformation: [{ width: 1280, height: 720, crop: 'limit' }]
  }
});

// Configure multer for multiple file types
const upload = multer({
  storage: imageStorage, // default storage
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// For mixed uploads (images + videos)
const uploadMixed = multer({
  storage: imageStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB for videos
}).fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 3 }
]);

module.exports = upload;
module.exports.uploadMixed = uploadMixed;
module.exports.cloudinary = cloudinary;