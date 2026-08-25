import { apiClient } from './client';
import { AuthLoginDto, AuthRegisterDto, AuthResponse, User, UpdateProfileDto } from '@/types';

/**
 * Authentication API Service (Dynamic Backend Integration)
 * -------------------------------------------------------------
 * BACKEND COLLABORATION CONTRACTS:
 *
 * 1. Register Endpoint:
 *    POST /auth/register
 *    Payload: { username, password, confirmPassword }
 *    Returns: { user: User, token: string }
 *
 * 2. Login Endpoint:
 *    POST /auth/login
 *    Payload: { username, password }
 *    Returns: { user: User, token: string }
 *
 * 3. Me Endpoint:
 *    GET /auth/me
 *    Header: Authorization: Bearer <token>
 *    Returns: { user: User }
 *
 * 4. Logout Endpoint:
 *    POST /auth/logout
 *
 * 5. Profile Update Endpoint:
 *    PATCH /auth/profile
 *    Header: Authorization: Bearer <token>
 *    Payload: UpdateProfileDto
 *    Returns: { user: User }
 * -------------------------------------------------------------
 */

export const authApi = {
  /**
   * Register a new user
   */
  async register(data: AuthRegisterDto): Promise<AuthResponse> {
    if (data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    if (typeof window !== 'undefined' && response?.token) {
      localStorage.setItem('shortclip_auth', JSON.stringify(response));
    }
    return response;
  },

  /**
   * Login with credentials
   */
  async login(data: AuthLoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    if (typeof window !== 'undefined' && response?.token) {
      localStorage.setItem('shortclip_auth', JSON.stringify(response));
    }
    return response;
  },

  /**
   * Get current authenticated user
   */
  async getMe(): Promise<User | null> {
    try {
      const res = await apiClient.get<{ user: User } | User>('/auth/me');
      return (res as any)?.user || res || null;
    } catch {
      // If token exists in local storage cache
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
   * Update profile picture, phone, bio, or password
   */
  async updateProfile(data: UpdateProfileDto): Promise<User> {
    const res = await apiClient.patch<{ user: User } | User>('/auth/profile', data);
    const updatedUser = (res as any)?.user || res;

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('shortclip_auth');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.user = updatedUser;
          localStorage.setItem('shortclip_auth', JSON.stringify(parsed));
        } catch {}
      }
    }
    return updatedUser;
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
};
