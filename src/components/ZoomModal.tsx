'use client';

import React, { useRef, useEffect } from 'react';
import { Minimize2, Volume2, VolumeX } from 'lucide-react';
import { useFeed } from '@/context/FeedContext';

export const ZoomModal: React.FC = () => {
  const { zoomedVideo, closeZoom, isMuted, toggleMute } = useFeed();
  const zoomVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (zoomedVideo && zoomVideoRef.current) {
      zoomVideoRef.current.play().catch(() => {});
    }
  }, [zoomedVideo]);

  if (!zoomedVideo) return null;

  return (
    <div className="zoom-theater-overlay" onClick={closeZoom}>
      {/* Exit Zoom Button */}
      <button
        className="zoom-exit-btn"
        onClick={(e) => {
          e.stopPropagation();
          closeZoom();
        }}
        title="Exit Zoom"
        aria-label="Exit Zoom"
      >
        <Minimize2 size={24} />
      </button>

      {/* Sound Toggle in Zoom View */}
      <button
        className="glass-control-btn"
        style={{ position: 'absolute', top: '24px', left: '24px', width: '48px', height: '48px', zIndex: 210 }}
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
      </button>

      {/* Video Content */}
      <video
        ref={zoomVideoRef}
        src={zoomedVideo.videoUrl}
        className="zoom-video-element"
        loop
        playsInline
        muted={isMuted}
        autoPlay
        onClick={(e) => e.stopPropagation()}
      />

      {/* Video Info Overlay Banner */}
      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '12px 24px',
          borderRadius: '30px',
          color: '#fff',
          textAlign: 'center',
          maxWidth: '90%',
          zIndex: 210,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>@{zoomedVideo.creator.username}</div>
        <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.75)', marginTop: '2px' }}>
          {zoomedVideo.description}
        </div>
      </div>
    </div>
  );
};
