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

function buildRequestOptions(options: RequestOptions) {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
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

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const requestOptions = buildRequestOptions(options);
  let res = await fetch(`${API_BASE_URL}${path}`, requestOptions);

  if (res.status === 401 && !options.skipAuth && path !== '/api/v1/auth/refresh') {
    const refreshRes = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshRes.ok) {
      res = await fetch(`${API_BASE_URL}${path}`, requestOptions);
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
