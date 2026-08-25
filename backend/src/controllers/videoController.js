const Video = require('../models/Video');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { uploadToCloudinary } = require('../middleware/upload');

/**
 * GET /api/videos?cursor=<cursor>&limit=<limit>
 * Paginated video feed (cursor-based, newest first)
 * Auth: Optional (enriches isLiked for logged-in users)
 * Returns: { videos, nextCursor, hasMore }
 */
const getFeed = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const cursor = req.query.cursor;

    // Build query — if cursor is provided, get videos older than cursor
    const query = {};
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1) // fetch one extra to determine hasMore
      .populate('creator', 'username name avatarUrl bio followers')
      .lean();

    const hasMore = videos.length > limit;
    const feedVideos = hasMore ? videos.slice(0, limit) : videos;

    // Get comment counts for all videos in one query
    const videoIds = feedVideos.map((v) => v._id);
    const commentCounts = await Comment.aggregate([
      { $match: { videoId: { $in: videoIds } } },
      { $group: { _id: '$videoId', count: { $sum: 1 } } },
    ]);
    const commentCountMap = {};
    commentCounts.forEach((c) => {
      commentCountMap[c._id.toString()] = c.count;
    });

    // Check user saved videos if authenticated
    const requestingUserId = req.userId;
    let userSavedVideoIds = new Set();
    if (requestingUserId) {
      const currentUser = await User.findById(requestingUserId).select('savedVideos').lean();
      if (currentUser && currentUser.savedVideos) {
        userSavedVideoIds = new Set(currentUser.savedVideos.map((id) => id.toString()));
      }
    }

    // Transform videos to match frontend contract
    const transformedVideos = feedVideos.map((video) => {
      const creator = video.creator || {};
      const creatorFollowers = creator.followers || [];

      return {
        id: video._id.toString(),
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl || undefined,
        description: video.description || '',
        tags: video.tags || [],
        soundTitle: video.soundTitle || 'Original Sound',
        creator: {
          id: creator._id ? creator._id.toString() : '',
          username: creator.username || '',
          avatarUrl: creator.avatarUrl || undefined,
          isFollowing: requestingUserId
            ? creatorFollowers.some((fid) => (fid._id ? fid._id.toString() : fid.toString()) === requestingUserId.toString())
            : false,
          followerCount: creatorFollowers.length,
        },
        likeCount: video.likes ? video.likes.length : 0,
        isLiked: requestingUserId
          ? (video.likes || []).some((uid) => uid.toString() === requestingUserId)
          : false,
        saveCount: video.saves ? video.saves.length : 0,
        isSaved: requestingUserId
          ? userSavedVideoIds.has(video._id.toString()) ||
            (video.saves || []).some((uid) => uid.toString() === requestingUserId)
          : false,
        commentCount: commentCountMap[video._id.toString()] || 0,
        shareCount: video.shareCount || 0,
        downloadUrl: video.downloadUrl || video.videoUrl,
        createdAt: video.createdAt ? video.createdAt.toISOString() : new Date().toISOString(),
      };
    });

    const nextCursor = hasMore ? feedVideos[feedVideos.length - 1]._id.toString() : null;

    res.json({
      videos: transformedVideos,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('GetFeed error:', error);
    res.status(500).json({ message: 'Server error fetching feed' });
  }
};

/**
 * POST /api/videos
 * Create/publish a new video
 * Auth: Required
 * Body (multipart): video file OR JSON { videoUrl, description, soundTitle?, tags?, thumbnailUrl? }
 * Returns: { video }
 */
