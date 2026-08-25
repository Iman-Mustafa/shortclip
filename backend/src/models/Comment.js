const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Transform comment for API response
commentSchema.methods.toPublicJSON = function (userData) {
  return {
    id: this._id.toString(),
    videoId: this.videoId.toString(),
    user: userData,
    text: this.text,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
  };
};

module.exports = mongoose.model('Comment', commentSchema);
