'use client';

import React, { useEffect, useState } from 'react';
import { X, BadgeCheck, Users, Film, Check, Plus, Heart, MessageCircle, Play } from 'lucide-react';
import { User, Video, CreatorProfileResponse } from '@/types';
import { videosApi } from '@/lib/api/videos';
import { useFeed } from '@/context/FeedContext';
import { useAuth } from '@/context/AuthContext';

export const CreatorProfileModal: React.FC = () => {
  const { activeCreatorProfile, closeCreatorProfile, toggleFollow, playVideoInFeed } = useFeed();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [profileData, setProfileData] = useState<CreatorProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeCreatorProfile) {
      setProfileData(null);
      return;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const data = await videosApi.getCreatorProfile(activeCreatorProfile);
        setProfileData(data);
      } catch (err) {
        console.error('Failed to load creator profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [activeCreatorProfile]);

  if (!activeCreatorProfile) return null;

  const creator = profileData?.user;
  const videos = profileData?.videos || [];

  const isSelf =
    isAuthenticated &&
    currentUser &&
    (currentUser.id === creator?.id || currentUser.username?.toLowerCase() === creator?.username?.toLowerCase());

  const handleFollowClick = async () => {
    if (!creator) return;
    await toggleFollow(creator.id || creator.username);
    // Optimistically update local profile state
    setProfileData((prev) => {
      if (!prev) return null;
      const nextFollow = !prev.user.isFollowing;
      return {
        ...prev,
        user: {
          ...prev.user,
          isFollowing: nextFollow,
          followerCount: (prev.user.followerCount || 0) + (nextFollow ? 1 : -1),
        },
      };
    });
  };

  return (
    <div className="modal-overlay-backdrop" onClick={closeCreatorProfile}>
      <div
        className="glass-modal-card creator-profile-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="modal-close-btn"
          onClick={closeCreatorProfile}
          aria-label="Close profile"
        >
          <X size={18} />
        </button>

        {isLoading ? (
          <div className="creator-modal-loading">
            <div className="spinner" />
            <p>Loading creator profile...</p>
          </div>
        ) : !creator ? (
          <div className="creator-modal-loading">
            <p>Creator not found.</p>
          </div>
        ) : (
          <div className="creator-profile-modal-content">
            {/* Header / Avatar Row */}
            <div className="creator-profile-modal-header">
              <div className="creator-avatar-large-wrap">
                <img
                  src={creator.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=creator'}
                  alt={creator.username}
                  className="creator-avatar-large"
                />
              </div>

              <div className="creator-header-meta">
                <div className="creator-name-row">
                  <h3>@{creator.username}</h3>
                  <BadgeCheck size={18} className="verified-badge" />
                </div>
                {creator.name && <p className="creator-display-name">{creator.name}</p>}

                {/* Follow Button */}
                {!isSelf ? (
                  <button
                    className={`follow-btn modal-follow-btn ${creator.isFollowing ? 'following' : ''}`}
                    onClick={handleFollowClick}
                  >
                    {creator.isFollowing ? (
                      <>
                        <Check size={14} /> Following
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Follow
                      </>
                    )}
                  </button>
                ) : (
                  <span className="creator-you-badge" style={{ marginTop: '6px', display: 'inline-block' }}>
                    Your Profile
                  </span>
                )}
              </div>
            </div>

            {/* Bio */}
            {creator.bio && <p className="creator-profile-bio">{creator.bio}</p>}

            {/* Stats Row */}
            <div className="creator-stats-strip">
              <div className="creator-stat-box">
                <strong>{videos.length}</strong>
                <span>Clips</span>
              </div>
              <div className="creator-stat-box">
                <strong>{creator.followerCount || 0}</strong>
                <span>Followers</span>
              </div>
              <div className="creator-stat-box">
                <strong>{creator.followingCount || 0}</strong>
                <span>Following</span>
              </div>
            </div>

            {/* Creator Clips Grid */}
            <div className="creator-clips-section">
              <h4 className="creator-clips-title">
                <Film size={15} />
                <span>Published Clips ({videos.length})</span>
              </h4>

              {videos.length === 0 ? (
                <div className="empty-creator-clips">
                  <p>No clips posted yet.</p>
                </div>
              ) : (
                <div className="creator-clips-grid">
                  {videos.map((vid) => (
                    <div
                      key={vid.id}
                      className="creator-clip-thumb-card"
                      onClick={() => playVideoInFeed(vid)}
                      title="Click to play in Feed"
                    >
                      <video src={vid.videoUrl} className="creator-thumb-video" />
                      <div className="creator-thumb-overlay">
                        <div className="play-icon-badge">
                          <Play size={14} fill="#fff" />
                        </div>
                        <div className="creator-thumb-stats">
                          <span>
                            <Heart size={11} fill="#fff" /> {vid.likeCount}
                          </span>
                          <span>
                            <MessageCircle size={11} fill="#fff" /> {vid.commentCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
