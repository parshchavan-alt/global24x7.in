/**
 * Safe fetch utility and credential manager for Global 24x7.
 * Guarantees that requests to `/api/*` include administrative
 * authorization headers, and prevents 401 Unauthorized errors
 * on media uploads or autonomous cycles.
 */

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  isHtml?: boolean;
  isEmpty?: boolean;
  networkError?: boolean;
}

export function getAdminAuthToken(): string {
  try {
    return (
      sessionStorage.getItem('chronicle_admin_session') ||
      localStorage.getItem('chronicle_admin_token') ||
      ''
    );
  } catch {
    return '';
  }
}

export function getAdminPasscode(): string {
  try {
    return localStorage.getItem('chronicle_admin_passcode') || '';
  } catch {
    return '';
  }
}

/**
 * Standard fetch with automated admin credentials attachment and token refresh.
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  const token = getAdminAuthToken();
  if (token) {
    if (!headers.has('x-admin-token')) headers.set('x-admin-token', token);
    if (!headers.has('authorization')) headers.set('authorization', `Bearer ${token}`);
  }
  const passcode = getAdminPasscode();
  if (passcode && !headers.has('x-admin-passcode')) {
    headers.set('x-admin-passcode', passcode);
  }

  const finalInit: RequestInit = { ...init, headers };
  const res = await fetch(input, finalInit);

  const refreshedToken = res.headers.get('x-refreshed-admin-token');
  if (refreshedToken) {
    try {
      sessionStorage.setItem('chronicle_admin_session', refreshedToken);
      localStorage.setItem('chronicle_admin_token', refreshedToken);
    } catch {}
  }

  return res;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await authenticatedFetch(input, init);

    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    if (!text || text.trim() === '') {
      return {
        ok: res.ok,
        status: res.status,
        isEmpty: true,
        error: res.ok ? undefined : `Server returned empty response (HTTP ${res.status})`,
      };
    }

    const trimmed = text.trim();
    if (
      contentType.includes('text/html') ||
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<html') ||
      trimmed.startsWith('<body')
    ) {
      return {
        ok: false,
        status: res.status,
        isHtml: true,
        error: `Endpoint not found on static host (HTTP ${res.status}). Switched to local browser mode.`,
      };
    }

    try {
      const data = JSON.parse(trimmed);
      return {
        ok: res.ok && (!data || data.success !== false),
        status: res.status,
        data,
        error: data?.error || data?.message,
      };
    } catch (parseErr: any) {
      return {
        ok: false,
        status: res.status,
        error: `Invalid JSON response: ${parseErr.message}`,
      };
    }
  } catch (netErr: any) {
    return {
      ok: false,
      status: 0,
      networkError: true,
      error: netErr.message || 'Network connection failed',
    };
  }
}
