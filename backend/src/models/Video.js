const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required'],
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    soundTitle: {
      type: String,
      default: 'Original Sound',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    shareCount: {
      type: Number,
      default: 0,
    },
    downloadUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: like count
videoSchema.virtual('likeCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

// Virtual: comment count (populated separately)
videoSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'videoId',
  count: true,
});

// Transform the video document for API responses
videoSchema.methods.toFeedJSON = function (creatorData, requestingUserId, commentCount = 0) {
  return {
    id: this._id.toString(),
    videoUrl: this.videoUrl,
    thumbnailUrl: this.thumbnailUrl || undefined,
    description: this.description,
    tags: this.tags || [],
    soundTitle: this.soundTitle || 'Original Sound',
    creator: creatorData,
    likeCount: this.likes ? this.likes.length : 0,
    isLiked: requestingUserId
      ? this.likes.some((uid) => uid.toString() === requestingUserId.toString())
      : false,
    commentCount: commentCount,
    shareCount: this.shareCount || 0,
    downloadUrl: this.downloadUrl || this.videoUrl,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
  };
};

// Index for efficient feed queries (newest first)
videoSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Video', videoSchema);
