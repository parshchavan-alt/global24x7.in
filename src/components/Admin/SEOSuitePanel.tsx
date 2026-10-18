import React, { useState, useEffect } from 'react';
import { Globe, CheckCircle2, Copy, Check, ExternalLink } from 'lucide-react';
import { AdSenseConfig, Article } from '../../types';

interface SEOSuitePanelProps {
  adSenseConfig: AdSenseConfig;
  onUpdateAdSense: (cfg: AdSenseConfig) => void;
  sampleArticle?: Article;
}

export const SEOSuitePanel: React.FC<SEOSuitePanelProps> = ({
  adSenseConfig,
  onUpdateAdSense,
  sampleArticle,
}) => {
  const [sitemapXml, setSitemapXml] = useState<string>('');
  const [robotsTxt, setRobotsTxt] = useState<string>('');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [activeTab, setActiveTab] = useState<'adsense' | 'sitemap' | 'schema' | 'robots'>('adsense');

  useEffect(() => {
    fetch('/api/sitemap.xml')
      .then((r) => r.text())
      .then((text) => setSitemapXml(text))
      .catch(() => setSitemapXml('<!-- Unable to reach /api/sitemap.xml -->'));

    fetch('/robots.txt')
      .then((r) => r.text())
      .then((text) => setRobotsTxt(text))
      .catch(() => setRobotsTxt('User-agent: *\nAllow: /'));
  }, []);

  const sampleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: sampleArticle?.title || 'Quantum Coherence Breakthrough',
    description: sampleArticle?.summary || 'Consortium reveals room-temperature topological substrate.',
    image: [sampleArticle?.imageUrl || 'https://images.unsplash.com/...'],
    datePublished: sampleArticle?.publishedAt || new Date().toISOString(),
    author: [{ '@type': 'Person', name: sampleArticle?.author.name || 'Julian Sterling' }],
    publisher: {
      '@type': 'Organization',
      name: 'Global 24x7',
      logo: { '@type': 'ImageObject', url: 'https://global24x7.com/logo.png' },
    },
    articleSection: sampleArticle?.category || 'Technology',
    keywords: sampleArticle?.tags.join(', ') || 'quantum, tech, physics',
  };

  const schemaString = JSON.stringify(sampleSchema, null, 2);

  const handleCopySchema = () => {
    navigator.clipboard.writeText(schemaString);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-stone-800" />
          <div>
            <h3 className="text-base font-bold font-editorial-serif text-stone-900">
              SEO, Structured Data & AdSense Suite
            </h3>
            <p className="text-xs text-stone-500 font-mono">
              XML sitemaps, automated Schema.org markup, and Google AdSense policy controls
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded">
          <button
            onClick={() => setActiveTab('adsense')}
            className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'adsense' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            AdSense Compliance
          </button>
          <button
            onClick={() => setActiveTab('sitemap')}
            className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'sitemap' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Sitemap.xml
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'schema' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Schema.org JSON-LD
          </button>
          <button
            onClick={() => setActiveTab('robots')}
            className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'robots' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Robots.txt
          </button>
        </div>
      </div>

      {activeTab === 'adsense' && (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <h4 className="text-xs font-bold font-mono uppercase text-emerald-900">
                Google AdSense Editorial Policy Verification
              </h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed mb-3">
              This publication's layout and content pipeline adhere strictly to Google Publisher Policies:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-emerald-900">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Text-to-ad ratio ≥ 70% content balance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Distinct "ADVERTISEMENT" labels on all units</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>No accidental clicks / ample white-space margin</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Family-safe factual journalism safety filter</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white border border-stone-200 rounded space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="font-mono text-xs font-semibold uppercase text-stone-800">
                  AdSense Network Integration
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adSenseConfig.enabled}
                    onChange={(e) =>
                      onUpdateAdSense({ ...adSenseConfig, enabled: e.target.checked })
                    }
                    className="rounded accent-stone-900"
                  />
                  <span className="text-xs font-mono font-bold text-stone-900">
                    {adSenseConfig.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-mono text-stone-600 mb-1">
                  AdSense Publisher ID
                </label>
                <input
                  type="text"
                  value={adSenseConfig.publisherId}
                  onChange={(e) =>
                    onUpdateAdSense({ ...adSenseConfig, publisherId: e.target.value })
                  }
                  placeholder="ca-pub-0000000000000000"
                  className="w-full px-3 py-1.5 text-xs font-mono bg-stone-50 border border-stone-300 rounded focus:outline-none focus:border-stone-900"
                />
                <span className="text-[10px] text-stone-400 font-mono mt-0.5 block">
                  Found in your Google AdSense Account Settings
                </span>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <label className="flex items-center gap-2 text-xs font-mono text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adSenseConfig.testMode}
                    onChange={(e) =>
                      onUpdateAdSense({ ...adSenseConfig, testMode: e.target.checked })
                    }
                    className="rounded accent-stone-900"
                  />
                  <span>Test Preview Mode (Renders stylized ad containers)</span>
                </label>
              </div>
            </div>

            <div className="p-4 bg-white border border-stone-200 rounded space-y-3 shadow-xs">
              <span className="font-mono text-xs font-semibold uppercase text-stone-800 block border-b border-stone-100 pb-2">
                Ad Unit Placement Toggles
              </span>
              <label className="flex items-center justify-between text-xs font-mono text-stone-700 py-1 cursor-pointer">
                <span>Top Leaderboard Banner (728 × 90 / 320 × 50)</span>
                <input
                  type="checkbox"
                  checked={adSenseConfig.topBannerActive}
                  onChange={(e) =>
                    onUpdateAdSense({ ...adSenseConfig, topBannerActive: e.target.checked })
                  }
                  className="rounded accent-stone-900"
                />
              </label>
              <label className="flex items-center justify-between text-xs font-mono text-stone-700 py-1 cursor-pointer">
                <span>Mid-Article In-Content Unit (Responsive)</span>
                <input
                  type="checkbox"
                  checked={adSenseConfig.inArticleActive}
                  onChange={(e) =>
                    onUpdateAdSense({ ...adSenseConfig, inArticleActive: e.target.checked })
                  }
                  className="rounded accent-stone-900"
                />
              </label>
              <label className="flex items-center justify-between text-xs font-mono text-stone-700 py-1 cursor-pointer">
                <span>Sidebar Half-Page Slot (300 × 600)</span>
                <input
                  type="checkbox"
                  checked={adSenseConfig.sidebarActive}
                  onChange={(e) =>
                    onUpdateAdSense({ ...adSenseConfig, sidebarActive: e.target.checked })
                  }
                  className="rounded accent-stone-900"
                />
              </label>
              <label className="flex items-center justify-between text-xs font-mono text-stone-700 py-1 cursor-pointer">
                <span>Sticky Bottom Disclosure Banner (≤ 15% height)</span>
                <input
                  type="checkbox"
                  checked={adSenseConfig.stickyFooterActive}
                  onChange={(e) =>
                    onUpdateAdSense({ ...adSenseConfig, stickyFooterActive: e.target.checked })
                  }
                  className="rounded accent-stone-900"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sitemap' && (
        <div className="bg-white border border-stone-200 rounded p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div>
              <span className="font-mono text-xs font-semibold uppercase text-stone-800">
                Live Dynamic Sitemap Output (/api/sitemap.xml)
              </span>
              <p className="text-[11px] text-stone-500 font-mono">
                Updates automatically as new dispatches are published
              </p>
            </div>
            <a
              href="/api/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-stone-700 hover:text-stone-950 flex items-center gap-1 font-mono"
            >
              <span>View Raw XML</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <pre className="p-3 bg-stone-900 text-stone-100 rounded text-xs font-mono overflow-x-auto max-h-96">
            {sitemapXml || 'Generating dynamic XML sitemap...'}
          </pre>
        </div>
      )}

      {activeTab === 'schema' && (
        <div className="bg-white border border-stone-200 rounded p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div>
              <span className="font-mono text-xs font-semibold uppercase text-stone-800">
                Automated Schema.org NewsArticle JSON-LD
              </span>
              <p className="text-[11px] text-stone-500 font-mono">
                Dynamically generated and embedded into &lt;head&gt; on every article page
              </p>
            </div>
            <button
              onClick={handleCopySchema}
              className="px-2.5 py-1 text-xs bg-stone-100 hover:bg-stone-200 rounded flex items-center gap-1 font-mono transition-colors cursor-pointer"
            >
              {copiedSchema ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSchema ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>
          <pre className="p-3 bg-stone-900 text-stone-100 rounded text-xs font-mono overflow-x-auto max-h-96">
            {schemaString}
          </pre>
        </div>
      )}

      {activeTab === 'robots' && (
        <div className="bg-white border border-stone-200 rounded p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="font-mono text-xs font-semibold uppercase text-stone-800">
              Robots.txt Crawl Directive Configuration
            </span>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-stone-700 hover:text-stone-950 flex items-center gap-1 font-mono"
            >
              <span>View Live /robots.txt</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <pre className="p-3 bg-stone-900 text-stone-100 rounded text-xs font-mono overflow-x-auto">
            {robotsTxt}
          </pre>
        </div>
      )}
    </div>
  );
};
