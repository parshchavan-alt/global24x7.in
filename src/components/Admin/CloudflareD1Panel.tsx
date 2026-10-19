import React, { useState, useEffect } from 'react';
import { Database, Cloud, RefreshCw, Copy, Check, Server, ShieldCheck, AlertCircle, ArrowUpRight } from 'lucide-react';
import { safeFetchJson } from '../../utils/apiSafe';

export const CloudflareD1Panel: React.FC = () => {
  const [status, setStatus] = useState<{
    configured: boolean;
    accountIdSet: boolean;
    databaseIdSet: boolean;
    apiTokenSet: boolean;
  }>({
    configured: false,
    accountIdSet: false,
    databaseIdSet: false,
    apiTokenSet: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  const fetchD1Status = async () => {
    setIsLoading(true);
    try {
      const res = await safeFetchJson<{
        configured: boolean;
        accountIdSet: boolean;
        databaseIdSet: boolean;
        apiTokenSet: boolean;
      }>('/api/d1/status');
      if (res.ok && res.data) {
        setStatus(res.data);
      }
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => {
    fetchD1Status();
  }, []);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await safeFetchJson<{ success: boolean; message?: string; error?: string }>('/api/d1/sync-all', {
        method: 'POST',
      });
      if (res.ok && res.data?.success) {
        setSyncMessage(`✓ ${res.data.message || 'Synchronization to Cloudflare D1 initiated successfully.'}`);
      } else {
        setSyncMessage(`Notice: ${res.data?.error || res.error || 'Failed to sync to Cloudflare D1'}`);
      }
    } catch (err: any) {
      setSyncMessage(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreAll = async () => {
    if (!confirm('Restore all articles and custom settings from Cloudflare D1 database?')) return;
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await safeFetchJson<{
        success: boolean;
        restoredArticlesCount?: number;
        message?: string;
        error?: string;
      }>('/api/d1/restore-all', {
        method: 'POST',
      });
      if (res.ok && res.data?.success) {
        setSyncMessage(`✓ ${res.data.message || 'Restored from Cloudflare D1 successfully.'} Refreshing portal...`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setSyncMessage(`Notice: ${res.data?.error || res.error || 'Could not restore from Cloudflare D1'}`);
      }
    } catch (err: any) {
      setSyncMessage(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const schemaSql = `-- Cloudflare D1 Schema for Global 24x7
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

CREATE TABLE IF NOT EXISTS custom_code (
  id TEXT PRIMARY KEY,
  custom_css TEXT,
  head_html TEXT,
  header_html TEXT,
  after_article_html TEXT,
  footer_html TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branding (
  id TEXT PRIMARY KEY,
  site_name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  site_url TEXT,
  logo_url TEXT,
  compliance_notice TEXT,
  copyright_text TEXT,
  social_links_json TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

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
);`;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(schemaSql);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-orange-600" />
            <h3 className="text-base font-bold font-editorial-serif text-stone-900">
              Cloudflare D1 Database & Persistent Storage
            </h3>
          </div>
          <p className="text-xs text-stone-500 font-mono mt-0.5">
            Distributed serverless SQL database ensuring zero data loss across Render free tier container restarts
          </p>
        </div>
        <button
          onClick={fetchD1Status}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono rounded transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Connection Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`p-4 rounded border flex items-start gap-3 ${
            status.configured
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-amber-50/80 border-amber-200 text-amber-950'
          }`}
        >
          {status.configured ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-bold text-xs font-mono uppercase">
              {status.configured ? 'D1 Database Connected' : 'Local Disk & Cache Mode'}
            </div>
            <p className="text-[11px] mt-1 text-stone-600 leading-relaxed">
              {status.configured
                ? 'Your website is actively connected to Cloudflare D1. All articles, custom HTML/CSS, and settings are synced to edge storage.'
                : 'Articles and settings are preserved in local browser storage and local disk. Configure Cloudflare D1 for hardware-level database persistence.'}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-stone-200 rounded shadow-xs md:col-span-2 space-y-3">
          <span className="font-mono text-xs font-bold uppercase text-stone-800 block">
            Environment Variables Status (Render / Cloud Host)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2 bg-stone-50 rounded border border-stone-200 flex flex-col">
              <span className="text-[10px] text-stone-400">CLOUDFLARE_ACCOUNT_ID</span>
              <span className={`font-bold mt-1 ${status.accountIdSet ? 'text-emerald-700' : 'text-stone-400'}`}>
                {status.accountIdSet ? '✓ Configured' : '— Not Set'}
              </span>
            </div>
            <div className="p-2 bg-stone-50 rounded border border-stone-200 flex flex-col">
              <span className="text-[10px] text-stone-400">CLOUDFLARE_D1_DATABASE_ID</span>
              <span className={`font-bold mt-1 ${status.databaseIdSet ? 'text-emerald-700' : 'text-stone-400'}`}>
                {status.databaseIdSet ? '✓ Configured' : '— Not Set'}
              </span>
            </div>
            <div className="p-2 bg-stone-50 rounded border border-stone-200 flex flex-col">
              <span className="text-[10px] text-stone-400">CLOUDFLARE_API_TOKEN</span>
              <span className={`font-bold mt-1 ${status.apiTokenSet ? 'text-emerald-700' : 'text-stone-400'}`}>
                {status.apiTokenSet ? '✓ Configured' : '— Not Set'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Sync Actions */}
      <div className="p-5 bg-white border border-stone-200 rounded shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-mono font-bold uppercase text-stone-800">
              Synchronize Newsroom to Cloudflare D1
            </h4>
            <p className="text-[11px] text-stone-500 font-mono mt-0.5">
              Sync runs asynchronously in background with zero delay on website visitor page loads
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncAll}
              disabled={isSyncing || !status.configured}
              className="px-3.5 py-1.5 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync All to D1</span>
            </button>
            <button
              onClick={handleRestoreAll}
              disabled={isSyncing || !status.configured}
              className="px-3.5 py-1.5 bg-stone-100 border border-stone-300 text-stone-800 rounded text-xs font-semibold hover:bg-stone-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Restore from D1
            </button>
          </div>
        </div>

        {syncMessage && (
          <div className="p-3 bg-stone-100 border border-stone-300 rounded text-xs font-mono text-stone-800">
            {syncMessage}
          </div>
        )}
      </div>

      {/* Render Setup Guide */}
      <div className="p-5 bg-stone-50 border border-stone-200 rounded space-y-3">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-stone-800">
          <Server className="w-4 h-4 text-stone-700" />
          <span>Recommended Environment Variables for Render (Permanent Reboot Immunity)</span>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">
          Because Render free instances spin down after 15 minutes of inactivity, adding these environment variables in your <strong>Render Dashboard &gt; Environment</strong> ensures your master password, monetization, and D1 database never reset:
        </p>
        <div className="divide-y divide-stone-200 text-xs font-mono">
          <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="font-bold text-stone-900">ADMIN_PASSCODE</span>
            <span className="text-stone-500">Your chosen custom master passcode (e.g. <code>MySecretPass2026!</code>)</span>
          </div>
          <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="font-bold text-stone-900">ADSENSE_ENABLED</span>
            <span className="text-stone-500">Set to <code>false</code> to permanently disable all ads</span>
          </div>
          <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="font-bold text-stone-900">CLOUDFLARE_D1_DATABASE_ID</span>
            <span className="text-stone-500">UUID of your Cloudflare D1 database (from Cloudflare dashboard)</span>
          </div>
          <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="font-bold text-stone-900">CLOUDFLARE_ACCOUNT_ID</span>
            <span className="text-stone-500">Your 32-character Cloudflare Account ID</span>
          </div>
          <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="font-bold text-stone-900">CLOUDFLARE_API_TOKEN</span>
            <span className="text-stone-500">API Token with <code>D1:Edit</code> permissions</span>
          </div>
        </div>
      </div>

      {/* SQL Migration Script Copy Box */}
      <div className="p-5 bg-white border border-stone-200 rounded shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-stone-700" />
            <span className="font-mono text-xs font-bold uppercase text-stone-800">
              Cloudflare D1 SQL Schema (<code>migrations/0001_d1_schema.sql</code>)
            </span>
          </div>
          <button
            onClick={handleCopySchema}
            className="flex items-center gap-1.5 px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-mono transition-colors cursor-pointer"
          >
            {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSchema ? 'Copied to Clipboard!' : 'Copy Schema SQL'}</span>
          </button>
        </div>
        <p className="text-[11px] text-stone-500 font-mono">
          Paste this SQL into your Cloudflare Dashboard &gt; Workers &amp; Pages &gt; D1 &gt; Console, or execute via <code>npx wrangler d1 execute &lt;db_name&gt; --file=migrations/0001_d1_schema.sql</code>.
        </p>
        <pre className="p-3 bg-stone-900 text-stone-200 rounded text-[11px] font-mono overflow-x-auto max-h-48">
          {schemaSql}
        </pre>
      </div>
    </div>
  );
};
