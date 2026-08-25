'use client';

import React, { useRef, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Heart, Bookmark, ExternalLink } from 'lucide-react';
import { Video } from '@/types';
import { useFeed } from '@/context/FeedContext';

export const VideoPreviewModal: React.FC = () => {
  const { activePreviewVideo, closePreviewVideo, toggleLike, toggleSave, playVideoInFeed } = useFeed();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  if (!activePreviewVideo) return null;

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="modal-overlay-backdrop" onClick={closePreviewVideo}>
      <div
        className="glass-modal-card video-preview-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="modal-close-btn"
          onClick={closePreviewVideo}
          aria-label="Close preview"
        >
          <X size={18} />
        </button>

        <div className="preview-modal-body">
          {/* Vertical Video Viewport */}
          <div className="preview-video-container" onClick={togglePlay}>
            <video
              ref={videoRef}
              src={activePreviewVideo.videoUrl}
              autoPlay
              loop
              playsInline
              muted={isMuted}
              className="preview-video-element"
            />

            {!isPlaying && (
              <div className="preview-play-indicator">
                <Play size={36} fill="#fff" />
              </div>
            )}

            {/* Floating Mute Button */}
            <button className="preview-mute-btn" onClick={toggleMute}>
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>

          {/* Details & Actions */}
          <div className="preview-details-panel">
            <div className="preview-creator-row">
              <img
                src={activePreviewVideo.creator?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=creator'}
                alt={activePreviewVideo.creator?.username}
                className="preview-avatar-img"
              />
              <div>
                <h4 className="preview-creator-name">@{activePreviewVideo.creator?.username}</h4>
                <span className="preview-sound-tag">{activePreviewVideo.soundTitle || 'Original Sound'}</span>
              </div>
            </div>

            <p className="preview-caption-text">{activePreviewVideo.description}</p>

            {activePreviewVideo.tags && activePreviewVideo.tags.length > 0 && (
              <div className="preview-tags-row">
                {activePreviewVideo.tags.map((t) => (
                  <span key={t} className="tag-item">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <div className="preview-action-buttons">
              <button
                className={`preview-action-btn ${activePreviewVideo.isLiked ? 'liked-btn' : ''}`}
                onClick={() => toggleLike(activePreviewVideo.id)}
              >
                <Heart size={16} className={activePreviewVideo.isLiked ? 'liked-heart' : ''} />
                <span>{activePreviewVideo.likeCount} Likes</span>
              </button>

              <button
                className={`preview-action-btn ${activePreviewVideo.isSaved ? 'saved-btn' : ''}`}
                onClick={() => toggleSave(activePreviewVideo.id)}
              >
                <Bookmark size={16} className={activePreviewVideo.isSaved ? 'saved-bookmark' : ''} />
                <span>{activePreviewVideo.isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>

            <button
              className="watch-in-feed-primary-btn"
              onClick={() => playVideoInFeed(activePreviewVideo)}
            >
              <ExternalLink size={16} />
              <span>Watch in Fullscreen Feed</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
