const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth } = require('../middleware/auth');
const {
  toggleFollow,
  getFollowers,
  getCreatorProfile,
} = require('../controllers/userController');

// GET /api/users/:id/profile (or /api/users/profile/:username) — get creator profile & clips
router.get('/:id/profile', optionalAuth, getCreatorProfile);
router.get('/profile/:username', optionalAuth, getCreatorProfile);

// GET /api/users/:id/followers — get followers list
router.get('/:id/followers', optionalAuth, getFollowers);

// POST /api/users/:id/follow — toggle follow
router.post('/:id/follow', requireAuth, toggleFollow);

module.exports = router;
