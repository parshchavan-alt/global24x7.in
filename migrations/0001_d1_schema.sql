-- ====================================================================
-- Cloudflare D1 Database Schema for Global 24x7 Newsroom & Editorial
-- Run this migration in Cloudflare Console or via Wrangler:
-- npx wrangler d1 execute <DB_NAME> --file=migrations/0001_d1_schema.sql
-- ====================================================================

-- 1. Published & Draft Articles Table
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  published_at TEXT NOT NULL,
  reading_time_minutes INTEGER DEFAULT 4,
  status TEXT DEFAULT 'published',
  featured_rank INTEGER DEFAULT 2,
  image_url TEXT,
  image_caption TEXT,
  image_credit_json TEXT,
  tags_json TEXT,
  key_takeaways_json TEXT,
  author_json TEXT,
  language TEXT DEFAULT 'en',
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  is_evergreen INTEGER DEFAULT 0,
  seo_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);

-- 2. Custom HTML / CSS Code Injections
CREATE TABLE IF NOT EXISTS custom_code (
  id TEXT PRIMARY KEY,
  custom_css TEXT,
  head_html TEXT,
  header_html TEXT,
  after_article_html TEXT,
  footer_html TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. Site Branding & Canonical Configuration
CREATE TABLE IF NOT EXISTS branding (
  id TEXT PRIMARY KEY,
  site_name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  site_url TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT,
  accent_color TEXT,
  compliance_notice TEXT,
  copyright_text TEXT,
  attribution_notice TEXT,
  contact_email TEXT,
  contact_address TEXT,
  social_links_json TEXT,
  header_links_json TEXT,
  footer_links_json TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 4. Dynamic News Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_system INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 5. Custom Broadsheet Pages
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  is_system INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 6. Google AdSense & Monetization Settings
CREATE TABLE IF NOT EXISTS adsense_settings (
  id TEXT PRIMARY KEY,
  enabled INTEGER DEFAULT 0,
  publisher_id TEXT,
  top_banner_active INTEGER DEFAULT 1,
  in_article_active INTEGER DEFAULT 1,
  sidebar_active INTEGER DEFAULT 1,
  sticky_footer_active INTEGER DEFAULT 1,
  test_mode INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 7. Autonomous Scheduler & AI Fine-Tuning Settings
CREATE TABLE IF NOT EXISTS scheduler_settings (
  id TEXT PRIMARY KEY,
  config_json TEXT NOT NULL,
  fine_tuning_json TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 8. Master Security & Auth Configuration
CREATE TABLE IF NOT EXISTS auth_settings (
  id TEXT PRIMARY KEY,
  passcode_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
