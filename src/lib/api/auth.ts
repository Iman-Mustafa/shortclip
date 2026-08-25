import { apiClient } from './client';
import { AuthLoginDto, AuthRegisterDto, AuthResponse, User } from '@/types';

/**
 * Authentication API Service
 * -------------------------------------------------------------
 * BACKEND COLLAB NOTE FOR YOUR BACKEND TEAMMATE:
 *
 * 1. Register Endpoint:
 *    POST /auth/register
 *    Payload: { username, password, confirmPassword }
 *    Returns: { user: { id, username, avatarUrl }, token }
 *
 * 2. Login Endpoint:
 *    POST /auth/login
 *    Payload: { username, password }
 *    Returns: { user: { id, username, avatarUrl }, token }
 *
 * 3. Me Endpoint:
 *    GET /auth/me
 *    Header: Authorization: Bearer <token>
 *    Returns: { user: { id, username, avatarUrl } }
 * -------------------------------------------------------------
 */

const USE_FALLBACK = process.env.NEXT_PUBLIC_USE_MOCK_FALLBACK !== 'false';

export const authApi = {
  /**
   * Register a new user with username, password, and confirm password
   */
  async register(data: AuthRegisterDto): Promise<AuthResponse> {
    if (data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    try {
      // Attempt backend call first
      return await apiClient.post<AuthResponse>('/auth/register', data);
    } catch (err) {
      if (!USE_FALLBACK) throw err;

      // Fallback local session simulator for offline/standalone testing
      console.info('Backend unreachable, using local auth simulator');
      const newUser: User = {
        id: `usr_${Date.now()}`,
        username: data.username,
        name: data.username,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.username)}`,
      };
      const simulatedResponse: AuthResponse = {
        user: newUser,
        token: `mock_jwt_token_${Date.now()}`,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('shortclip_auth', JSON.stringify(simulatedResponse));
      }

      return simulatedResponse;
    }
  },

  /**
   * Login with username and password
   */
  async login(data: AuthLoginDto): Promise<AuthResponse> {
    try {
      return await apiClient.post<AuthResponse>('/auth/login', data);
    } catch (err) {
      if (!USE_FALLBACK) throw err;

      console.info('Backend unreachable, using local login simulator');
      const mockUser: User = {
        id: `usr_${data.username}`,
        username: data.username,
        name: data.username,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.username)}`,
      };
      const simulatedResponse: AuthResponse = {
        user: mockUser,
        token: `mock_jwt_token_${Date.now()}`,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('shortclip_auth', JSON.stringify(simulatedResponse));
      }

      return simulatedResponse;
    }
  },

  /**
   * Get current authenticated user
   */
  async getMe(): Promise<User | null> {
    try {
      const res = await apiClient.get<{ user: User }>('/auth/me');
      return res.user;
    } catch (err) {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('shortclip_auth');
        if (stored) {
          try {
            return JSON.parse(stored).user;
          } catch {}
        }
      }
      return null;
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('shortclip_auth');
      }
    }
  },

  /**
   * Update profile picture, phone number, bio, or password
   */
  async updateProfile(data: import('@/types').UpdateProfileDto): Promise<User> {
    try {
      const res = await apiClient.patch<{ user: User }>('/auth/profile', data);
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('shortclip_auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.user = res.user;
          localStorage.setItem('shortclip_auth', JSON.stringify(parsed));
        }
      }
      return res.user;
    } catch (err) {
      if (!USE_FALLBACK) throw err;

      // Local runtime updater for standalone execution
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('shortclip_auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.user = {
            ...parsed.user,
            ...(data.name ? { name: data.name } : {}),
            ...(data.avatarUrl ? { avatarUrl: data.avatarUrl } : {}),
            ...(data.bio !== undefined ? { bio: data.bio } : {}),
            ...(data.phoneNumber !== undefined ? { phoneNumber: data.phoneNumber } : {}),
          };
          localStorage.setItem('shortclip_auth', JSON.stringify(parsed));
          return parsed.user;
        }
      }

      throw err;
    }
  },
};
