import React, { useState } from 'react';
import { Clock, Eye, ChevronRight, Newspaper, Bookmark, Sparkles } from 'lucide-react';
import { Article, SupportedLanguage, CustomCategory, AdSenseConfig, SiteBrandingConfig } from '../types';
import { UI_TRANSLATIONS } from '../constants/languages';
import { AdSenseUnit } from './AdSenseUnit';

interface FrontPageProps {
  articles: Article[];
  categories: CustomCategory[];
  currentCategory: string;
  onSelectCategory: (cat: string) => void;
  currentLanguage: SupportedLanguage;
  onSelectArticle: (article: Article) => void;
  searchQuery: string;
  adSenseConfig: AdSenseConfig;
  branding?: SiteBrandingConfig;
}

export const FrontPage: React.FC<FrontPageProps> = ({
  articles,
  categories,
  currentCategory,
  onSelectCategory,
  currentLanguage,
  onSelectArticle,
  searchQuery,
  adSenseConfig,
  branding,
}) => {
  const t = UI_TRANSLATIONS[currentLanguage] || UI_TRANSLATIONS.en;
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const publishedArticles = articles.filter((a) => a.status === 'published');

  // Filter articles based on language, category, and search query
  const filtered = publishedArticles.filter((art) => {
    if (currentLanguage === 'hi') {
      const isHindiArticle = art.language === 'hi';
      const hasHindiTranslation = Boolean(art.translations?.hi);
      if (!isHindiArticle && !hasHindiTranslation) return false;
    } else {
      if (art.language === 'hi') return false;
    }

    const matchesCategory = currentCategory === 'All' || art.category === currentCategory;
    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = art.title.toLowerCase();
    const summary = art.summary.toLowerCase();
    const tags = art.tags.map((tg) => tg.toLowerCase()).join(' ');

    return title.includes(q) || summary.includes(q) || tags.includes(q);
  });

  const leadStory = filtered.find((a) => a.featuredRank === 1) || filtered[0];
  const secondaryStories = filtered.filter((a) => a.id !== leadStory?.id).slice(0, 2);
  const columnStories = filtered.filter(
    (a) => a.id !== leadStory?.id && !secondaryStories.some((s) => s.id === a.id)
  );

  const getLocalizedTitle = (art: Article) => {
    if (currentLanguage === 'hi') {
      if (art.language === 'hi') return art.title;
      if (art.translations?.hi?.title) return art.translations.hi.title;
    }
    return art.title;
  };

  const getLocalizedSummary = (art: Article) => {
    if (currentLanguage === 'hi') {
      if (art.language === 'hi') return art.summary;
      if (art.translations?.hi?.summary) return art.translations.hi.summary;
    }
    return art.summary;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Front Page Broadsheet Masthead Banner */}
      <div className="text-center pb-6 border-b-2 border-stone-900 mb-8">
        <div className="text-xs uppercase tracking-widest text-stone-500 font-mono mb-2">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}{' '}
          • {branding?.editionText || 'Global 24x7 Digital Edition • 24/7 Live Feed'}
        </div>
        <h1 className="text-4xl sm:text-6xl font-editorial-serif font-black tracking-tight text-stone-950 uppercase">
          {branding?.siteName || 'Global 24x7'}
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 font-editorial-prose italic mt-1 max-w-2xl mx-auto">
          {branding?.tagline || t.brandMotto}
        </p>

        {/* Category Filter Bar (Segmented Controls) */}
        <div className="flex items-center justify-center gap-1 mt-6 flex-wrap">
          {['All', ...categories.map((c) => c.name)].map((cat) => {
            const active = currentCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
                  active
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                {cat === 'All' ? t.allCategories : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Ad */}
      <AdSenseUnit slot="leaderboard" config={adSenseConfig} />

      {/* Empty Search / Filter State */}
      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <Newspaper className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-stone-700">{t.noArticlesFound}</h3>
          <p className="text-xs text-stone-500 mt-1">
            {currentLanguage === 'hi'
              ? 'कृपया "All News" चुनें या नई सामग्री प्रकाशित करें।'
              : 'Try switching categories or clearing your search term.'}
          </p>
        </div>
      )}

      {/* Tier 1 & Tier 2: Broadsheet Hero Split Grid */}
      {leadStory && (
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-10 border-b border-stone-200">
            {/* Lead Story (7 Cols on Desktop) */}
            <article
              onClick={() => onSelectArticle(leadStory)}
              className="lg:col-span-7 group cursor-pointer flex flex-col"
            >
              <div className="overflow-hidden rounded-sm bg-stone-100 border border-stone-200 mb-4 relative aspect-[16/10]">
                {!imageErrors[leadStory.id] ? (
                  <img
                    src={leadStory.imageUrl}
                    alt={leadStory.title}
                    referrerPolicy="no-referrer"
                    onError={() => handleImageError(leadStory.id)}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-stone-200 to-stone-300 text-stone-700">
                    <Newspaper className="w-10 h-10 mb-2 opacity-60" />
                    <span className="text-xs font-serif font-medium">{leadStory.category} Dispatch</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-stone-950/80 backdrop-blur-xs text-[10px] text-stone-300 px-2 py-0.5 rounded font-mono">
                  Photo: {leadStory.imageCredit.photographer} ({leadStory.imageCredit.source})
                </div>
              </div>

              {/* Unboxed Metadata */}
              <div className="flex items-center gap-2 text-xs text-stone-500 mb-2 font-mono flex-wrap">
                <span className="font-semibold text-stone-900 uppercase tracking-wider">
                  {leadStory.category}
                </span>
                {leadStory.isEvergreen && (
                  <>
                    <span aria-hidden="true">•</span>
                    <span className="text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                      Evergreen Pillar
                    </span>
                  </>
                )}
                <span aria-hidden="true">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {leadStory.readingTimeMinutes} {t.readTime}
                  </span>
                </span>
                <span aria-hidden="true">•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span className="tabular-nums">{leadStory.viewsCount}</span>
                </span>
              </div>

              {/* Lead Headline */}
              <h2 className="text-2xl sm:text-4xl font-editorial-serif font-bold text-stone-950 group-hover:text-stone-700 transition-colors leading-tight mb-3">
                {getLocalizedTitle(leadStory)}
              </h2>

              {/* Lead Story Summary Deck */}
              <p className="text-sm sm:text-base text-stone-700 font-editorial-prose leading-relaxed line-clamp-3">
                {getLocalizedSummary(leadStory)}
              </p>

              <div className="mt-4 flex items-center text-xs font-semibold text-stone-900 group-hover:translate-x-1 transition-transform">
                <span>{currentLanguage === 'hi' ? 'पूरा लेख पढ़ें' : 'Read Full Dispatch'}</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </article>

            {/* Secondary Features (5 Cols on Desktop) */}
            <div className="lg:col-span-5 flex flex-col divide-y divide-stone-200">
              {secondaryStories.map((secStory) => (
                <article
                  key={secStory.id}
                  onClick={() => onSelectArticle(secStory)}
                  className="py-5 first:pt-0 last:pb-0 group cursor-pointer"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                    <div className="sm:col-span-8">
                      <div className="flex items-center gap-2 text-xs text-stone-500 mb-1.5 font-mono flex-wrap">
                        <span className="font-semibold text-stone-900 uppercase">
                          {secStory.category}
                        </span>
                        {secStory.isEvergreen && (
                          <>
                            <span aria-hidden="true">•</span>
                            <span className="text-emerald-800 text-[10px] font-bold">Pillar</span>
                          </>
                        )}
                        <span aria-hidden="true">•</span>
                        <span>
                          {secStory.readingTimeMinutes} {t.readTime}
                        </span>
                      </div>
                      <h3 className="text-lg font-editorial-serif font-bold text-stone-900 group-hover:text-stone-700 transition-colors leading-snug mb-2">
                        {getLocalizedTitle(secStory)}
                      </h3>
                      <p className="text-xs text-stone-600 line-clamp-2 font-editorial-prose">
                        {getLocalizedSummary(secStory)}
                      </p>
                    </div>

                    <div className="sm:col-span-4 aspect-[4/3] rounded-sm overflow-hidden bg-stone-100 border border-stone-200">
                      {!imageErrors[secStory.id] ? (
                        <img
                          src={secStory.imageUrl}
                          alt={secStory.title}
                          referrerPolicy="no-referrer"
                          onError={() => handleImageError(secStory.id)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-stone-200 text-stone-500">
                          <Newspaper className="w-6 h-6 opacity-40" />
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}

              {/* In-Grid AdSense Placement */}
              <div className="pt-4">
                <AdSenseUnit slot="in-article" config={adSenseConfig} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tier 3: Department Columns & Analytical Dispatches */}
      {columnStories.length > 0 && (
        <section className="mb-14">
          <div className="flex items-center justify-between pb-3 border-b border-stone-300 mb-6">
            <h2 className="text-lg font-editorial-serif font-bold uppercase tracking-wide text-stone-950">
              {t.latestDispatches}
            </h2>
            <span className="text-xs text-stone-500 font-mono">
              Showing {columnStories.length} curated reports
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {columnStories.map((story) => (
              <article
                key={story.id}
                onClick={() => onSelectArticle(story)}
                className="group cursor-pointer flex flex-col justify-between border-b border-stone-200 pb-6"
              >
                <div>
                  <div className="aspect-[16/10] overflow-hidden rounded-sm bg-stone-100 border border-stone-200 mb-3 relative">
                    {!imageErrors[story.id] ? (
                      <img
                        src={story.imageUrl}
                        alt={story.title}
                        referrerPolicy="no-referrer"
                        onError={() => handleImageError(story.id)}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-200 text-stone-500">
                        <Newspaper className="w-8 h-8 opacity-40" />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-stone-900/80 text-stone-300 px-1.5 py-0.5 rounded">
                      {story.imageCredit.photographer}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-1.5 font-mono flex-wrap">
                    <span className="font-semibold text-stone-900 uppercase">
                      {story.category}
                    </span>
                    {story.isEvergreen && (
                      <>
                        <span aria-hidden="true">•</span>
                        <span className="text-emerald-800 text-[10px] font-bold">Pillar</span>
                      </>
                    )}
                    <span aria-hidden="true">•</span>
                    <span>
                      {story.readingTimeMinutes} {t.readTime}
                    </span>
                  </div>

                  <h3 className="text-base font-editorial-serif font-bold text-stone-900 group-hover:text-stone-700 transition-colors leading-snug mb-2">
                    {getLocalizedTitle(story)}
                  </h3>
                  <p className="text-xs text-stone-600 font-editorial-prose line-clamp-2">
                    {getLocalizedSummary(story)}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-stone-500 pt-3 border-t border-stone-100">
                  <span className="font-medium text-stone-700">{story.author.name}</span>
                  <span className="tabular-nums flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {story.viewsCount}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Sticky footer ad disclosure */}
      <AdSenseUnit slot="sticky-footer" config={adSenseConfig} />
    </div>
  );
};
