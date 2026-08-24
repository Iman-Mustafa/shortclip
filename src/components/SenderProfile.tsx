'use client';

import React from 'react';
import { Disc3, Check, Plus, BadgeCheck } from 'lucide-react';
import { Video } from '@/types';
import { useFeed } from '@/context/FeedContext';

interface SenderProfileProps {
  video: Video;
}

export const SenderProfile: React.FC<SenderProfileProps> = ({ video }) => {
  const { toggleFollow } = useFeed();
  const { creator, description, tags, soundTitle } = video;

  return (
    <div className="sender-content-container">
      {/* Profile Header */}
      <div className="profile-header-row">
        <div className="avatar-wrapper">
          <img
            src={creator.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=creator'}
            alt={creator.username}
            className="avatar-img"
          />
        </div>

        <div className="creator-info">
          <div className="creator-username">
            @{creator.username}
            <BadgeCheck size={16} className="creator-verified" />
          </div>
        </div>

        <button
          className={`follow-btn ${creator.isFollowing ? 'following' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFollow(creator.id);
          }}
        >
          {creator.isFollowing ? (
            <>
              <Check size={12} style={{ display: 'inline', marginRight: '4px' }} /> Following
            </>
          ) : (
            <>
              <Plus size={12} style={{ display: 'inline', marginRight: '4px' }} /> Follow
            </>
          )}
        </button>
      </div>

      {/* Description & Captions */}
      <p className="video-caption">{description}</p>

      {/* Hashtags */}
      {tags && tags.length > 0 && (
        <div className="tags-row">
          {tags.map((tag) => (
            <span key={tag} className="tag-item">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Audio / Music Track Ticker */}
      <div className="sound-ticker">
        <span className="sound-icon-disc">
          <Disc3 size={15} />
        </span>
        <span>{soundTitle || 'Original Audio'}</span>
      </div>
    </div>
  );
};
