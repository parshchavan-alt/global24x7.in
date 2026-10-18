import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  Eye,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  Check,
  Twitter,
  Linkedin,
  Facebook,
  Send,
  Sparkles,
  ExternalLink,
  Camera,
} from 'lucide-react';
import { Article, SupportedLanguage, AdSenseConfig, CustomCodeConfig, SiteBrandingConfig } from '../types';
import { UI_TRANSLATIONS } from '../constants/languages';
import { AdSenseUnit } from './AdSenseUnit';

interface ArticleDetailProps {
  article: Article;
  onBack: () => void;
  currentLanguage: SupportedLanguage;
  onSelectArticle: (article: Article) => void;
  allArticles: Article[];
  adSenseConfig: AdSenseConfig;
  customCodeConfig?: CustomCodeConfig;
  onUpdateArticle: (updated: Article) => void;
  branding?: SiteBrandingConfig;
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({
  article,
  onBack,
  currentLanguage,
  onSelectArticle,
  allArticles,
  adSenseConfig,
  customCodeConfig,
  onUpdateArticle,
  branding,
}) => {
  const t = UI_TRANSLATIONS[currentLanguage] || UI_TRANSLATIONS.en;
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  // Automatically inject Schema.org NewsArticle JSON-LD into head
  useEffect(() => {
    const scriptId = 'schema-news-article';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description: article.summary,
      image: [article.imageUrl],
      datePublished: article.publishedAt,
      dateModified: article.publishedAt,
      author: [
        {
          '@type': 'Person',
          name: article.author.name,
          jobTitle: article.author.title,
        },
      ],
      publisher: {
        '@type': 'Organization',
        name: branding?.siteName || 'Global 24x7',
        url: window.location.origin,
        logo: {
          '@type': 'ImageObject',
          url: branding?.logoUrl || `${window.location.origin}/logo.png`,
        },
      },
      articleSection: article.category,
      keywords: article.tags.join(', '),
      inLanguage: currentLanguage,
    };

    scriptTag.textContent = JSON.stringify(schemaData);

    return () => {
      const tag = document.getElementById(scriptId);
      if (tag) tag.remove();
    };
  }, [article, currentLanguage, branding]);

  // Record view on backend
  useEffect(() => {
    fetch(`/api/articles/${article.id}/view`, { method: 'POST' }).catch(() => {});
  }, [article.id]);

  // Check if article needs translation for current language
  const activeTranslation =
    currentLanguage !== 'en' ? article.translations?.[currentLanguage] : null;

  const displayTitle = activeTranslation?.title || article.title;
  const displaySummary = activeTranslation?.summary || article.summary;
  const displayContent = activeTranslation?.content || article.content;
  const displayTakeaways = activeTranslation?.keyTakeaways || article.keyTakeaways;

