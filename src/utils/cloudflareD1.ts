/**
 * Cloudflare D1 Database REST Client & Synchronization Engine
 * Operates completely asynchronously in background:
 * - Zero latency impact on client browsing or page loading
 * - Synchronizes all articles, settings, custom code, and credentials across server restarts
 */

import { Article, CustomCategory, CustomCodeConfig, SiteBrandingConfig, AdSenseConfig } from '../types';

export interface CloudflareD1Config {
  accountId?: string;
  databaseId?: string;
  apiToken?: string;
}

export function getD1Config(): CloudflareD1Config {
  // Check Node environment variables first, then browser env fallback
  const accountId =
    (typeof process !== 'undefined' && process.env?.CLOUDFLARE_ACCOUNT_ID) ||
    (typeof process !== 'undefined' && process.env?.CF_ACCOUNT_ID) ||
    '';
  const databaseId =
    (typeof process !== 'undefined' && process.env?.CLOUDFLARE_D1_DATABASE_ID) ||
    (typeof process !== 'undefined' && process.env?.CF_D1_DATABASE_ID) ||
    '';
  const apiToken =
    (typeof process !== 'undefined' && process.env?.CLOUDFLARE_API_TOKEN) ||
    (typeof process !== 'undefined' && process.env?.CF_API_TOKEN) ||
    '';

  return { accountId, databaseId, apiToken };
}

export function isD1Configured(): boolean {
  const cfg = getD1Config();
  return Boolean(cfg.accountId && cfg.databaseId && cfg.apiToken);
}

/**
 * Executes a single SQL query against Cloudflare D1 HTTP API
 */
