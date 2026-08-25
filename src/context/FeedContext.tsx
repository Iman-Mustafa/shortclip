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
  toggleFollow: (userId: string) => Promise<void>;
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
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const FeedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Modals & Drawers state
  const [activeCommentVideo, setActiveCommentVideo] = useState<Video | null>(null);
  const [activeShareVideo, setActiveShareVideo] = useState<Video | null>(null);
  const [activeEditVideo, setActiveEditVideo] = useState<Video | null>(null);
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

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

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

  const toggleFollow = useCallback(
    async (userId: string) => {
      if (!isAuthenticated) {
        openAuthModal(() => {
          toggleFollow(userId);
        });
        return;
      }

      setVideos((prev) =>
        prev.map((v) => {
          if (v.creator.id === userId) {
            const nextFollow = !v.creator.isFollowing;
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

      try {
        await videosApi.toggleFollow(userId);
      } catch (err) {
        console.error('Follow error:', err);
      }
    },
    [isAuthenticated, openAuthModal]
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
        activeVideoIndex,
        activeVideo,
        isLoading,
        isMuted,
        toggleMute,
        setActiveVideoIndex,
        toggleLike,
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
        zoomedVideo,
        openZoom,
        closeZoom,
        isProfileStudioOpen,
        openProfileStudio,
        closeProfileStudio,
        publishVideo,
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
