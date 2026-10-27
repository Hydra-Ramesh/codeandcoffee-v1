export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface CacheEntry<T> {
  data: { success: boolean; data?: T; message?: string; errors?: Array<string | Record<string, unknown>> };
  expiresAt: number;
}

const MAX_CACHE_ENTRIES = 100;
const clientMemoryCache = new Map<string, CacheEntry<unknown>>();

function setInClientMemoryCache(key: string, entry: CacheEntry<unknown>) {
  if (clientMemoryCache.has(key)) {
    clientMemoryCache.delete(key);
  } else if (clientMemoryCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = clientMemoryCache.keys().next().value;
    if (oldestKey) clientMemoryCache.delete(oldestKey);
  }
  clientMemoryCache.set(key, entry);
}

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
  _isRetry?: boolean;
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: FetchApiOptions = {}
): Promise<{
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<string | Record<string, unknown>>;
  requestId?: string;
  isAborted?: boolean;
}> {
  const method = (options.method || 'GET').toUpperCase();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const isGet = method === 'GET';

  // Client memory cache check for GET requests
  const cacheKey = `${endpoint}:${token || 'anon'}`;
  if (isGet && !options.skipCache) {
    const cached = clientMemoryCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      // Refresh LRU position
      clientMemoryCache.delete(cacheKey);
      clientMemoryCache.set(cacheKey, cached);
      return cached.data as { success: boolean; data?: T; message?: string; errors?: Array<string | Record<string, unknown>> };
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
    const serverRequestId = res.headers.get('x-request-id') || data.requestId;

    // Automatic Refresh Token Rotation: on 401, attempt silent rotation and replay once
    if (
      res.status === 401 &&
      !options._isRetry &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/register') &&
      !endpoint.includes('/auth/refresh')
    ) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.data?.accessToken) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('token', refreshData.data.accessToken);
            }
            // Transparently replay original request with newly issued token
            return fetchApi<T>(endpoint, {
              ...options,
              _isRetry: true,
              headers: {
                ...headers,
                Authorization: `Bearer ${refreshData.data.accessToken}`,
              },
            });
          }
        }
      } catch {
        // Fall through to standard 401 return
      }
    }

    if (!res.ok) {
      return {
        success: false,
        message: data.message || `Request failed with status ${res.status}`,
        errors: data.errors,
        requestId: serverRequestId,
      };
    }

    // Cache successful GET requests for 15 seconds
    if (isGet && !options.skipCache && data.success) {
      const ttl = options.cacheTtlMs || 15000;
      setInClientMemoryCache(cacheKey, {
        data,
        expiresAt: Date.now() + ttl,
      });
    }

    // Mutations invalidate client GET cache to ensure UI freshness
    if (!isGet && data.success) {
      clearApiCache();
    }

    return {
      ...data,
      requestId: serverRequestId,
    };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return {
        success: false,
        message: 'Request was cancelled',
        isAborted: true,
      };
    }
    console.error(`API Fetch Error on ${endpoint}:`, error);
    const message = error instanceof Error ? error.message : 'Unable to communicate with Code & Coffee API server.';
    return {
      success: false,
      message,
    };
  }
}

/**
 * Auto-aborting request controller for search debouncing and rapid navigation
 */
export function createAbortableController() {
  let controller: AbortController | null = null;
  return {
    getSignal: () => {
      if (controller) {
        controller.abort();
      }
      controller = new AbortController();
      return controller.signal;
    },
    abort: () => {
      if (controller) {
        controller.abort();
        controller = null;
      }
    },
  };
}
