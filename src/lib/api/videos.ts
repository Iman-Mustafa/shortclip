import { apiClient } from './client';
import {
  Video,
  Comment,
  LikeResponse,
  PaginatedVideosResponse,
  FollowResponse,
  CreateVideoDto,
} from '@/types';

/**
 * Videos & Interaction API Service (Dynamic Backend Integration)
 * -------------------------------------------------------------
 * BACKEND COLLABORATION CONTRACTS:
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
 * 5. Share Endpoint:
 *    POST /videos/:id/share
 *    Returns: { shareCount: number }
 *
 * 6. Follow User Endpoint:
 *    POST /users/:id/follow
 *    Header: Authorization: Bearer <token>
 *    Returns: { userId: string, isFollowing: boolean }
 *
 * 7. Publish Video Endpoint:
 *    POST /videos
 *    Header: Authorization: Bearer <token>
 *    Payload: CreateVideoDto
 *    Returns: { video: Video }
 * -------------------------------------------------------------
 */

export const videosApi = {
  /**
   * Fetch dynamic video feed from backend
   */
  async getFeed(cursor?: string): Promise<PaginatedVideosResponse> {
    try {
      const res = await apiClient.get<PaginatedVideosResponse>('/videos', { cursor, limit: 10 });
      return {
        videos: Array.isArray(res?.videos) ? res.videos : [],
        nextCursor: res?.nextCursor || null,
        hasMore: !!res?.hasMore,
      };
    } catch (err) {
      console.warn('Backend /videos fetch error or offline:', err);
      return {
        videos: [],
        nextCursor: null,
        hasMore: false,
      };
    }
  },

  /**
   * Toggle Like video (Requires Auth)
   */
  async toggleLike(videoId: string): Promise<LikeResponse> {
    return await apiClient.post<LikeResponse>(`/videos/${videoId}/like`);
  },

  /**
   * Fetch comments for a specific video
   */
  async getComments(videoId: string): Promise<Comment[]> {
    try {
      const res = await apiClient.get<{ comments: Comment[] } | Comment[]>(`/videos/${videoId}/comments`);
      if (Array.isArray(res)) return res;
      return res?.comments || [];
    } catch (err) {
      console.warn(`Failed to fetch comments for video ${videoId}:`, err);
      return [];
    }
  },

  /**
   * Post a new comment (Requires Auth)
   */
  async postComment(videoId: string, text: string): Promise<Comment> {
    const res = await apiClient.post<{ comment: Comment } | Comment>(`/videos/${videoId}/comments`, { text });
    return (res as any)?.comment || res;
  },

  /**
   * Record a video share
   */
  async shareVideo(videoId: string): Promise<{ shareCount: number }> {
    try {
      return await apiClient.post<{ shareCount: number }>(`/videos/${videoId}/share`);
    } catch {
      return { shareCount: 1 };
    }
  },

  /**
   * Toggle follow creator
   */
  async toggleFollow(userId: string): Promise<FollowResponse> {
    return await apiClient.post<FollowResponse>(`/users/${userId}/follow`);
  },

  /**
   * Create and publish a new video clip (Requires Auth)
   */
  async createVideo(dto: CreateVideoDto): Promise<Video> {
    const res = await apiClient.post<{ video: Video } | Video>('/videos', dto);
    return (res as any)?.video || res;
  },
};
