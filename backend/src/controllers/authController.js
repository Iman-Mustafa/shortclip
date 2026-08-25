const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate JWT token for a user
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { username, password, confirmPassword }
 * Returns: { user, token }
 */
const register = async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if username already taken
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    // Create user
    const user = await User.create({
      username: username.toLowerCase(),
      password,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      user: user.toPublicJSON(),
      token,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Username already taken' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * POST /api/auth/login
 * Login with credentials
 * Body: { username, password }
 * Returns: { user, token }
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ username: username.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      user: user.toPublicJSON(),
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user
 * Headers: Authorization: Bearer <token>
 * Returns: { user }
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/auth/logout
 * Logout (client-side token removal; server acknowledges)
 */
const logout = async (req, res) => {
  // JWT is stateless — client simply discards the token.
  // This endpoint exists for the frontend contract.
  res.json({ message: 'Logged out successfully' });
};

/**
 * PATCH /api/auth/profile
 * Update profile fields
 * Headers: Authorization: Bearer <token>
 * Body: { name?, avatarUrl?, bio?, phoneNumber?, currentPassword?, newPassword? }
 * Returns: { user }
 */
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, avatarUrl, bio, phoneNumber, currentPassword, newPassword } = req.body;

    // Update simple fields
    if (name !== undefined) user.name = name;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (bio !== undefined) user.bio = bio;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

    // Password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password' });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      user.password = newPassword; // pre-save hook will hash
    }

    await user.save();

    res.json({
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

module.exports = { register, login, getMe, logout, updateProfile };
