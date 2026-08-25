const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { toggleFollow } = require('../controllers/userController');

// POST /api/users/:id/follow — toggle follow
router.post('/:id/follow', requireAuth, toggleFollow);

module.exports = router;