  const handleTranslate = async () => {
    if (currentLanguage === 'en' || activeTranslation) return;
    setIsTranslating(true);
    setTranslateError(null);

    try {
      const res = await fetch('/api/translate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          targetLanguage: currentLanguage,
        }),
      });
      const data = await res.json();
      if (data.success && data.translation) {
        const updated = {
          ...article,
          translations: {
            ...(article.translations || {}),
            [currentLanguage]: data.translation,
          },
        };
        onUpdateArticle(updated);
      } else {
        setTranslateError(data.error || 'Translation failed');
      }
    } catch (err: any) {
      setTranslateError(err.message || 'Network error');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      if ('speechSynthesis' in window) {
        const textToRead = `${displayTitle}. ${displaySummary}. ${displayTakeaways.join('. ')}`;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = 0.95;
        utterance.lang = currentLanguage;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    }
  };

  // Related stories in the same category
  const relatedStories = allArticles
    .filter((a) => a.category === article.category && a.id !== article.id)
    .slice(0, 3);

  // Split content into paragraphs for clean typography rendering
  const paragraphs = displayContent.split('\n\n').filter((p) => p.trim().length > 0);

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation Breadcrumb & Back action */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.backToHome}</span>
        </button>

        {/* Clean unboxed category kicker */}
        <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
          <span className="font-semibold text-stone-900 uppercase tracking-wider">
            {article.category}
          </span>
          <span aria-hidden="true">•</span>
          <span>
            {new Date(article.publishedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Translation Banner if viewing non-English without pre-cached translation */}
      {currentLanguage !== 'en' && !activeTranslation && (
        <div className="bg-stone-100 border border-stone-200 rounded-sm p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-stone-800">
            <Sparkles className="w-4 h-4 text-stone-700" />
            <span>
              This article is currently displayed in English. Would you like to localize it into{' '}
              <strong>{currentLanguage.toUpperCase()}</strong> with AI?
            </span>
          </div>
          <button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="px-3 py-1.5 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 rounded-sm whitespace-nowrap disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isTranslating ? (
              <span>{t.translating}</span>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                <span>Localize Article</span>
              </>
            )}
          </button>
        </div>
      )}

      {translateError && (
        <div className="bg-red-50 text-red-700 text-xs p-3 rounded mb-6 border border-red-200">
          {translateError}
        </div>
      )}

      {/* Article Header Section */}
      <header className="mb-8">
        <h1 className="text-3xl sm:text-5xl font-editorial-serif font-black text-stone-950 leading-tight mb-4 tracking-tight">
          {displayTitle}
        </h1>
        <p className="text-base sm:text-lg text-stone-700 font-editorial-prose italic leading-relaxed mb-6">
          {displaySummary}
        </p>

        {/* Author Byline & Reading Telemetry Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-stone-200 text-xs text-stone-600 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900">{article.author.name}</span>
            <span aria-hidden="true">•</span>
            <span>{article.author.title}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>
                {article.readingTimeMinutes} {t.readTime}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-stone-400" />
              <span className="tabular-nums">{article.viewsCount} {t.views}</span>
            </span>

            {/* Audio Read-Aloud Button */}
            <button
              onClick={handleToggleAudio}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                isPlayingAudio
                  ? 'bg-red-900 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
              }`}
              title={isPlayingAudio ? 'Stop Audio' : t.listenAudio}
            >
              {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {isPlayingAudio ? 'Stop Audio' : 'Listen'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Featured Editorial Photo with Complete Attribution */}
      <figure className="mb-10">
        <div className="rounded-sm overflow-hidden bg-stone-100 border border-stone-200 aspect-[16/10] relative">
          <img
            src={article.imageUrl}
            alt={article.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Caption & Legal Attribution Card */}
        <figcaption className="mt-2.5 px-1 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-stone-500 font-mono gap-1 border-b border-stone-100 pb-2">
          <span className="font-editorial-prose italic text-stone-600">
            {article.imageCaption}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-stone-400 shrink-0">
            <Camera className="w-3 h-3" />
            <span>Photo: {article.imageCredit.photographer}</span>
            <span aria-hidden="true">/</span>
            <span>{article.imageCredit.source}</span>
            {article.imageCredit.originalUrl && (
              <a
                href={article.imageCredit.originalUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-stone-700 ml-1"
                title="View original photo license"
              >
                <ExternalLink className="w-2.5 h-2.5 inline" />
              </a>
            )}
          </div>
        </figcaption>
      </figure>

      {/* Executive Key Takeaways Box */}
      {displayTakeaways && displayTakeaways.length > 0 && (
        <aside className="my-8 p-5 bg-stone-100/70 border border-stone-300 rounded-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-stone-900 mb-3 font-mono">
            {t.keyTakeaways}
          </div>
          <ul className="space-y-2">
            {displayTakeaways.map((takeaway, idx) => (
              <li
                key={idx}
                className="text-xs sm:text-sm font-editorial-prose text-stone-800 flex items-start gap-2.5 leading-relaxed"
              >
                <span className="text-stone-400 font-mono mt-0.5">•</span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}

      {/* Primary Reading Column */}
      <div className="max-w-prose mx-auto font-editorial-prose text-stone-900 text-base sm:text-lg leading-[1.8] space-y-6">
        {paragraphs.map((p, idx) => {
          if (p.startsWith('## ')) {
            return (
              <h2
                key={idx}
                className="text-xl sm:text-2xl font-editorial-serif font-bold text-stone-950 mt-8 mb-2 tracking-tight"
              >
                {p.replace('## ', '')}
              </h2>
            );
          }
          if (idx === 0) {
            return (
              <p key={idx} className="first-letter-dropcap">
                {p}
              </p>
            );
          }
          if (idx === 2) {
            return (
              <React.Fragment key={idx}>
                <p>{p}</p>
                <AdSenseUnit slot="in-article" config={adSenseConfig} />
              </React.Fragment>
            );
          }
          if (p.startsWith('> ')) {
            return (
              <blockquote
                key={idx}
                className="my-6 py-4 px-6 border-y border-stone-300 text-xl font-editorial-serif italic text-stone-900 text-center"
              >
                {p.replace('> ', '')}
              </blockquote>
            );
          }
          return <p key={idx}>{p}</p>;
        })}
      </div>

      {/* Custom Post-Article Injected HTML Widget */}
      {customCodeConfig?.afterArticleHtml && (
        <div
          className="max-w-prose mx-auto my-6"
          dangerouslySetInnerHTML={{ __html: customCodeConfig.afterArticleHtml }}
        />
      )}

      {/* Tags Section */}
      <div className="max-w-prose mx-auto mt-10 pt-6 border-t border-stone-200">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-stone-500">
          <span className="text-stone-400">TAGS:</span>
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded text-[11px]"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Social Media Sharing Strip */}
      <div className="max-w-prose mx-auto my-8 p-4 bg-white border border-stone-200 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs font-medium text-stone-700 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-stone-500" />
          <span>{t.shareStory}</span>
        </span>
        <div className="flex items-center gap-2">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              article.title
            )}&url=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noreferrer"
            className="p-2 text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded transition-colors"
            title="Share on X"
          >
            <Twitter className="w-4 h-4" />
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
              window.location.href
            )}`}
            target="_blank"
            rel="noreferrer"
            className="p-2 text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded transition-colors"
            title="Share on LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              window.location.href
            )}`}
            target="_blank"
            rel="noreferrer"
            className="p-2 text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded transition-colors"
            title="Share on Facebook"
          >
            <Facebook className="w-4 h-4" />
          </a>
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              article.title + ' ' + window.location.href
            )}`}
            target="_blank"
            rel="noreferrer"
            className="p-2 text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded transition-colors"
            title="Share on WhatsApp"
          >
            <Send className="w-4 h-4" />
          </a>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 rounded transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span>{copied ? t.copied : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Related Stories in Department */}
      {relatedStories.length > 0 && (
        <section className="mt-14 pt-8 border-t-2 border-stone-900">
          <h2 className="text-xl font-editorial-serif font-bold text-stone-950 mb-6">
            {t.relatedArticles}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedStories.map((rel) => (
              <div
                key={rel.id}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  onSelectArticle(rel);
                }}
                className="group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[16/10] overflow-hidden rounded-sm bg-stone-100 border border-stone-200 mb-2.5">
                    <img
                      src={rel.imageUrl}
                      alt={rel.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                  </div>
                  <div className="text-[11px] font-mono text-stone-400 mb-1">
                    {rel.category} • {rel.readingTimeMinutes} {t.readTime}
                  </div>
                  <h3 className="text-sm font-editorial-serif font-bold text-stone-900 group-hover:text-stone-700 leading-snug line-clamp-2">
                    {rel.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};
