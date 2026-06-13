import { API_BASE_URL } from "./config";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = RequestInit & { skipAuth?: boolean };

let onUnauthenticated: (() => void) | null = null;

export function setOnUnauthenticated(callback: () => void) {
  onUnauthenticated = callback;
}

function buildRequestOptions(options: RequestOptions) {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  // Tambahkan Authorization header jika token ada di localStorage (untuk mobile/cross-origin Safari)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return {
    ...options,
    headers,
    credentials: 'include' as RequestCredentials,
  };
}

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

export async function clearAuthSession(): Promise<void> {
  if (typeof window !== 'undefined') {
    const localRefreshToken = localStorage.getItem('refresh_token');
    
    let logoutBody: string | undefined = undefined;
    const logoutHeaders = new Headers();
    if (localRefreshToken) {
      logoutHeaders.set('Content-Type', 'application/json');
      logoutBody = JSON.stringify({ refreshToken: localRefreshToken });
    }
    
    // Kirim request logout dengan body refresh token agar di-revoked di database
    await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: logoutHeaders,
      body: logoutBody,
      credentials: 'include',
    }).catch(() => undefined);

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  } else {
    await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => undefined);
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const requestOptions = buildRequestOptions(options);
  let res = await fetch(`${API_BASE_URL}${path}`, requestOptions);

  if (res.status === 401 && !options.skipAuth && path !== '/api/v1/auth/refresh') {
    const localRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    
    const refreshHeaders = new Headers();
    let refreshBody: string | undefined = undefined;
    
    if (localRefreshToken) {
      refreshHeaders.set('Content-Type', 'application/json');
      refreshBody = JSON.stringify({ refreshToken: localRefreshToken });
    }

    const refreshRes = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: refreshHeaders,
      body: refreshBody,
      credentials: 'include',
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json().catch(() => null);
      if (data && typeof window !== 'undefined') {
        if (data.accessToken) localStorage.setItem('access_token', data.accessToken);
        if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
      }
      // Re-fetch dengan request options baru (yg memakai access_token baru)
      const newRequestOptions = buildRequestOptions(options);
      res = await fetch(`${API_BASE_URL}${path}`, newRequestOptions);
    } else {
      // Refresh token gagal — session benar-benar expired, hapus token local & notifikasi handler global
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
      if (onUnauthenticated) onUnauthenticated();
      throw new ApiError('Sesi berakhir. Silakan login kembali.', 401);
    }
  }

  return parseResponse<T>(res);
}

export async function apiDownload(path: string): Promise<Response> {
  const headers = new Headers();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    credentials: 'include',
  });
  if (!res.ok) throw new ApiError(`Download failed (${res.status})`, res.status);
  return res;
}

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}
