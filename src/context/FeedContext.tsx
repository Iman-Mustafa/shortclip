'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Video, Comment, CreateVideoDto, UpdateVideoDto } from '@/types';
import { videosApi } from '@/lib/api/videos';
import { useAuth } from './AuthContext';

interface FeedContextType {
  videos: Video[];
  activeVideoIndex: number;
  activeVideo: Video | null;
  isLoading: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  setActiveVideoIndex: (index: number) => void;
  toggleLike: (videoId: string) => Promise<void>;
  toggleSave: (videoId: string) => Promise<void>;
  toggleFollow: (userId: string) => Promise<void>;
  savedVideos: Video[];
  fetchSavedVideos: () => Promise<void>;
  shareVideo: (videoId: string) => Promise<void>;
  activeCommentVideo: Video | null;
  openComments: (video: Video) => void;
  closeComments: () => void;
  activeShareVideo: Video | null;
  openShare: (video: Video) => void;
  closeShare: () => void;
  zoomedVideo: Video | null;
  openZoom: (video: Video) => void;
  closeZoom: () => void;
  isProfileStudioOpen: boolean;
  openProfileStudio: () => void;
  closeProfileStudio: () => void;
  publishVideo: (dto: CreateVideoDto) => Promise<Video>;
  updateVideo: (videoId: string, dto: UpdateVideoDto) => Promise<Video>;
  activeEditVideo: Video | null;
  openEditModal: (video: Video) => void;
  closeEditModal: () => void;
  activeCreatorProfile: string | null;
  openCreatorProfile: (usernameOrId: string) => void;
  closeCreatorProfile: () => void;
  activePreviewVideo: Video | null;
  openPreviewVideo: (video: Video) => void;
  closePreviewVideo: () => void;
  playVideoInFeed: (video: Video) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const FeedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [savedVideos, setSavedVideos] = useState<Video[]>([]);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Modals & Drawers state
  const [activeCommentVideo, setActiveCommentVideo] = useState<Video | null>(null);
  const [activeShareVideo, setActiveShareVideo] = useState<Video | null>(null);
  const [activeEditVideo, setActiveEditVideo] = useState<Video | null>(null);
  const [activeCreatorProfile, setActiveCreatorProfile] = useState<string | null>(null);
  const [activePreviewVideo, setActivePreviewVideo] = useState<Video | null>(null);
  const [zoomedVideo, setZoomedVideo] = useState<Video | null>(null);
  const [isProfileStudioOpen, setIsProfileStudioOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2500);
  }, []);

  const openProfileStudio = useCallback(() => {
    setIsProfileStudioOpen(true);
  }, []);

  const closeProfileStudio = useCallback(() => {
    setIsProfileStudioOpen(false);
  }, []);

  const openCreatorProfile = useCallback((usernameOrId: string) => {
    setActiveCreatorProfile(usernameOrId);
  }, []);

  const closeCreatorProfile = useCallback(() => {
    setActiveCreatorProfile(null);
  }, []);

  const openPreviewVideo = useCallback((video: Video) => {
    setActivePreviewVideo(video);
  }, []);

  const closePreviewVideo = useCallback(() => {
    setActivePreviewVideo(null);
  }, []);

  const playVideoInFeed = useCallback(
    (video: Video) => {
      const idx = videos.findIndex((v) => v.id === video.id);
      if (idx !== -1) {
        setActiveVideoIndex(idx);
      } else {
        setVideos((prev) => [video, ...prev]);
        setActiveVideoIndex(0);
      }
      setActivePreviewVideo(null);
      setActiveCreatorProfile(null);
      setIsProfileStudioOpen(false);
    },
    [videos]
  );

  const publishVideo = useCallback(
    async (dto: CreateVideoDto): Promise<Video> => {
      try {
        const created = await videosApi.createVideo(dto);
        setVideos((prev) => [created, ...prev]);
        setActiveVideoIndex(0);
        setIsProfileStudioOpen(false);
        showToast('🎉 Your video was published to the feed!');
        return created;
      } catch (err: any) {
        showToast(err?.message || 'Failed to publish video');
        throw err;
      }
    },
    [showToast]
  );

  const updateVideo = useCallback(
    async (videoId: string, dto: UpdateVideoDto): Promise<Video> => {
      try {
        const updated = await videosApi.updateVideo(videoId, dto);
        setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, ...updated } : v)));
        setActiveEditVideo(null);
        showToast('✅ Video updated successfully!');
        return updated;
      } catch (err: any) {
        showToast(err?.message || 'Failed to update video');
        throw err;
      }
    },
    [showToast]
  );

  // Load Feed (re-runs when auth state changes to enrich isFollowing, isLiked, isSaved)
  const loadFeed = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await videosApi.getFeed();
      setVideos(res.videos);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch Saved Videos from API + fallback to localStorage
  const fetchSavedVideos = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setSavedVideos([]);
      return;
    }

    // First load from local storage cache for immediate display
    const cacheKey = `shortclip_saved_${user.id || user.username}`;
    let cachedList: Video[] = [];
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        cachedList = JSON.parse(cached);
        if (Array.isArray(cachedList) && cachedList.length > 0) {
          setSavedVideos(cachedList);
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached saved videos', e);
    }

    // Then sync with backend API
    try {
      const list = await videosApi.getSavedVideos();
      if (Array.isArray(list) && list.length > 0) {
        setSavedVideos(list);
        localStorage.setItem(cacheKey, JSON.stringify(list));
      } else if (cachedList.length > 0 && (!list || list.length === 0)) {
        // Keep cached if backend returned empty during sync
        setSavedVideos(cachedList);
      }
    } catch (e) {
      console.warn('Failed to sync saved videos with backend (using cache):', e);
    }
  }, [isAuthenticated, user]);

  // Re-sync feed on auth changes
  useEffect(() => {
    loadFeed();
  }, [isAuthenticated, loadFeed]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedVideos();
    } else {
      setSavedVideos([]);
    }
  }, [isAuthenticated, fetchSavedVideos]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleLike = useCallback(
    async (videoId: string) => {
      if (!isAuthenticated) {
        openAuthModal(() => {
          toggleLike(videoId);
        });
        return;
      }

      // Optimistic update
      setVideos((prev) =>
        prev.map((v) => {
          if (v.id === videoId) {
            const nextLiked = !v.isLiked;
            return {
              ...v,
              isLiked: nextLiked,
              likeCount: v.likeCount + (nextLiked ? 1 : -1),
            };
          }
          return v;
        })
      );

      try {
        await videosApi.toggleLike(videoId);
      } catch (err) {
        console.error('Like error:', err);
        // Rollback if error
        setVideos((prev) =>
          prev.map((v) => {
            if (v.id === videoId) {
              const prevLiked = !v.isLiked;
              return {
                ...v,
                isLiked: prevLiked,
                likeCount: v.likeCount + (prevLiked ? 1 : -1),
              };
            }
            return v;
          })
        );
      }
    },
    [isAuthenticated, openAuthModal]
  );

  const toggleSave = useCallback(
    async (videoId: string) => {
      if (!isAuthenticated) {
        openAuthModal(() => {
          toggleSave(videoId);
        });
        return;
      }

      let isNowSaved = false;

      // Optimistic update in videos feed
      setVideos((prev) =>
        prev.map((v) => {
          if (v.id === videoId) {
            const nextSaved = !v.isSaved;
            isNowSaved = nextSaved;
            return {
              ...v,
              isSaved: nextSaved,
              saveCount: (v.saveCount || 0) + (nextSaved ? 1 : -1),
            };
          }
          return v;
        })
      );

      // Optimistic update in savedVideos array and localStorage
      setSavedVideos((prev) => {
        let nextList: Video[] = [];
        const exists = prev.some((v) => v.id === videoId);
        if (exists) {
          nextList = prev.filter((v) => v.id !== videoId);
        } else {
          const targetVideo = videos.find((v) => v.id === videoId);
          if (targetVideo) {
            nextList = [{ ...targetVideo, isSaved: true, saveCount: (targetVideo.saveCount || 0) + 1 }, ...prev];
          } else {
            nextList = prev;
          }
        }
        if (user) {
          try {
            localStorage.setItem(`shortclip_saved_${user.id || user.username}`, JSON.stringify(nextList));
          } catch (e) {
            console.warn('Failed to save to localStorage', e);
          }
        }
        return nextList;
      });

      showToast(isNowSaved ? '⭐ Video saved to your profile!' : 'Removed from saved videos');

      try {
        await videosApi.toggleSaveVideo(videoId);
      } catch (err) {
        console.warn('Backend save sync warning:', err);
      }
    },
    [isAuthenticated, user, openAuthModal, showToast, videos]
  );

  const toggleFollow = useCallback(
    async (userId: string) => {
      if (!isAuthenticated) {
        openAuthModal(() => {
          toggleFollow(userId);
        });
        return;
      }

      let targetCreatorName = '';
      let isNowFollowing = false;

      setVideos((prev) =>
        prev.map((v) => {
          if (v.creator.id === userId) {
            const nextFollow = !v.creator.isFollowing;
            isNowFollowing = nextFollow;
            targetCreatorName = v.creator.username;
            return {
              ...v,
              creator: {
                ...v.creator,
                isFollowing: nextFollow,
                followerCount: (v.creator.followerCount || 0) + (nextFollow ? 1 : -1),
              },
            };
          }
          return v;
        })
      );

      showToast(isNowFollowing ? `✓ Following @${targetCreatorName || 'creator'}` : `Unfollowed @${targetCreatorName || 'creator'}`);

      try {
        await videosApi.toggleFollow(userId);
      } catch (err) {
        console.error('Follow error:', err);
        // Rollback
        setVideos((prev) =>
          prev.map((v) => {
            if (v.creator.id === userId) {
              const prevFollow = !v.creator.isFollowing;
              return {
                ...v,
                creator: {
                  ...v.creator,
                  isFollowing: prevFollow,
                  followerCount: (v.creator.followerCount || 0) + (prevFollow ? 1 : -1),
                },
              };
            }
            return v;
          })
        );
      }
    },
    [isAuthenticated, openAuthModal, showToast]
  );

  const shareVideo = useCallback(
    async (videoId: string) => {
      try {
        await videosApi.shareVideo(videoId);
        setVideos((prev) =>
          prev.map((v) => (v.id === videoId ? { ...v, shareCount: v.shareCount + 1 } : v))
        );
      } catch (e) {
        console.error(e);
      }
    },
    []
  );

  const openComments = (video: Video) => setActiveCommentVideo(video);
  const closeComments = () => setActiveCommentVideo(null);

  const openShare = (video: Video) => setActiveShareVideo(video);
  const closeShare = () => setActiveShareVideo(null);

  const openEditModal = (video: Video) => setActiveEditVideo(video);
  const closeEditModal = () => setActiveEditVideo(null);

  const openZoom = (video: Video) => setZoomedVideo(video);
  const closeZoom = () => setZoomedVideo(null);

  const activeVideo = videos[activeVideoIndex] || null;

  return (
    <FeedContext.Provider
      value={{
        videos,
        savedVideos,
        fetchSavedVideos,
        activeVideoIndex,
        activeVideo,
        isLoading,
        isMuted,
        toggleMute,
        setActiveVideoIndex,
        toggleLike,
        toggleSave,
        toggleFollow,
        shareVideo,
        activeCommentVideo,
        openComments,
        closeComments,
        activeShareVideo,
        openShare,
        closeShare,
        activeEditVideo,
        openEditModal,
        closeEditModal,
        activeCreatorProfile,
        openCreatorProfile,
        closeCreatorProfile,
        activePreviewVideo,
        openPreviewVideo,
        closePreviewVideo,
        playVideoInFeed,
        zoomedVideo,
        openZoom,
        closeZoom,
        isProfileStudioOpen,
        openProfileStudio,
        closeProfileStudio,
        publishVideo,
        updateVideo,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
};
