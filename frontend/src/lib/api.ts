export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; errors?: any[] }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove Content-Type if uploading FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
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

    return data;
  } catch (error: any) {
    console.error(`API Fetch Error on ${endpoint}:`, error);
    return {
      success: false,
      message: error.message || 'Unable to communicate with Code & Coffee API server.',
    };
  }
}