export async function queryD1<T = any>(
  sql: string,
  params: any[] = []
): Promise<{ success: boolean; results?: T[]; error?: string }> {
  const cfg = getD1Config();
  if (!cfg.accountId || !cfg.databaseId || !cfg.apiToken) {
    return { success: false, error: 'Cloudflare D1 credentials not configured in environment' };
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${cfg.accountId}/d1/database/${cfg.databaseId}/query`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      const err = data.errors?.[0]?.message || `HTTP ${res.status} from Cloudflare D1`;
      return { success: false, error: err };
    }

    const firstResult = data.result?.[0];
    return {
      success: true,
      results: firstResult?.results || [],
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed connecting to Cloudflare D1' };
  }
}

/**
 * Asynchronously sync an article to Cloudflare D1 (Never blocks render or API response)
 */
export function queueD1ArticleSync(article: Article): void {
  if (!isD1Configured()) return;

  // Run in next tick / background
  setTimeout(async () => {
    try {
      const sql = `
        INSERT INTO articles (
          id, slug, title, summary, content, category, published_at,
          reading_time_minutes, status, featured_rank, image_url,
          image_caption, image_credit_json, tags_json, key_takeaways_json,
          author_json, language, views_count, likes_count, is_evergreen, seo_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          slug = excluded.slug,
          title = excluded.title,
          summary = excluded.summary,
          content = excluded.content,
          category = excluded.category,
          published_at = excluded.published_at,
          reading_time_minutes = excluded.reading_time_minutes,
          status = excluded.status,
          image_url = excluded.image_url,
          image_caption = excluded.image_caption,
          image_credit_json = excluded.image_credit_json,
          tags_json = excluded.tags_json,
          key_takeaways_json = excluded.key_takeaways_json,
          author_json = excluded.author_json,
          language = excluded.language,
          is_evergreen = excluded.is_evergreen,
          seo_json = excluded.seo_json,
          updated_at = CURRENT_TIMESTAMP;
      `;

      const params = [
        article.id,
        article.slug,
        article.title,
        article.summary,
        article.content,
        article.category,
        article.publishedAt,
        article.readingTimeMinutes || 4,
        article.status || 'published',
        article.featuredRank || 2,
        article.imageUrl,
        article.imageCaption || '',
        JSON.stringify(article.imageCredit || {}),
        JSON.stringify(article.tags || []),
        JSON.stringify(article.keyTakeaways || []),
        JSON.stringify(article.author || {}),
        article.language || 'en',
        article.viewsCount || 0,
        article.likesCount || 0,
        article.isEvergreen ? 1 : 0,
        JSON.stringify(article.seo || {}),
      ];

      await queryD1(sql, params);
    } catch (err) {
      console.warn('Cloudflare D1 background article sync warning:', err);
    }
  }, 10);
}

/**
 * Asynchronously sync custom code to Cloudflare D1
 */
export function queueD1CustomCodeSync(config: CustomCodeConfig): void {
  if (!isD1Configured()) return;

  setTimeout(async () => {
    try {
      const sql = `
        INSERT INTO custom_code (
          id, custom_css, head_html, header_html, after_article_html, footer_html, updated_at
        ) VALUES ('global_custom_code', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          custom_css = excluded.custom_css,
          head_html = excluded.head_html,
          header_html = excluded.header_html,
          after_article_html = excluded.after_article_html,
          footer_html = excluded.footer_html,
          updated_at = CURRENT_TIMESTAMP;
      `;
      await queryD1(sql, [
        config.customCss || '',
        config.headHtml || '',
        config.headerHtml || '',
        config.afterArticleHtml || '',
        config.footerHtml || '',
      ]);
    } catch (err) {
      console.warn('Cloudflare D1 custom code sync warning:', err);
    }
  }, 10);
}

/**
 * Asynchronously sync branding to Cloudflare D1
 */
export function queueD1BrandingSync(branding: SiteBrandingConfig): void {
  if (!isD1Configured()) return;

  setTimeout(async () => {
    try {
      const sql = `
        INSERT INTO branding (
          id, site_name, tagline, description, site_url, logo_url,
          compliance_notice, copyright_text, attribution_notice,
          social_links_json, footer_links_json, updated_at
        ) VALUES ('global_branding', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          site_name = excluded.site_name,
          tagline = excluded.tagline,
          description = excluded.description,
          site_url = excluded.site_url,
          logo_url = excluded.logo_url,
          compliance_notice = excluded.compliance_notice,
          copyright_text = excluded.copyright_text,
          attribution_notice = excluded.attribution_notice,
          social_links_json = excluded.social_links_json,
          footer_links_json = excluded.footer_links_json,
          updated_at = CURRENT_TIMESTAMP;
      `;
      await queryD1(sql, [
        branding.siteName,
        branding.tagline || '',
        branding.aboutText || '',
        branding.siteUrl || '',
        branding.logoUrl || '',
        branding.complianceNotice || '',
        branding.copyrightText || '',
        branding.attributionNotice || '',
        JSON.stringify(branding.socialLinks || {}),
        JSON.stringify(branding.footerLinks || []),
      ]);
    } catch (err) {
      console.warn('Cloudflare D1 branding sync warning:', err);
    }
  }, 10);
}

/**
 * Asynchronously sync AdSense settings to Cloudflare D1
 */
export function queueD1AdSenseSync(config: AdSenseConfig): void {
  if (!isD1Configured()) return;

  setTimeout(async () => {
    try {
      const sql = `
        INSERT INTO adsense_settings (
          id, enabled, publisher_id, top_banner_active, in_article_active,
          sidebar_active, sticky_footer_active, test_mode, updated_at
        ) VALUES ('global_adsense', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          enabled = excluded.enabled,
          publisher_id = excluded.publisher_id,
          top_banner_active = excluded.top_banner_active,
          in_article_active = excluded.in_article_active,
          sidebar_active = excluded.sidebar_active,
          sticky_footer_active = excluded.sticky_footer_active,
          test_mode = excluded.test_mode,
          updated_at = CURRENT_TIMESTAMP;
      `;
      await queryD1(sql, [
        config.enabled ? 1 : 0,
        config.publisherId || '',
        config.topBannerActive ? 1 : 0,
        config.inArticleActive ? 1 : 0,
        config.sidebarActive ? 1 : 0,
        config.stickyFooterActive ? 1 : 0,
        config.testMode ? 1 : 0,
      ]);
    } catch (err) {
      console.warn('Cloudflare D1 adsense sync warning:', err);
    }
  }, 10);
}

/**
 * Fetches all saved articles from Cloudflare D1
 */
export async function loadArticlesFromD1(): Promise<Article[] | null> {
  if (!isD1Configured()) return null;

  try {
    const res = await queryD1<any>('SELECT * FROM articles ORDER BY published_at DESC LIMIT 500;');
    if (!res.success || !res.results || res.results.length === 0) return null;

    return res.results.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      content: row.content,
      category: row.category,
      publishedAt: row.published_at,
      readingTimeMinutes: row.reading_time_minutes,
      status: row.status,
      featuredRank: row.featured_rank,
      imageUrl: row.image_url,
      imageCaption: row.image_caption,
      imageCredit: safeJson(row.image_credit_json, {}),
      tags: safeJson(row.tags_json, []),
      keyTakeaways: safeJson(row.key_takeaways_json, []),
      author: safeJson(row.author_json, { name: 'Editorial Desk', title: 'Senior Correspondent' }),
      language: row.language || 'en',
      viewsCount: row.views_count || 0,
      likesCount: row.likes_count || 0,
      isEvergreen: Boolean(row.is_evergreen),
      seo: safeJson(row.seo_json, {}),
    }));
  } catch (err) {
    console.warn('Failed loading articles from D1:', err);
    return null;
  }
}

function safeJson(val: any, fallback: any) {
  if (!val || typeof val !== 'string') return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}
