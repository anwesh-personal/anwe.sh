/**
 * API Client for anwe.sh
 * Connects frontend to Vanilla backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  cache?: RequestCache;
  revalidate?: number;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Set auth token for authenticated requests
   */
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Set Ora API key for AI OS requests
   */
  setOraApiKey(key: string) {
    this.defaultHeaders['X-Ora-API-Key'] = key;
  }

  /**
   * Clear auth headers
   */
  clearAuth() {
    delete this.defaultHeaders['Authorization'];
    delete this.defaultHeaders['X-Ora-API-Key'];
  }

  /**
   * Make API request
   */
  async request<T>(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {}, cache, revalidate } = options;

    const url = `${this.baseUrl}${endpoint}`;
    
    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...headers,
      },
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    if (cache) {
      fetchOptions.cache = cache;
    }

    if (revalidate !== undefined) {
      fetchOptions.next = { revalidate };
    }

    try {
      const response = await fetch(url, fetchOptions);
      const data = response.ok ? await response.json() : null;
      const error = response.ok ? null : await response.text();

      return {
        data,
        error,
        status: response.status,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        status: 0,
      };
    }
  }

  // Convenience methods
  get<T>(endpoint: string, options?: Omit<ApiOptions, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body: unknown, options?: Omit<ApiOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T>(endpoint: string, body: unknown, options?: Omit<ApiOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  delete<T>(endpoint: string, options?: Omit<ApiOptions, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);

// ============================================
// BLOG API
// ============================================

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[];
  created_by: 'manual' | 'ora' | 'api';
  created_at: string;
  updated_at: string;
}

export const blogApi = {
  // Get all posts (public, published only)
  async getPosts(options?: { limit?: number; offset?: number; tag?: string }) {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));
    if (options?.tag) params.set('tag', options.tag);
    
    return api.get<BlogPost[]>(`/api/v1/blog/posts?${params}`, {
      revalidate: 60, // Revalidate every minute
    });
  },

  // Get single post by slug
  async getPost(slug: string) {
    return api.get<BlogPost>(`/api/v1/blog/posts/${slug}`, {
      revalidate: 60,
    });
  },

  // Create post (Ora/Admin only)
  async createPost(post: Partial<BlogPost>) {
    return api.post<BlogPost>('/api/v1/blog/posts', post);
  },

  // Update post
  async updatePost(id: string, post: Partial<BlogPost>) {
    return api.put<BlogPost>(`/api/v1/blog/posts/${id}`, post);
  },

  // Delete post
  async deletePost(id: string) {
    return api.delete<void>(`/api/v1/blog/posts/${id}`);
  },

  // Publish post
  async publishPost(id: string) {
    return api.post<BlogPost>(`/api/v1/blog/posts/${id}/publish`, {});
  },
};

// ============================================
// CONTENT API (Page sections)
// ============================================

export interface PageContent {
  id: string;
  section: string;
  content: Record<string, unknown>;
  version: number;
  published: boolean;
  updated_at: string;
}

export const contentApi = {
  // Get content for a section
  async getSection(section: string) {
    return api.get<PageContent>(`/api/v1/content/${section}`, {
      revalidate: 300, // 5 minutes
    });
  },

  // Update section content (Ora/Admin only)
  async updateSection(section: string, content: Record<string, unknown>) {
    return api.put<PageContent>(`/api/v1/content/${section}`, { content });
  },
};

// ============================================
// CONTACT API
// ============================================

export interface ContactSubmission {
  name: string;
  email: string;
  company?: string;
  message: string;
  source?: string;
}

export const contactApi = {
  async submit(data: ContactSubmission) {
    return api.post<{ success: boolean; id: string }>('/api/v1/contact', data);
  },
};

export default api;
