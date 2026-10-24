export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface CacheEntry<T> {
  data: { success: boolean; data?: T; message?: string; errors?: any[] };
  expiresAt: number;
}

const clientMemoryCache = new Map<string, CacheEntry<any>>();

export function clearApiCache(endpointPrefix?: string) {
  if (!endpointPrefix) {
    clientMemoryCache.clear();
    return;
  }
  for (const key of clientMemoryCache.keys()) {
    if (key.includes(endpointPrefix)) {
      clientMemoryCache.delete(key);
    }
  }
}

export interface FetchApiOptions extends RequestInit {
  skipCache?: boolean;
  cacheTtlMs?: number; // default 15000 (15 seconds) for GET requests
  idempotencyKey?: string;
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: FetchApiOptions = {}
): Promise<{ success: boolean; data?: T; message?: string; errors?: any[] }> {
  const method = (options.method || 'GET').toUpperCase();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const isGet = method === 'GET';

  // Client memory cache check for GET requests
  const cacheKey = `${endpoint}:${token || 'anon'}`;
  if (isGet && !options.skipCache) {
    const cached = clientMemoryCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Idempotency: Auto-assign transaction key on state mutations to prevent duplicate records on retry
  if (!isGet && !headers['Idempotency-Key']) {
    const generatedKey =
      options.idempotencyKey ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
    headers['Idempotency-Key'] = generatedKey;
  }

  // Remove Content-Type if uploading FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include',
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || `Request failed with status ${res.status}`,
        errors: data.errors,
      };
    }

    // Cache successful GET requests for 15 seconds
    if (isGet && !options.skipCache && data.success) {
      const ttl = options.cacheTtlMs || 15000;
      clientMemoryCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + ttl,
      });
    }

    // Mutations invalidate client GET cache to ensure UI freshness
    if (!isGet && data.success) {
      clearApiCache();
    }

    return data;
  } catch (error: any) {
    console.error(`API Fetch Error on ${endpoint}:`, error);
    return {
      success: false,
      message: error.message || 'Unable to communicate with Code & Coffee API server.',
    };
  }
}
