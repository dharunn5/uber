export const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch (_) {
    // ignore JSON parse errors for empty bodies
  }

  if (!res.ok) {
    const message = data?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

export function post<T>(path: string, body: any, options: RequestInit = {}) {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
  });
}

export function get<T>(path: string, options: RequestInit = {}) {
  return request<T>(path, {
    method: 'GET',
    ...options,
  });
}
