/**
 * Central API Client
 * Configurable baseUrl via NEXT_PUBLIC_API_URL
 * Automatically attaches Authorization Bearer token from localStorage
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('shortclip_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.token || null;
      }
    } catch (e) {
      console.warn('Failed to parse auth token from localStorage', e);
    }
    return null;
  }

  public async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...customConfig } = options;

    let url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const token = this.getToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...customConfig,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || errorBody.error || `HTTP error! status: ${response.status}`);
      }

      // If no content returned
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  public get<T = any>(endpoint: string, params?: Record<string, any>, headers?: HeadersInit) {
    return this.request<T>(endpoint, { method: 'GET', params, headers });
  }

  public post<T = any>(endpoint: string, body?: any, headers?: HeadersInit) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public put<T = any>(endpoint: string, body?: any, headers?: HeadersInit) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public patch<T = any>(endpoint: string, body?: any, headers?: HeadersInit) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public delete<T = any>(endpoint: string, headers?: HeadersInit) {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient(BASE_URL);
