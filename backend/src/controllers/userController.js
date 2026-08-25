const mongoose = require('mongoose');
const User = require('../models/User');
const Video = require('../models/Video');
const Comment = require('../models/Comment');

/**
 * Helper to find user by ID or Username
 */
const findUserByIdOrUsername = async (idOrUsername) => {
  if (!idOrUsername) return null;
  if (mongoose.Types.ObjectId.isValid(idOrUsername)) {
    return await User.findById(idOrUsername);
  }
  return await User.findOne({ username: idOrUsername.toLowerCase() });
};

/**
 * POST /api/users/:id/follow
 * Toggle follow on a user
 * Auth: Required
 * Returns: { userId, isFollowing, followerCount }
 */
const toggleFollow = async (req, res) => {
  try {
    const targetIdOrUsername = req.params.id;
    const currentUserId = req.userId;

    const targetUser = await findUserByIdOrUsername(targetIdOrUsername);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const targetUserId = targetUser._id.toString();

    // Prevent self-follow
    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }

    if (!targetUser.followers) targetUser.followers = [];
    if (!currentUser.following) currentUser.following = [];

    const followerIndex = targetUser.followers.findIndex(
      (uid) => (uid._id ? uid._id.toString() : uid.toString()) === currentUserId
    );

    let isFollowing = false;

    if (followerIndex > -1) {
      // Already following — unfollow
      targetUser.followers.splice(followerIndex, 1);
      const followingIndex = currentUser.following.findIndex(
        (uid) => (uid._id ? uid._id.toString() : uid.toString()) === targetUserId
      );
      if (followingIndex > -1) {
        currentUser.following.splice(followingIndex, 1);
      }
      isFollowing = false;
    } else {
      // Not following — follow
      targetUser.followers.push(currentUser._id);
      currentUser.following.push(targetUser._id);
      isFollowing = true;
    }

    await Promise.all([targetUser.save(), currentUser.save()]);

    res.json({
      userId: targetUserId,
      isFollowing,
      followerCount: targetUser.followers.length,
    });
  } catch (error) {
    console.error('ToggleFollow error:', error);
    res.status(500).json({ message: 'Server error toggling follow' });
  }
};

/**
 * GET /api/users/:id/followers (or /api/users/me/followers)
 * Get list of followers for a user
 * Auth: Optional / Required
 */
const getFollowers = async (req, res) => {
  try {
    let targetId = req.params.id;
    if (targetId === 'me') {
      targetId = req.userId;
    }

    const user = await findUserByIdOrUsername(targetId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.populate('followers', 'username name avatarUrl bio followers');

    const requestingUserId = req.userId;
    const followers = (user.followers || []).map((f) => {
      const fFollowers = f.followers || [];
      return {
        id: f._id.toString(),
        username: f.username,
        name: f.name || undefined,
        avatarUrl: f.avatarUrl || undefined,
        bio: f.bio || undefined,
        followerCount: fFollowers.length,
        isFollowing: requestingUserId
          ? fFollowers.some((id) => (id._id ? id._id.toString() : id.toString()) === requestingUserId)
          : false,
      };
    });

    res.json({ followers });
  } catch (error) {
    console.error('GetFollowers error:', error);
    res.status(500).json({ message: 'Server error fetching followers' });
  }
};

/**
 * GET /api/users/:id/profile (or /api/users/profile/:username)
 * Get creator public profile and all their posted videos
 * Auth: Optional (enriches isLiked, isFollowing for logged-in user)
 */
const getCreatorProfile = async (req, res) => {
  try {
    const idOrUsername = req.params.id || req.params.username;
    const targetUser = await findUserByIdOrUsername(idOrUsername);
    if (!targetUser) {
      return res.status(404).json({ message: 'Creator not found' });
    }

    const requestingUserId = req.userId;
    const creatorFollowers = targetUser.followers || [];
    const creatorFollowing = targetUser.following || [];

    // Fetch all videos by this creator
    const videos = await Video.find({ creator: targetUser._id })
      .sort({ createdAt: -1 })
      .lean();

    const videoIds = videos.map((v) => v._id);
    const commentCounts = await Comment.aggregate([
      { $match: { videoId: { $in: videoIds } } },
      { $group: { _id: '$videoId', count: { $sum: 1 } } },
    ]);
    const commentCountMap = {};
    commentCounts.forEach((c) => {
      commentCountMap[c._id.toString()] = c.count;
    });

    // Check user's saved videos if logged in
    let userSavedSet = new Set();
    if (requestingUserId) {
      const currentUser = await User.findById(requestingUserId).select('savedVideos').lean();
      if (currentUser && currentUser.savedVideos) {
        userSavedSet = new Set(currentUser.savedVideos.map((id) => id.toString()));
      }
    }

    const transformedVideos = videos.map((video) => ({
      id: video._id.toString(),
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl || undefined,
      description: video.description || '',
      tags: video.tags || [],
      soundTitle: video.soundTitle || 'Original Sound',
      creator: {
        id: targetUser._id.toString(),
        username: targetUser.username,
        avatarUrl: targetUser.avatarUrl || undefined,
        isFollowing: requestingUserId
          ? creatorFollowers.some((fid) => (fid._id ? fid._id.toString() : fid.toString()) === requestingUserId)
          : false,
        followerCount: creatorFollowers.length,
      },
      likeCount: video.likes ? video.likes.length : 0,
      isLiked: requestingUserId
        ? (video.likes || []).some((uid) => uid.toString() === requestingUserId)
        : false,
      saveCount: video.saves ? video.saves.length : 0,
      isSaved: requestingUserId
        ? userSavedSet.has(video._id.toString()) || (video.saves || []).some((uid) => uid.toString() === requestingUserId)
        : false,
      commentCount: commentCountMap[video._id.toString()] || 0,
      shareCount: video.shareCount || 0,
      downloadUrl: video.downloadUrl || video.videoUrl,
      createdAt: video.createdAt ? video.createdAt.toISOString() : new Date().toISOString(),
    }));

    res.json({
      user: {
        id: targetUser._id.toString(),
        username: targetUser.username,
        name: targetUser.name || targetUser.username,
        avatarUrl: targetUser.avatarUrl || undefined,
        bio: targetUser.bio || undefined,
        followerCount: creatorFollowers.length,
        followingCount: creatorFollowing.length,
        clipCount: videos.length,
        isFollowing: requestingUserId
          ? creatorFollowers.some((fid) => (fid._id ? fid._id.toString() : fid.toString()) === requestingUserId)
          : false,
      },
      videos: transformedVideos,
    });
  } catch (error) {
    console.error('GetCreatorProfile error:', error);
    res.status(500).json({ message: 'Server error fetching creator profile' });
  }
};

module.exports = { toggleFollow, getFollowers, getCreatorProfile };
