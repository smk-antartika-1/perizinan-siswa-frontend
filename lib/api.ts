const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = RequestInit & { skipAuth?: boolean };

export const tokenStore = {
  get accessToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  },
  get refreshToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  },
  set(accessToken: string, refreshToken: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  clear() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    if (contentType.includes('application/json')) {
      const body = await res.json().catch(() => null);
      message = body?.message || body?.error || message;
    } else {
      const text = await res.text().catch(() => '');
      if (text) message = text;
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  if (contentType.includes('application/json')) return res.json() as Promise<T>;
  return res as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (!options.skipAuth) {
    const token = tokenStore.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  return parseResponse<T>(res);
}

export async function apiDownload(path: string): Promise<Response> {
  const headers = new Headers();
  const token = tokenStore.accessToken;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!res.ok) throw new ApiError(`Download failed (${res.status})`, res.status);
  return res;
}

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}
