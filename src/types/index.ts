/**
 * Core Domain Types & Backend Contracts
 */

export interface User {
  id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  bio?: string;
  phoneNumber?: string;
  email?: string;
  isFollowing?: boolean;
  followerCount?: number;
}

export interface UpdateProfileDto {
  name?: string;
  avatarUrl?: string;
  bio?: string;
  phoneNumber?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface Video {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  description: string;
  tags: string[];
  soundTitle: string;
  creator: User;
  likeCount: number;
  isLiked: boolean;
  commentCount: number;
  shareCount: number;
  downloadUrl: string;
  createdAt?: string;
}

export interface Comment {
  id: string;
  videoId: string;
  user: User;
  text: string;
  createdAt: string;
  likeCount?: number;
  isLiked?: boolean;
}

export interface AuthRegisterDto {
  username: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthLoginDto {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LikeResponse {
  videoId: string;
  isLiked: boolean;
  likeCount: number;
}

export interface FollowResponse {
  userId: string;
  isFollowing: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedVideosResponse {
  videos: Video[];
  nextCursor?: string | null;
  hasMore: boolean;
}

export interface CreateVideoDto {
  videoUrl: string;
  description: string;
  soundTitle?: string;
  tags?: string[];
  thumbnailUrl?: string;
}

export interface UpdateVideoDto {
  description?: string;
  soundTitle?: string;
  tags?: string[];
}

