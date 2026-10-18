import React from 'react';
import { Article, SupportedLanguage } from '../types';
import { UI_TRANSLATIONS } from '../constants/languages';

interface BreakingTickerProps {
  articles: Article[];
  currentLanguage: SupportedLanguage;
  onSelectArticle: (article: Article) => void;
}

export const BreakingTicker: React.FC<BreakingTickerProps> = ({
  articles,
  currentLanguage,
  onSelectArticle,
}) => {
  const t = UI_TRANSLATIONS[currentLanguage] || UI_TRANSLATIONS.en;
  const recentArticles = articles.slice(0, 5);

  if (recentArticles.length === 0) return null;

  return (
    <div className="bg-stone-900 text-stone-100 text-xs py-2 px-4 sm:px-6 lg:px-8 border-b border-stone-800">
      <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-hidden">
        {/* Clean, unboxed text label with red highlight */}
        <span className="font-semibold uppercase tracking-wider text-red-400 whitespace-nowrap shrink-0">
          {t.breakingNews}
        </span>
        <span className="text-stone-600 hidden sm:inline" aria-hidden="true">
          |
        </span>

        {/* Scrollable ticker items */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap py-0.5">
          {recentArticles.map((art, idx) => {
            const localizedTitle =
              currentLanguage !== 'en' && art.translations?.[currentLanguage]?.title
                ? art.translations[currentLanguage].title
                : art.title;

            return (
              <button
                key={art.id}
                onClick={() => onSelectArticle(art)}
                className="group flex items-center gap-2 text-stone-300 hover:text-white transition-colors text-left text-xs"
              >
                <span className="text-stone-400 font-mono text-[11px]">
                  {art.category}
                </span>
                <span className="text-stone-500" aria-hidden="true">•</span>
                <span className="group-hover:underline truncate max-w-xs sm:max-w-md lg:max-w-lg">
                  {localizedTitle}
                </span>
                {idx < recentArticles.length - 1 && (
                  <span className="text-stone-700 ml-4" aria-hidden="true">
                    /
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
