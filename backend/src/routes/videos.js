const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { uploadVideo } = require('../middleware/upload');
const {
  getFeed,
  createVideo,
  toggleLike,
  toggleSave,
  getSavedVideos,
  getComments,
  postComment,
  shareVideo,
  updateVideo,
} = require('../controllers/videoController');

// GET /api/videos — public feed with optional auth for isLiked enrichment
router.get('/', optionalAuth, getFeed);

// GET /api/videos/saved — get saved videos for current user
router.get('/saved', requireAuth, getSavedVideos);

// POST /api/videos — create/publish video (with optional file upload)
router.post('/', requireAuth, uploadVideo.single('video'), createVideo);

// POST /api/videos/:id/like — toggle like
router.post('/:id/like', requireAuth, toggleLike);

// POST /api/videos/:id/save — toggle save/bookmark
router.post('/:id/save', requireAuth, toggleSave);

// GET /api/videos/:id/comments — get comments
router.get('/:id/comments', getComments);

// POST /api/videos/:id/comments — post comment
router.post('/:id/comments', requireAuth, postComment);

// POST /api/videos/:id/share — increment share count
router.post('/:id/share', shareVideo);

// PUT /api/videos/:id — update video
router.put('/:id', requireAuth, updateVideo);

module.exports = router;
