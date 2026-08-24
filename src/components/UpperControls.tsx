'use client';

import React from 'react';
import { Maximize2, Volume2, VolumeX } from 'lucide-react';
import { useFeed } from '@/context/FeedContext';
import { Video } from '@/types';

interface UpperControlsProps {
  video: Video;
}

export const UpperControls: React.FC<UpperControlsProps> = ({ video }) => {
  const { isMuted, toggleMute, openZoom } = useFeed();

  return (
    <div className="upper-controls">
      {/* Tabs */}
      <div className="upper-tabs">
        <span className="upper-tab-item">Following</span>
        <span className="upper-tab-item active">For You</span>
      </div>

      {/* Upper Right Action Buttons */}
      <div className="upper-right-actions">
        {/* Sound Toggle */}
        <button
          className="glass-control-btn"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label="Toggle Audio"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {/* Zoom / Fullscreen Button in Upper Right */}
        <button
          className="glass-control-btn zoom-btn"
          onClick={(e) => {
            e.stopPropagation();
            openZoom(video);
          }}
          title="Zoom Video"
          aria-label="Zoom video"
        >
          <Maximize2 size={18} />
        </button>
      </div>
    </div>
  );
};
