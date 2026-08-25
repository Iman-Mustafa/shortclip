const User = require('../models/User');

/**
 * POST /api/users/:id/follow
 * Toggle follow on a user
 * Auth: Required
 * Returns: { userId, isFollowing }
 */
const toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.userId;

    // Prevent self-follow
    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);

    const followerIndex = targetUser.followers.findIndex(
      (uid) => uid.toString() === currentUserId
    );

    if (followerIndex > -1) {
      // Already following — unfollow
      targetUser.followers.splice(followerIndex, 1);
      const followingIndex = currentUser.following.findIndex(
        (uid) => uid.toString() === targetUserId
      );
      if (followingIndex > -1) {
        currentUser.following.splice(followingIndex, 1);
      }
    } else {
      // Not following — follow
      targetUser.followers.push(currentUserId);
      currentUser.following.push(targetUserId);
    }

    await Promise.all([targetUser.save(), currentUser.save()]);

    res.json({
      userId: targetUserId,
      isFollowing: followerIndex === -1, // true if we just followed
    });
  } catch (error) {
    console.error('ToggleFollow error:', error);
    res.status(500).json({ message: 'Server error toggling follow' });
  }
};

module.exports = { toggleFollow };
