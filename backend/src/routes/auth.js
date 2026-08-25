const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  logout,
  updateProfile,
} = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me
router.get('/me', requireAuth, getMe);

// POST /api/auth/logout
router.post('/logout', requireAuth, logout);

// PATCH /api/auth/profile
router.patch('/profile', requireAuth, updateProfile);

module.exports = router;
