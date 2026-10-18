import React, { useState } from 'react';
import { Code, Save, Check, Palette, FileCode } from 'lucide-react';
import { CustomCodeConfig } from '../../types';

interface CustomCodeManagerProps {
  config: CustomCodeConfig;
  onSaveConfig: (cfg: CustomCodeConfig) => void;
}

export const CustomCodeManager: React.FC<CustomCodeManagerProps> = ({
  config,
  onSaveConfig,
}) => {
  const [form, setForm] = useState<CustomCodeConfig>({ ...config });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'css' | 'head' | 'header' | 'article' | 'footer'>('css');

  React.useEffect(() => {
    setForm({ ...config });
  }, [config]);

  const handleSave = () => {
    onSaveConfig(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleInsertSampleCss = () => {
    const sample = `/* Custom Editorial Font & Color Overrides */
:root {
  --font-serif: "Playfair Display", Georgia, serif;
}

/* Custom Headline Hover Accent */
h1:hover, h2:hover {
  color: #7f1d1d !important;
  transition: color 0.3s ease;
}

/* Subtle article drop shadow */
article {
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}`;
    setForm({ ...form, customCss: sample });
  };

  const handleInsertSampleGtag = () => {
    const sample = `<!-- Google Tag Manager / Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>

<!-- Google AdSense Site Verification Meta -->
<meta name="google-adsense-account" content="ca-pub-XXXXXXXXXXXXXXXX">`;
    setForm({ ...form, headHtml: sample });
  };

  const handleInsertSampleNewsletter = () => {
    const sample = `<!-- Custom Post-Article Editorial Newsletter Box -->
<div style="margin: 2.5rem 0; padding: 1.5rem; background-color: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 4px; text-align: center;">
  <h3 style="font-family: serif; font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem; color: #1c1917;">Subscribe to the Morning Dispatch</h3>
  <p style="font-size: 0.85rem; color: #57534e; margin-bottom: 1rem;">Get Pulitzer-grade global reporting and market intelligence delivered directly to your inbox at 06:00 UTC.</p>
  <form onsubmit="alert('Thank you for subscribing to Global 24x7!'); return false;" style="display: flex; gap: 0.5rem; max-width: 420px; margin: 0 auto;">
    <input type="email" placeholder="Enter your email address" required style="flex: 1; padding: 0.5rem 0.75rem; font-size: 0.85rem; border: 1px solid #d6d3d1; border-radius: 4px;" />
    <button type="submit" style="padding: 0.5rem 1rem; background-color: #1c1917; color: #ffffff; font-size: 0.85rem; font-weight: 600; border: none; border-radius: 4px; cursor: pointer;">Subscribe</button>
  </form>
</div>`;
    setForm({ ...form, afterArticleHtml: sample });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-stone-800" />
          <div>
            <h3 className="text-base font-bold font-editorial-serif text-stone-900">
              Custom HTML & CSS Code Injection Suite
            </h3>
            <p className="text-xs text-stone-500 font-mono">
              Inject custom CSS styles, Google Analytics/Tag Manager, newsletter widgets, and tracking pixels
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {saved ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saved ? 'Saved & Injected Live' : 'Save Custom Code'}</span>
        </button>
      </div>

      <div className="flex items-center gap-1 bg-stone-100 p-1 rounded overflow-x-auto">
        {[
          { id: 'css', label: 'Custom CSS Overrides', icon: Palette },
          { id: 'head', label: '<head> HTML & Analytics', icon: FileCode },
          { id: 'header', label: 'Top Banner HTML', icon: Code },
          { id: 'article', label: 'Post-Article HTML Widget', icon: Code },
          { id: 'footer', label: 'Footer HTML', icon: Code },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                active ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'css' && (
        <div className="bg-white border border-stone-200 rounded p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div>
              <span className="font-mono text-xs font-bold uppercase text-stone-800">
                Custom CSS Stylesheet
              </span>
              <p className="text-[11px] text-stone-500 font-mono">
                Applied directly to the document head across all public and article pages
              </p>
            </div>
            <button
              type="button"
              onClick={handleInsertSampleCss}
              className="text-xs font-mono text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              Load Sample CSS
            </button>
          </div>
          <textarea
            rows={12}
            value={form.customCss}
            onChange={(e) => setForm({ ...form, customCss: e.target.value })}
            placeholder="/* Enter custom CSS rules here */"
            className="w-full p-3 text-xs font-mono bg-stone-950 text-stone-100 rounded focus:outline-none focus:ring-1 focus:ring-stone-500 leading-relaxed"
          />
        </div>
      )}

      {activeTab === 'head' && (
        <div className="bg-white border border-stone-200 rounded p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div>
              <span className="font-mono text-xs font-bold uppercase text-stone-800">
                &lt;head&gt; HTML Code Injection
              </span>
              <p className="text-[11px] text-stone-500 font-mono">
                Ideal for Google Tag Manager, Google Analytics 4, AdSense verification tags, or custom meta tags
              </p>
            </div>
            <button
              type="button"
              onClick={handleInsertSampleGtag}
              className="text-xs font-mono text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              Load Sample Analytics Tag
            </button>
          </div>
          <textarea
            rows={12}
            value={form.headHtml}
            onChange={(e) => setForm({ ...form, headHtml: e.target.value })}
            placeholder="<!-- Paste <script>, <meta>, or <link> tags here -->"
            className="w-full p-3 text-xs font-mono bg-stone-900 text-stone-100 rounded focus:outline-none focus:ring-1 focus:ring-stone-500 leading-relaxed"
          />
        </div>
      )}

      {activeTab === 'header' && (
        <div className="bg-white border border-stone-200 rounded p-5 shadow-xs space-y-3">
          <div className="border-b border-stone-100 pb-2">
            <span className="font-mono text-xs font-bold uppercase text-stone-800">
              Top of Page / Header Announcement Bar HTML
            </span>
            <p className="text-[11px] text-stone-500 font-mono">
              Rendered directly above the navigation bar (e.g. urgent announcements or sponsored banner)
            </p>
          </div>
          <textarea
            rows={8}
            value={form.headerHtml}
            onChange={(e) => setForm({ ...form, headerHtml: e.target.value })}
            placeholder="<!-- Optional custom HTML for top header alert bar -->"
            className="w-full p-3 text-xs font-mono bg-stone-900 text-stone-100 rounded focus:outline-none focus:ring-1 focus:ring-stone-500 leading-relaxed"
          />
        </div>
      )}

      {activeTab === 'article' && (
        <div className="bg-white border border-stone-200 rounded p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div>
              <span className="font-mono text-xs font-bold uppercase text-stone-800">
                Post-Article HTML Content Block
              </span>
              <p className="text-[11px] text-stone-500 font-mono">
                Rendered at the conclusion of every article, before social sharing and related stories
              </p>
            </div>
            <button
              type="button"
              onClick={handleInsertSampleNewsletter}
              className="text-xs font-mono text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              Load Sample Newsletter Form
            </button>
          </div>
          <textarea
            rows={10}
            value={form.afterArticleHtml}
            onChange={(e) => setForm({ ...form, afterArticleHtml: e.target.value })}
            placeholder="<!-- Enter custom HTML e.g. newsletter subscribe box or author credentials -->"
            className="w-full p-3 text-xs font-mono bg-stone-900 text-stone-100 rounded focus:outline-none focus:ring-1 focus:ring-stone-500 leading-relaxed"
          />
        </div>
      )}

      {activeTab === 'footer' && (
        <div className="bg-white border border-stone-200 rounded p-5 shadow-xs space-y-3">
          <div className="border-b border-stone-100 pb-2">
            <span className="font-mono text-xs font-bold uppercase text-stone-800">
              Custom Footer HTML
            </span>
            <p className="text-[11px] text-stone-500 font-mono">
              Injected above the copyright line in the site footer
            </p>
          </div>
          <textarea
            rows={8}
            value={form.footerHtml}
            onChange={(e) => setForm({ ...form, footerHtml: e.target.value })}
            placeholder="<!-- Enter custom footer HTML -->"
            className="w-full p-3 text-xs font-mono bg-stone-900 text-stone-100 rounded focus:outline-none focus:ring-1 focus:ring-stone-500 leading-relaxed"
          />
        </div>
      )}
    </div>
  );
};
