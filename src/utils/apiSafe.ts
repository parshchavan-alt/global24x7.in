/**
 * Safe fetch utility that never throws 'Unexpected end of JSON input' or fails on HTML responses.
 * Essential for static hosts like Cloudflare Pages, GitHub Pages, or serverless edge deploys.
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

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(input, init);
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
