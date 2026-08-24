'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Heart } from 'lucide-react';
import { Video } from '@/types';
import { UpperControls } from './UpperControls';
import { SenderProfile } from './SenderProfile';
import { BottomActionBar } from './BottomActionBar';
import { useFeed } from '@/context/FeedContext';

interface VideoCardProps {
  video: Video;
  isActive: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, isActive }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { isMuted, toggleLike } = useFeed();
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [doubleTapHeart, setDoubleTapHeart] = useState<{ id: number; x: number; y: number } | null>(null);

  const lastTapRef = useRef<number>(0);

  // Sync play/pause with active card in viewport
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.currentTime = 0;
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Auto-play was prevented:', err);
            setIsPlaying(false);
          });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap triggered -> Like video + trigger heart particle
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setDoubleTapHeart({ id: now, x, y });
      setTimeout(() => setDoubleTapHeart(null), 850);

      toggleLike(video.id);
      lastTapRef.current = 0;
      return;
    }

    lastTapRef.current = now;

    // Single click -> Toggle play / pause
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 600);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowPlayIcon(true);
      }
    }
  };

  return (
    <div className="video-card" onClick={handleCardClick}>
      {/* 1. Video as Full Background */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        poster={video.thumbnailUrl}
        className="video-background"
        loop
        playsInline
        muted={isMuted}
      />

      {/* 2. Top & Bottom Visual Gradients */}
      <div className="video-overlay-top" />
      <div className="video-overlay-bottom" />

      {/* 3. Upper Controls (Upper Right Zoom & Mute) */}
      <UpperControls video={video} />

      {/* 4. Above Bottom: Sender Profile & Video Description */}
      <SenderProfile video={video} />

      {/* 5. Bottom of Video Card: Icons for Like, Comment, Share, Download */}
      <BottomActionBar video={video} />

      {/* 6. Play / Pause Overlay Indicator */}
      {(!isPlaying || showPlayIcon) && (
        <div className="play-indicator-overlay">
          <Play size={32} fill="#ffffff" />
        </div>
      )}

      {/* 7. Double Tap Animated Heart */}
      {doubleTapHeart && (
        <div
          className="double-tap-heart"
          style={{
            left: `${doubleTapHeart.x}px`,
            top: `${doubleTapHeart.y}px`,
          }}
        >
          <Heart size={84} fill="currentColor" />
        </div>
      )}
    </div>
  );
};
