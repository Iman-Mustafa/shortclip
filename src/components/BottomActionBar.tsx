'use client';

import React from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Pencil } from 'lucide-react';
import { Video } from '@/types';
import { useFeed } from '@/context/FeedContext';
import { useAuth } from '@/context/AuthContext';

interface BottomActionBarProps {
  video: Video;
}

function formatCount(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return String(num || 0);
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({ video }) => {
  const { toggleLike, toggleSave, openComments, openShare, openEditModal } = useFeed();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="bottom-action-bar">
      {/* Like Button */}
      <button
        className="action-btn-item like-btn"
        onClick={(e) => {
          e.stopPropagation();
          toggleLike(video.id);
        }}
        title="Like Video"
        aria-label="Like"
      >
        <Heart
          className={`action-btn-icon ${video.isLiked ? 'liked-heart' : ''}`}
        />
        <span className="action-btn-label">{formatCount(video.likeCount)}</span>
      </button>

      {/* Comment Button */}
      <button
        className="action-btn-item comment-btn"
        onClick={(e) => {
          e.stopPropagation();
          openComments(video);
        }}
        title="Comments"
        aria-label="Comment"
      >
        <MessageCircle className="action-btn-icon" />
        <span className="action-btn-label">{formatCount(video.commentCount)}</span>
      </button>

      {/* Share Button */}
      <button
        className="action-btn-item share-btn"
        onClick={(e) => {
          e.stopPropagation();
          openShare(video);
        }}
        title="Share"
        aria-label="Share"
      >
        <Share2 className="action-btn-icon" />
        <span className="action-btn-label">{formatCount(video.shareCount)}</span>
      </button>

      {/* Save / Bookmark to Profile Button */}
      <button
        className={`action-btn-item save-btn ${video.isSaved ? 'saved-active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleSave(video.id);
        }}
        title={video.isSaved ? 'Saved to your profile' : 'Save to Profile'}
        aria-label="Save"
      >
        <Bookmark
          className={`action-btn-icon ${video.isSaved ? 'saved-bookmark' : ''}`}
        />
        <span className="action-btn-label">
          {video.saveCount && video.saveCount > 0 ? formatCount(video.saveCount) : 'Save'}
        </span>
      </button>

      {/* Edit Button (Only if owner) */}
      {isAuthenticated && user?.id === video.creator.id && (
        <button
          className="action-btn-item edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            openEditModal(video);
          }}
          title="Edit Video"
          aria-label="Edit"
        >
          <Pencil className="action-btn-icon" />
          <span className="action-btn-label">Edit</span>
        </button>
      )}
    </div>
  );
};
