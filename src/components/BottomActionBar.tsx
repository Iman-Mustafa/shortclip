'use client';

import React from 'react';
import { Heart, MessageCircle, Share2, Download, Pencil } from 'lucide-react';
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
  const { toggleLike, openComments, openShare, showToast, openEditModal } = useFeed();
  const { isAuthenticated, user } = useAuth();

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const downloadUrl = video.downloadUrl || video.videoUrl;

    if (!downloadUrl) {
      showToast('Download URL not available');
      return;
    }

    showToast('Preparing download...');
    try {
      // Fetch as blob to force download for cross-origin URLs
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `shortclip_${video.id}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);

      showToast('Download started!');
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to old behavior if CORS blocks the fetch
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = `shortclip_${video.id}.mp4`;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      showToast('Opened in new tab to save');
    }
  };

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

      {/* Download Button */}
      <button
        className="action-btn-item download-btn"
        onClick={handleDownload}
        title="Download Video"
        aria-label="Download"
      >
        <Download className="action-btn-icon" />
        <span className="action-btn-label">Save</span>
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
