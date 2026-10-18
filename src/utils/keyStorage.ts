/**
 * Hybrid Key Storage Manager
 * Seamlessly coordinates between:
 * 1. Express backend /api/keys (Node.js runtime / VPS / Railway / Render)
 * 2. Browser LocalStorage (Cloudflare Pages static / GitHub Pages / client-side)
 * Never crashes or throws 'Unexpected end of JSON input' on static deployments.
 */

import { KeyPoolTelemetry } from '../types';
import { safeFetchJson } from './apiSafe';
import { testGeminiKeyDirectly } from './geminiDirect';

const LOCAL_STORAGE_KEY = 'global24x7_gemini_keys';

export interface LocalApiKeyEntry {
  id: string;
  key: string;
  label: string;
  addedAt: string;
}

export function getLocalKeys(): LocalApiKeyEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalKeys(keys: LocalApiKeyEntry[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(keys));
  } catch (err) {
    console.error('Failed to save keys to localStorage:', err);
  }
}

export async function fetchKeyPoolStatusSafe(): Promise<KeyPoolTelemetry> {
  // 1. Try server endpoint first
  const serverRes = await safeFetchJson<{ success: boolean; telemetry: KeyPoolTelemetry }>('/api/key-pool-status');
  if (serverRes.ok && serverRes.data?.telemetry) {
    return serverRes.data.telemetry;
  }

  // 2. Fallback to LocalStorage (e.g. Cloudflare Pages static hosting)
  const localKeys = getLocalKeys();
  const accounts = localKeys.map((k, index) => {
    const masked = k.key.length > 8 ? `${k.key.slice(0, 4)}...${k.key.slice(-4)}` : '••••••••';
    return {
      index,
      id: k.id,
      label: k.label || `Account ${index + 1}`,
      maskedKey: masked,
      status: 'active' as const,
      requestsHandled: 0,
      lastUsedTimestamp: k.addedAt,
    };
  });

  return {
    totalKeysConfigured: localKeys.length,
    activeKeyIndex: 0,
    totalRotations: 0,
    accounts,
  };
}

export async function addApiKeySafe(
  key: string,
  label?: string
): Promise<{ success: boolean; message: string; telemetry?: KeyPoolTelemetry }> {
  const cleanKey = key.trim();
  if (!cleanKey) {
    return { success: false, message: 'Please enter a valid API key.' };
  }

  // Always mirror in localStorage for static host resilience
  const localKeys = getLocalKeys();
  const newEntry: LocalApiKeyEntry = {
    id: `local-key-${Date.now()}`,
    key: cleanKey,
    label: label?.trim() || `Account ${localKeys.length + 1}`,
    addedAt: new Date().toISOString(),
  };

  // Avoid duplicate keys in local storage
  const updatedLocal = localKeys.filter((k) => k.key !== cleanKey);
  updatedLocal.push(newEntry);
  saveLocalKeys(updatedLocal);

  // Try saving to backend server
  const serverRes = await safeFetchJson<{ success: boolean; message?: string; error?: string }>('/api/keys/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: cleanKey, label: newEntry.label }),
  });

  if (serverRes.ok && serverRes.data?.success) {
    return {
      success: true,
      message: '✓ API Key successfully saved and active in rotation pool (Server & Local Storage).',
    };
  }

  // Server was unavailable or returned 404 (Cloudflare Pages static)
  return {
    success: true,
    message: '✓ API Key successfully saved to Browser Storage (Cloudflare Pages / Static Mode Active). Ready for AI generation!',
  };
}

export async function removeApiKeySafe(
  id?: string,
  index?: number
): Promise<{ success: boolean }> {
  // Remove from localStorage
  const localKeys = getLocalKeys();
  let updated = localKeys;
  if (id) {
    updated = localKeys.filter((k) => k.id !== id);
  } else if (typeof index === 'number' && index >= 0 && index < localKeys.length) {
    updated = localKeys.filter((_, i) => i !== index);
  }
  saveLocalKeys(updated);

  // Also notify server if available
  await safeFetchJson('/api/keys/remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, index }),
  });

  return { success: true };
}

export async function testApiKeySafe(
  specificKey?: string
): Promise<{ success: boolean; message: string }> {
  // If specificKey not provided, pick first available key from local storage
  let keyToTest = specificKey?.trim();
  if (!keyToTest) {
    const localKeys = getLocalKeys();
    keyToTest = localKeys[0]?.key;
  }

  // 1. If key is available in browser, test directly with Google Gemini API
  if (keyToTest) {
    const directResult = await testGeminiKeyDirectly(keyToTest);
    if (directResult.success) {
      return directResult;
    }
  }

  // 2. Try server test endpoint as fallback
  const serverRes = await safeFetchJson<{ success: boolean; message?: string; error?: string }>('/api/keys/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: keyToTest }),
  });

  if (serverRes.ok && serverRes.data?.success) {
    return {
      success: true,
      message: serverRes.data.message || '✓ Key verified successfully with server.',
    };
  }

  // 3. If direct test gave a specific Google error message, return that
  if (keyToTest) {
    const directResult = await testGeminiKeyDirectly(keyToTest);
    return directResult;
  }

  return {
    success: false,
    message: serverRes.data?.message || serverRes.error || 'Please enter or save a Gemini API key first to test.',
  };
}
