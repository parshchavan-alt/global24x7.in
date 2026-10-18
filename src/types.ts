export type NewsCategory = string;

export interface CustomCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  accentColor?: string;
  isSystem?: boolean;
}

export interface ImageAttribution {
  photographer: string;
  source: string;
  license: string;
  originalUrl?: string;
}

export interface ArticleTranslation {
  title: string;
  summary: string;
  content: string;
  keyTakeaways: string[];
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  keyTakeaways: string[];
  category: string;
  tags: string[];
  author: {
    name: string;
    title: string;
    avatar?: string;
  };
  publishedAt: string; // ISO
  readingTimeMinutes: number;
  status: 'published' | 'draft' | 'archived';
  featuredRank: 1 | 2 | 3; // 1 = Lead, 2 = Secondary, 3 = Column
  imageUrl: string;
  imageCaption: string;
  imageCredit: ImageAttribution;
  language: 'en' | 'hi';
  translations?: Record<string, ArticleTranslation>;
  viewsCount: number;
  likesCount: number;
  seo: {
    metaTitle: string;
    metaDescription: string;
    focusKeywords: string[];
  };
  isEvergreen?: boolean;
}

export type GeminiModel =
  | 'gemini-3.8-flash'
  | 'gemini-3.1-flash-lite'
  | 'gemini-flash-latest';

export interface AIFineTuningConfig {
  selectedModel: GeminiModel;
  writingPersona: 'investigative' | 'analytical' | 'dispatch' | 'essayist';
  toneFormality: number; // 1 to 5
  depthLevel: number; // 1 to 5
  neutralityLevel: number; // 1 to 5
  targetWordCount: number; // 500, 800, 1200, 1600
  includeTakeaways: boolean;
  includeHistoricalContext: boolean;
  includeExpertQuotes: boolean;
  customSystemDirectives: string;
}

export interface KeyPoolAccount {
  id?: string;
  index: number;
  label: string;
  maskedKey: string;
  status: 'active' | 'exhausted' | 'standby' | 'not_configured';
  requestsHandled: number;
  lastUsedTimestamp?: string;
  lastError?: string;
}

export interface KeyPoolTelemetry {
  totalKeysConfigured: number;
  activeKeyIndex: number;
  totalRotations: number;
  accounts: KeyPoolAccount[];
}

export type TopicMixStrategy = 'balanced' | 'breaking_trending' | 'evergreen_pillars';

export interface SchedulerExecutionLog {
  id: string;
  timestamp: string;
  category: string;
  title: string;
  status: string;
  topicType: 'breaking' | 'evergreen';
  language: 'en' | 'hi';
  modelUsed?: string;
  articleId?: string;
}

export interface SchedulerConfig {
  enabled: boolean;
  frequencyMinutes: number; // 15, 30, 60, 120, 240, 360, etc.
  naturalJitter: boolean; // Randomize ±10% for human-like editorial cadence
  topicStrategy: TopicMixStrategy; // 'balanced' (50/50), 'breaking_trending', 'evergreen_pillars'
  categoriesInRotation: string[];
  autoPublish: boolean; // true = publish directly, false = hold in draft queue
  languageMode: 'both' | 'en_only' | 'hi_only'; // Generate both editions or specific
  lastRunTimestamp?: string;
  nextRunTimestamp?: string;
  articlesGeneratedCount: number;
}

export interface AdSenseConfig {
  enabled: boolean;
  publisherId: string; // ca-pub-XXXXX
  topBannerActive: boolean;
  inArticleActive: boolean;
  sidebarActive: boolean;
  stickyFooterActive: boolean;
  testMode: boolean;
}

export interface CustomCodeConfig {
  customCss: string;
  headHtml: string;
  headerHtml: string;
  afterArticleHtml: string;
  footerHtml: string;
}

export interface SecurityAuditItem {
  id: string;
  timestamp: string;
  action: string;
  ipMasked: string;
  status: 'success' | 'warning' | 'alert';
  details: string;
}

export type SupportedLanguage = 'en' | 'hi';

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  localName: string;
  dir?: 'ltr' | 'rtl';
}

export interface FooterLink {
  id: string;
  label: string;
  url: string;
}

export interface SocialLinks {
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
  telegram?: string;
}

export interface SiteBrandingConfig {
  siteName: string;
  tagline: string;
  editionText: string;
  siteUrl?: string; // Canonical domain e.g. https://www.global24x7.in
  logoUrl?: string;
  aboutText: string;
  copyrightText: string;
  complianceNotice: string;
  attributionNotice: string;
  socialLinks: SocialLinks;
  footerLinks: FooterLink[];
}

export const DEFAULT_BRANDING: SiteBrandingConfig = {
  siteName: 'Global 24x7',
  tagline: 'Continuous World News, In-Depth Dispatches & Evergreen Market Intelligence',
  editionText: 'Global 24x7 Digital Edition • 24/7 Live Feed',
  siteUrl: '',
  logoUrl: '',
  aboutText:
    'Global 24x7 is an independent, 24-hour international digital broadsheet delivering rigorous reporting, investigative analysis, and timeless guides across Technology, Economy, Science, and World Affairs.',
  copyrightText: '© 2026 Global 24x7 News Network. All rights reserved.',
  complianceNotice: 'Google AdSense & Schema.org Compliant Broadsheet Architecture',
  attributionNotice: 'Photography pre-cleared via Unsplash & NASA Public Domain with SEO metadata',
  socialLinks: {
    twitter: 'https://twitter.com',
    facebook: 'https://facebook.com',
    linkedin: 'https://linkedin.com',
    youtube: '',
    telegram: '',
  },
  footerLinks: [
    { id: 'fl-1', label: 'Editorial Guidelines', url: '/page/editorial-guidelines' },
    { id: 'fl-2', label: 'Privacy Policy', url: '/page/privacy-policy' },
    { id: 'fl-3', label: 'Terms of Service', url: '/page/terms-of-service' },
    { id: 'fl-4', label: 'Contact Bureau', url: '/page/contact-us' },
    { id: 'fl-5', label: 'About Global 24x7', url: '/page/about-us' },
  ],
};

// -------------------------------------------------------------
// MEDIA ASSET TYPES
// -------------------------------------------------------------
export interface MediaAsset {
  id: string;
  filename: string;
  originalUrl?: string;
  localPath: string; // e.g. /media/global24x7-technology-quantum-breakthrough.jpg
  seoAltText: string;
  seoTitle: string;
  category: string;
  fileSizeBytes: number;
  mimeType: string;
  width?: number;
  height?: number;
  uploadedAt: string;
  associatedArticleId?: string;
  isLocal?: boolean;
}

// -------------------------------------------------------------
// CUSTOM PAGES & NAVIGATION MENUS
// -------------------------------------------------------------
export interface CustomPage {
  id: string;
  slug: string; // e.g. 'privacy-policy', 'terms-of-service', 'about-us'
  title: string;
  content: string; // Markdown / HTML
  metaTitle: string;
  metaDescription: string;
  isSystem: boolean;
  published: boolean;
  updatedAt: string;
}

export interface NavigationMenuItem {
  id: string;
  label: string;
  url: string; // e.g. '/', '/hi', '/category/technology', '/page/about-us'
  targetBlank?: boolean;
  order: number;
}

export interface NavigationMenuConfig {
  headerMenu: NavigationMenuItem[];
  footerMenu: NavigationMenuItem[];
}