const createVideo = async (req, res) => {
  try {
    let videoUrl = req.body.videoUrl;
    let thumbnailUrl = req.body.thumbnailUrl || '';

    // If a file was uploaded via multer (memory storage), upload to Cloudinary
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'shortclip/videos',
        resource_type: 'video',
      });
      videoUrl = result.secure_url;
    } else if (videoUrl && videoUrl.startsWith('data:video/')) {
      // If frontend sent a base64 Data URL directly
      const result = await require('../config/cloudinary').uploader.upload(videoUrl, {
        folder: 'shortclip/videos',
        resource_type: 'video',
      });
      videoUrl = result.secure_url;
    }

    if (!videoUrl) {
      return res.status(400).json({ message: 'Video URL or file is required' });
    }

    const { description, soundTitle, tags } = req.body;

    const video = await Video.create({
      videoUrl,
      thumbnailUrl,
      description: description || '',
      soundTitle: soundTitle || 'Original Sound',
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
      creator: req.userId,
      downloadUrl: videoUrl,
    });

    // Populate creator for response
    await video.populate('creator', 'username name avatarUrl bio followers');

    const creator = video.creator;
    res.status(201).json({
      video: {
        id: video._id.toString(),
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl || undefined,
        description: video.description,
        tags: video.tags,
        soundTitle: video.soundTitle,
        creator: {
          id: creator._id.toString(),
          username: creator.username,
          avatarUrl: creator.avatarUrl || undefined,
          isFollowing: false,
          followerCount: creator.followers ? creator.followers.length : 0,
        },
        likeCount: 0,
        isLiked: false,
        commentCount: 0,
        shareCount: 0,
        downloadUrl: video.downloadUrl || video.videoUrl,
        createdAt: video.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('CreateVideo error:', error);
    res.status(500).json({ message: 'Server error creating video' });
  }
};

/**
 * POST /api/videos/:id/like
 * Toggle like on a video
 * Auth: Required
 * Returns: { videoId, isLiked, likeCount }
 */
const toggleLike = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const userId = req.userId;
    const likeIndex = video.likes.findIndex((uid) => uid.toString() === userId);

    if (likeIndex > -1) {
      // Already liked — unlike
      video.likes.splice(likeIndex, 1);
    } else {
      // Not liked — add like
      video.likes.push(userId);
    }

    await video.save();

    res.json({
      videoId: video._id.toString(),
      isLiked: likeIndex === -1, // true if we just added the like
      likeCount: video.likes.length,
    });
  } catch (error) {
    console.error('ToggleLike error:', error);
    res.status(500).json({ message: 'Server error toggling like' });
  }
};

/**
 * GET /api/videos/:id/comments
 * Get comments for a video
 * Auth: Not required
 * Returns: { comments }
 */
const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ videoId: req.params.id })
      .sort({ createdAt: -1 })
      .populate('user', 'username name avatarUrl')
      .lean();

    const transformedComments = comments.map((comment) => ({
      id: comment._id.toString(),
      videoId: comment.videoId.toString(),
      user: {
        id: comment.user._id.toString(),
        username: comment.user.username,
        avatarUrl: comment.user.avatarUrl || undefined,
      },
      text: comment.text,
      createdAt: comment.createdAt ? comment.createdAt.toISOString() : new Date().toISOString(),
    }));

    res.json({
      comments: transformedComments,
    });
  } catch (error) {
    console.error('GetComments error:', error);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
};

/**
 * POST /api/videos/:id/comments
 * Post a new comment on a video
 * Auth: Required
 * Body: { text }
 * Returns: { comment }
 */
const postComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const comment = await Comment.create({
      videoId: req.params.id,
      user: req.userId,
      text: text.trim(),
    });

    // Populate user for response
    await comment.populate('user', 'username name avatarUrl');

    res.status(201).json({
      comment: {
        id: comment._id.toString(),
        videoId: comment.videoId.toString(),
        user: {
          id: comment.user._id.toString(),
          username: comment.user.username,
          avatarUrl: comment.user.avatarUrl || undefined,
        },
        text: comment.text,
        createdAt: comment.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('PostComment error:', error);
    res.status(500).json({ message: 'Server error posting comment' });
  }
};

/**
 * POST /api/videos/:id/share
 * Increment share count
 * Auth: Not required
 * Returns: { shareCount }
 */
const shareVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { shareCount: 1 } },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.json({
      shareCount: video.shareCount,
    });
  } catch (error) {
    console.error('ShareVideo error:', error);
    res.status(500).json({ message: 'Server error sharing video' });
  }
};

/**
 * PUT /api/videos/:id
 * Update a video
 * Auth: Required
 * Body: { description, tags, soundTitle }
 * Returns: { video }
 */
const updateVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (video.creator.toString() !== req.userId) {
      return res.status(403).json({ message: 'You are not authorized to update this video' });
    }

    const { description, tags, soundTitle } = req.body;

    if (description !== undefined) video.description = description;
    if (soundTitle !== undefined) video.soundTitle = soundTitle;
    if (tags !== undefined) {
      video.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
    }

    await video.save();
    
    // Populate creator for response
    await video.populate('creator', 'username name avatarUrl bio followers');

    const creator = video.creator;
    const requestingUserId = req.userId;
    const creatorFollowers = creator.followers || [];

    res.json({
      video: {
        id: video._id.toString(),
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl || undefined,
        description: video.description,
        tags: video.tags,
        soundTitle: video.soundTitle,
        creator: {
          id: creator._id.toString(),
          username: creator.username,
          avatarUrl: creator.avatarUrl || undefined,
          isFollowing: creatorFollowers.some((fid) => fid.toString() === requestingUserId),
          followerCount: creatorFollowers.length,
        },
        likeCount: video.likes ? video.likes.length : 0,
        isLiked: video.likes ? video.likes.some((uid) => uid.toString() === requestingUserId) : false,
        commentCount: await Comment.countDocuments({ videoId: video._id }),
        shareCount: video.shareCount || 0,
        downloadUrl: video.downloadUrl || video.videoUrl,
        createdAt: video.createdAt.toISOString(),
      }
    });
  } catch (error) {
    console.error('UpdateVideo error:', error);
    res.status(500).json({ message: 'Server error updating video' });
  }
};

/**
 * POST /api/videos/:id/save
 * Toggle save/bookmark on a video
 * Auth: Required
 * Returns: { videoId, isSaved, saveCount }
 */
const toggleSave = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!video.saves) video.saves = [];
    if (!user.savedVideos) user.savedVideos = [];

    const saveIndexInVideo = video.saves.findIndex((uid) => uid.toString() === userId);
    const saveIndexInUser = user.savedVideos.findIndex((vid) => vid.toString() === video._id.toString());

    let isSaved = false;

    if (saveIndexInVideo > -1 || saveIndexInUser > -1) {
      // Unsave
      if (saveIndexInVideo > -1) video.saves.splice(saveIndexInVideo, 1);
      if (saveIndexInUser > -1) user.savedVideos.splice(saveIndexInUser, 1);
      isSaved = false;
    } else {
      // Save
      video.saves.push(userId);
      user.savedVideos.push(video._id);
      isSaved = true;
    }

    await Promise.all([video.save(), user.save()]);

    res.json({
      videoId: video._id.toString(),
      isSaved,
      saveCount: video.saves.length,
    });
  } catch (error) {
    console.error('ToggleSave error:', error);
    res.status(500).json({ message: 'Server error toggling save' });
  }
};

/**
 * GET /api/videos/saved
 * Get all saved videos for current authenticated user
 * Auth: Required
 * Returns: { videos }
 */
const getSavedVideos = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).populate({
      path: 'savedVideos',
      populate: {
        path: 'creator',
        select: 'username name avatarUrl bio followers',
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const savedVideos = (user.savedVideos || []).filter((v) => v && v._id);
    const videoIds = savedVideos.map((v) => v._id);

    const commentCounts = await Comment.aggregate([
      { $match: { videoId: { $in: videoIds } } },
      { $group: { _id: '$videoId', count: { $sum: 1 } } },
    ]);
    const commentCountMap = {};
    commentCounts.forEach((c) => {
      commentCountMap[c._id.toString()] = c.count;
    });

    const transformedVideos = savedVideos.map((video) => {
      const creator = video.creator || {};
      const creatorFollowers = creator.followers || [];

      return {
        id: video._id.toString(),
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl || undefined,
        description: video.description || '',
        tags: video.tags || [],
        soundTitle: video.soundTitle || 'Original Sound',
        creator: {
          id: creator._id ? creator._id.toString() : '',
          username: creator.username || '',
          avatarUrl: creator.avatarUrl || undefined,
          isFollowing: creatorFollowers.some((fid) => fid.toString() === userId),
          followerCount: creatorFollowers.length,
        },
        likeCount: video.likes ? video.likes.length : 0,
        isLiked: (video.likes || []).some((uid) => uid.toString() === userId),
        saveCount: video.saves ? video.saves.length : 0,
        isSaved: true,
        commentCount: commentCountMap[video._id.toString()] || 0,
        shareCount: video.shareCount || 0,
        downloadUrl: video.downloadUrl || video.videoUrl,
        createdAt: video.createdAt ? video.createdAt.toISOString() : new Date().toISOString(),
      };
    });

    res.json({
      videos: transformedVideos,
    });
  } catch (error) {
    console.error('GetSavedVideos error:', error);
    res.status(500).json({ message: 'Server error fetching saved videos' });
  }
};

module.exports = {
  getFeed,
  createVideo,
  toggleLike,
  toggleSave,
  getSavedVideos,
  getComments,
  postComment,
  shareVideo,
  updateVideo,
};
