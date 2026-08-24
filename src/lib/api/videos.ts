import { apiClient } from './client';
import { Video, Comment, LikeResponse, PaginatedVideosResponse, FollowResponse } from '@/types';
import { INITIAL_VIDEOS, MOCK_COMMENTS } from './mockData';

/**
 * Videos & Interaction API Service
 * -------------------------------------------------------------
 * BACKEND COLLAB NOTE FOR YOUR BACKEND TEAMMATE:
 *
 * 1. Feed Endpoint:
 *    GET /videos?cursor=<cursor>&limit=<limit>
 *    Returns: { videos: Video[], nextCursor: string | null, hasMore: boolean }
 *
 * 2. Like Endpoint:
 *    POST /videos/:id/like
 *    Header: Authorization: Bearer <token>
 *    Returns: { videoId: string, isLiked: boolean, likeCount: number }
 *
 * 3. Comments Endpoint:
 *    GET /videos/:id/comments
 *    Returns: { comments: Comment[] }
 *
 * 4. Post Comment Endpoint:
 *    POST /videos/:id/comments
 *    Header: Authorization: Bearer <token>
 *    Payload: { text: string }
 *    Returns: { comment: Comment }
 *
 * 5. Follow User Endpoint:
 *    POST /users/:id/follow
 *    Header: Authorization: Bearer <token>
 *    Returns: { userId: string, isFollowing: boolean }
 * -------------------------------------------------------------
 */

const USE_FALLBACK = process.env.NEXT_PUBLIC_USE_MOCK_FALLBACK !== 'false';

// In-memory runtime state for standalone/mock mode
let runtimeVideos = [...INITIAL_VIDEOS];
let runtimeComments = { ...MOCK_COMMENTS };

export const videosApi = {
  /**
   * Fetch video feed
   */
  async getFeed(cursor?: string): Promise<PaginatedVideosResponse> {
    try {
      return await apiClient.get<PaginatedVideosResponse>('/videos', { cursor, limit: 10 });
    } catch (err) {
      if (!USE_FALLBACK) throw err;
      console.info('Backend /videos unreachable, serving runtime shortclips feed');
      return {
        videos: runtimeVideos,
        nextCursor: null,
        hasMore: false,
      };
    }
  },

  /**
   * Toggle Like video (Requires Auth)
   */
  async toggleLike(videoId: string): Promise<LikeResponse> {
    try {
      return await apiClient.post<LikeResponse>(`/videos/${videoId}/like`);
    } catch (err) {
      if (!USE_FALLBACK) throw err;

      // Update runtime state
      const video = runtimeVideos.find((v) => v.id === videoId);
      if (video) {
        video.isLiked = !video.isLiked;
        video.likeCount += video.isLiked ? 1 : -1;
        return {
          videoId,
          isLiked: video.isLiked,
          likeCount: video.likeCount,
        };
      }
      return { videoId, isLiked: true, likeCount: 1 };
    }
  },

  /**
   * Fetch comments for a specific video
   */
  async getComments(videoId: string): Promise<Comment[]> {
    try {
      const res = await apiClient.get<{ comments: Comment[] }>(`/videos/${videoId}/comments`);
      return res.comments;
    } catch (err) {
      if (!USE_FALLBACK) throw err;
      return runtimeComments[videoId] || [];
    }
  },

  /**
   * Post a new comment (Requires Auth)
   */
  async postComment(videoId: string, text: string): Promise<Comment> {
    try {
      const res = await apiClient.post<{ comment: Comment }>(`/videos/${videoId}/comments`, { text });
      return res.comment;
    } catch (err) {
      if (!USE_FALLBACK) throw err;

      let currentUser = {
        id: 'usr_me',
        username: 'current_user',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=user',
      };

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('shortclip_auth');
        if (stored) {
          try {
            currentUser = JSON.parse(stored).user;
          } catch {}
        }
      }

      const newComment: Comment = {
        id: `cmt_${Date.now()}`,
        videoId,
        user: currentUser,
        text,
        createdAt: 'Just now',
        likeCount: 0,
        isLiked: false,
      };

      if (!runtimeComments[videoId]) {
        runtimeComments[videoId] = [];
      }
      runtimeComments[videoId].unshift(newComment);

      // Increment commentCount on video
      const video = runtimeVideos.find((v) => v.id === videoId);
      if (video) {
        video.commentCount += 1;
      }

      return newComment;
    }
  },

  /**
   * Record a video share
   */
  async shareVideo(videoId: string): Promise<{ shareCount: number }> {
    try {
      return await apiClient.post<{ shareCount: number }>(`/videos/${videoId}/share`);
    } catch (err) {
      const video = runtimeVideos.find((v) => v.id === videoId);
      if (video) {
        video.shareCount += 1;
        return { shareCount: video.shareCount };
      }
      return { shareCount: 1 };
    }
  },

  /**
   * Toggle follow creator
   */
  async toggleFollow(userId: string): Promise<FollowResponse> {
    try {
      return await apiClient.post<FollowResponse>(`/users/${userId}/follow`);
    } catch (err) {
      // Toggle in runtime videos
      runtimeVideos = runtimeVideos.map((v) => {
        if (v.creator.id === userId) {
          const isFollowing = !v.creator.isFollowing;
          return {
            ...v,
            creator: {
              ...v.creator,
              isFollowing,
              followerCount: (v.creator.followerCount || 0) + (isFollowing ? 1 : -1),
            },
          };
        }
        return v;
      });

      const updated = runtimeVideos.find((v) => v.creator.id === userId);
      return {
        userId,
        isFollowing: updated?.creator.isFollowing ?? true,
      };
    }
  },
};
