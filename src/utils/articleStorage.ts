/**
 * Article Storage Manager
 * Ensures articles persist seamlessly on static hosts like Cloudflare Pages & GitHub Pages,
 * while automatically synchronizing with the Node.js backend when available.
 */

import { Article } from '../types';
import { INITIAL_ARTICLES } from '../data/seedArticles';
import { safeFetchJson } from './apiSafe';

const LOCAL_STORAGE_ARTICLES_KEY = 'global24x7_published_articles';

export function getStoredArticles(): Article[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ARTICLES_KEY);
    if (!raw) return INITIAL_ARTICLES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_ARTICLES;

    // Merge custom articles with seed articles, prioritizing custom/new articles
    const map = new Map<string, Article>();
    // First insert seed articles
    for (const art of INITIAL_ARTICLES) {
      map.set(art.id, art);
    }
    // Then overwrite or insert user/auto-generated articles
    for (const art of parsed) {
      map.set(art.id, art);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  } catch {
    return INITIAL_ARTICLES;
  }
}

export function saveArticlesToLocal(articles: Article[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_ARTICLES_KEY, JSON.stringify(articles));
  } catch (err) {
    console.error('Failed to save articles to localStorage:', err);
  }
}

export async function persistArticle(
  article: Article,
  currentArticles: Article[]
): Promise<Article[]> {
  const existingIdx = currentArticles.findIndex((a) => a.id === article.id || a.slug === article.slug);
  let updated: Article[];
  if (existingIdx >= 0) {
    updated = [...currentArticles];
    updated[existingIdx] = article;
  } else {
    updated = [article, ...currentArticles];
  }

  // 1. Save to browser local storage immediately
  saveArticlesToLocal(updated);

  // 2. Also try persisting to backend if available
  try {
    await safeFetchJson('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(article),
    });
  } catch {
    // Backend offline (Cloudflare Pages mode)
  }

  return updated;
}

export async function removeArticle(
  id: string,
  currentArticles: Article[]
): Promise<Article[]> {
  const updated = currentArticles.filter((a) => a.id !== id);
  saveArticlesToLocal(updated);
  try {
    await safeFetchJson(`/api/articles/${id}`, { method: 'DELETE' });
  } catch {}
  return updated;
}
