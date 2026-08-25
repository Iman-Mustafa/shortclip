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

    // Transform videos to match frontend contract
    const requestingUserId = req.userId;
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
            ? creatorFollowers.some((fid) => fid.toString() === requestingUserId)
            : false,
          followerCount: creatorFollowers.length,
        },
        likeCount: video.likes ? video.likes.length : 0,
        isLiked: requestingUserId
          ? (video.likes || []).some((uid) => uid.toString() === requestingUserId)
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

module.exports = { getFeed, createVideo, toggleLike, getComments, postComment, shareVideo };
