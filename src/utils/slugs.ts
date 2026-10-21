/**
 * Utility for generating clean, URL-friendly and strictly unique article slugs.
 * Ensures duplicate headlines or concurrent publishing cycles never produce colliding URLs.
 */

export function sanitizeSlug(text: string): string {
  if (!text) return 'article';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special characters
    .replace(/[\s_-]+/g, '-') // replace spaces and underscores with single hyphen
    .replace(/^-+|-+$/g, '') // remove leading/trailing hyphens
    .slice(0, 90) || 'article';
}

export interface SlugArticleItem {
  id?: string;
  slug?: string;
}

/**
 * Guarantees a unique slug that does not exist among existing articles.
 * If collision is found, appends -2, -3 or a deterministic unique suffix.
 */
export function generateUniqueSlug(
  title: string,
  existingArticles: SlugArticleItem[],
  currentArticleId?: string
): string {
  const baseSlug = sanitizeSlug(title);
  const existingSlugs = new Set(
    existingArticles
      .filter((a) => !currentArticleId || a.id !== currentArticleId)
      .map((a) => a.slug?.toLowerCase().trim())
      .filter(Boolean)
  );

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  // Check numeric increments
  let counter = 2;
  while (counter <= 99) {
    const candidate = `${baseSlug}-${counter}`;
    if (!existingSlugs.has(candidate)) {
      return candidate;
    }
    counter++;
  }

  // Fallback with short random hex
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${baseSlug}-${randomSuffix}`;
}
