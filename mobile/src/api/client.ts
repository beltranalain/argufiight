import { useAuthStore } from '../store/authStore';

const BASE_URL = 'https://www.argufight.com';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: any;
}

export async function apiFetch<T = any>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, clearAuth } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const { body, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 — token expired or invalid
  if (res.status === 401) {
    await clearAuth();
    throw new ApiError('Unauthorized', 401);
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      data?.error || data?.message || `Request failed: ${res.status}`,
      res.status,
      data
    );
  }

  return data as T;
}

/** Upload file (multipart/form-data) */
export async function apiUpload<T = any>(
  path: string,
  formData: FormData
): Promise<T> {
  const { token, clearAuth } = useAuthStore.getState();

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Don't set Content-Type — fetch sets it with boundary for FormData

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (res.status === 401) {
    await clearAuth();
    throw new ApiError('Unauthorized', 401);
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      data?.error || `Upload failed: ${res.status}`,
      res.status,
      data
    );
  }

  return data as T;
}

export { BASE_URL };
