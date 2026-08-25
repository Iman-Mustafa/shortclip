'use client';

import React from 'react';
import { Disc3, Check, Plus, BadgeCheck } from 'lucide-react';
import { Video } from '@/types';
import { useFeed } from '@/context/FeedContext';
import { useAuth } from '@/context/AuthContext';

interface SenderProfileProps {
  video: Video;
}

export const SenderProfile: React.FC<SenderProfileProps> = ({ video }) => {
  const { toggleFollow, openCreatorProfile } = useFeed();
  const { user, isAuthenticated } = useAuth();
  const { creator, description, tags, soundTitle } = video;

  const isSelf =
    isAuthenticated &&
    user &&
    (user.id === creator.id || user.username?.toLowerCase() === creator.username?.toLowerCase());

  const handleOpenProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    openCreatorProfile(creator.username || creator.id);
  };

  return (
    <div className="sender-content-container">
      {/* Profile Header */}
      <div className="profile-header-row">
        <div
          className="avatar-wrapper clickable-avatar"
          onClick={handleOpenProfile}
          title={`View @${creator.username}'s profile`}
        >
          <img
            src={creator.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=creator'}
            alt={creator.username}
            className="avatar-img"
          />
        </div>

        <div
          className="creator-info clickable-creator-info"
          onClick={handleOpenProfile}
          title={`View @${creator.username}'s profile`}
        >
          <div className="creator-username">
            @{creator.username}
            <BadgeCheck size={16} className="creator-verified" />
          </div>
        </div>

        {!isSelf ? (
          <button
            className={`follow-btn ${creator.isFollowing ? 'following' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleFollow(creator.id);
            }}
            title={creator.isFollowing ? `Following @${creator.username}` : `Follow @${creator.username}`}
          >
            {creator.isFollowing ? (
              <>
                <Check size={13} className="follow-icon" /> Following
              </>
            ) : (
              <>
                <Plus size={13} className="follow-icon" /> Follow
              </>
            )}
          </button>
        ) : (
          <span className="creator-you-badge">You</span>
        )}
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
