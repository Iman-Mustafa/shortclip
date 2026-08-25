const multer = require('multer');
const cloudinary = require('../config/cloudinary');

/**
 * Multer memory storage — files are buffered in memory
 * then uploaded to Cloudinary via the SDK directly
 */
const memoryStorage = multer.memoryStorage();

/**
 * Multer middleware for video uploads
 * Max file size: 100MB
 */
const uploadVideo = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  },
});

/**
 * Multer middleware for image uploads (avatars)
 * Max file size: 5MB
 */
const uploadImage = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} buffer - The file buffer from multer
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
};

module.exports = { uploadVideo, uploadImage, uploadToCloudinary };
