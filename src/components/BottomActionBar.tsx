'use client';

import React from 'react';
import { Heart, MessageCircle, Share2, Download } from 'lucide-react';
import { Video } from '@/types';
import { useFeed } from '@/context/FeedContext';

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
  const { toggleLike, openComments, openShare, showToast } = useFeed();

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const downloadUrl = video.downloadUrl || video.videoUrl;

    if (!downloadUrl) {
      showToast('Download URL not available');
      return;
    }

    // Trigger direct download
    showToast('Starting video download...');
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = `shortclip_${video.id}.mp4`;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
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
    </div>
  );
};
