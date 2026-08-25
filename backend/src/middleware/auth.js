const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Required Auth Middleware
 * Extracts JWT from Authorization header, verifies it, and attaches req.user
 * Returns 401 if token is missing or invalid
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Authentication error' });
  }
};

/**
 * Optional Auth Middleware
 * Same as requireAuth but does NOT fail if no token is present.
 * If a valid token is found, attaches req.user; otherwise req.user is null.
 * Useful for public endpoints that enrich responses for logged-in users (e.g., isLiked).
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.userId = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    req.user = user || null;
    req.userId = user ? user._id.toString() : null;
    next();
  } catch {
    // Token invalid — just proceed without user context
    req.user = null;
    req.userId = null;
    next();
  }
};

module.exports = { requireAuth, optionalAuth };
