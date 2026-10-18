import React, { useEffect } from 'react';
import { ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import { CustomPage, SiteBrandingConfig } from '../types';

interface CustomPageViewProps {
  page: CustomPage;
  onBack: () => void;
  branding?: SiteBrandingConfig;
}

export const CustomPageView: React.FC<CustomPageViewProps> = ({ page, onBack, branding }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = `${page.metaTitle || page.title} | ${branding?.siteName || 'Global 24x7'}`;
  }, [page, branding]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-stone-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Front Page</span>
        </button>
        <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Article Body Container */}
      <article className="space-y-6">
        <header className="space-y-3 pb-6 border-b border-stone-200">
          <div className="text-[11px] font-mono uppercase tracking-widest text-stone-500">
            {branding?.siteName || 'Global 24x7'} • Information Bureau
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-editorial-serif text-stone-900 leading-tight">
            {page.title}
          </h1>
          {page.metaDescription && (
            <p className="text-base text-stone-600 font-sans leading-relaxed">
              {page.metaDescription}
            </p>
          )}
        </header>

        {/* Markdown Rendered Content */}
        <div className="prose prose-stone max-w-none text-stone-800 leading-relaxed space-y-4 font-sans text-sm sm:text-base">
          {page.content.split('\n\n').map((paragraph, idx) => {
            const p = paragraph.trim();
            if (p.startsWith('# ')) {
              return null; // Skip duplicate h1
            }
            if (p.startsWith('## ')) {
              return (
                <h2
                  key={idx}
                  className="text-xl font-bold font-editorial-serif text-stone-900 pt-4 pb-1 border-b border-stone-100"
                >
                  {p.replace('## ', '')}
                </h2>
              );
            }
            if (p.startsWith('### ')) {
              return (
                <h3
                  key={idx}
                  className="text-base font-bold font-editorial-serif text-stone-900 pt-3"
                >
                  {p.replace('### ', '')}
                </h3>
              );
            }
            if (p.startsWith('- ')) {
              const items = p.split('\n').map((line) => line.replace(/^- /, ''));
              return (
                <ul key={idx} className="list-disc pl-5 space-y-1 text-stone-700">
                  {items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={idx} className="leading-relaxed">
                {p}
              </p>
            );
          })}
        </div>

        {/* Footer Guarantee */}
        <div className="pt-8 mt-10 border-t border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-stone-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Official Policy & Operational Document • Global 24x7 Publishing Network</span>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 cursor-pointer"
          >
            Return to Newsroom
          </button>
        </div>
      </article>
    </div>
  );
};
