const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { uploadVideo } = require('../middleware/upload');
const {
  getFeed,
  createVideo,
  toggleLike,
  getComments,
  postComment,
  shareVideo,
} = require('../controllers/videoController');

// GET /api/videos — public feed with optional auth for isLiked enrichment
router.get('/', optionalAuth, getFeed);

// POST /api/videos — create/publish video (with optional file upload)
router.post('/', requireAuth, uploadVideo.single('video'), createVideo);

// POST /api/videos/:id/like — toggle like
router.post('/:id/like', requireAuth, toggleLike);

// GET /api/videos/:id/comments — get comments
router.get('/:id/comments', getComments);

// POST /api/videos/:id/comments — post comment
router.post('/:id/comments', requireAuth, postComment);

// POST /api/videos/:id/share — increment share count
router.post('/:id/share', shareVideo);

module.exports = router;
