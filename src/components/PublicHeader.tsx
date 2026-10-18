import React, { useState } from 'react';
import { Search, Lock, X, Menu } from 'lucide-react';
import { SupportedLanguage, CustomCategory, SiteBrandingConfig } from '../types';
import { UI_TRANSLATIONS } from '../constants/languages';

interface PublicHeaderProps {
  currentCategory: string;
  onSelectCategory: (cat: string) => void;
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onOpenAdmin: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categories: CustomCategory[];
  branding?: SiteBrandingConfig;
  onNavigateHome?: () => void;
  onNavigateToPage?: (slug: string) => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  currentCategory,
  onSelectCategory,
  currentLanguage,
  onSelectLanguage,
  onOpenAdmin,
  searchQuery,
  onSearchChange,
  categories,
  branding,
  onNavigateHome,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const t = UI_TRANSLATIONS[currentLanguage] || UI_TRANSLATIONS.en;
  const topNavCategories = ['All', ...categories.slice(0, 6).map((c) => c.name)];

  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-stone-200">
      {/* Strict Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6 sm:gap-8">
        {/* Zone 1: Wordmark & Live 24x7 Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (onNavigateHome) onNavigateHome();
              onSelectCategory('All');
              onSearchChange('');
            }}
            className="text-xl sm:text-2xl font-editorial-serif font-black tracking-tight text-stone-900 whitespace-nowrap shrink-0 hover:text-stone-700 transition-colors text-left flex items-center gap-2 cursor-pointer"
          >
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.siteName}
                className="h-8 max-w-[160px] object-contain"
              />
            ) : (
              <span className="tracking-tighter">
                {branding?.siteName || 'Global 24x7'}
              </span>
            )}
          </button>
          <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-100 text-rose-800 font-bold border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            <span>24/7 LIVE</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-stone-600">
          {topNavCategories.map((cat) => {
            const isActive = currentCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  if (onNavigateHome) onNavigateHome();
                  onSelectCategory(cat);
                  onSearchChange('');
                }}
                className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-stone-900 text-stone-950 font-semibold'
                    : 'border-transparent hover:text-stone-950 hover:border-stone-300'
                }`}
              >
                {cat === 'All' ? t.allCategories : cat}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Search, Hindi/English Toggle, Admin Portal */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Quick Search Button */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
            title="Search"
            aria-label="Search dispatches"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Dedicated English / Hindi Dual Segmented Toggle */}
          <div className="flex items-center p-0.5 bg-stone-200/80 rounded-md text-xs font-mono font-medium">
            <button
              onClick={() => onSelectLanguage('en')}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                currentLanguage === 'en'
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="English Edition"
            >
              EN
            </button>
            <button
              onClick={() => onSelectLanguage('hi')}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                currentLanguage === 'hi'
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="हिन्दी संस्करण"
            >
              हिन्दी
            </button>
          </div>

          {/* Editorial / Admin Portal Trigger */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Lock className="w-3 h-3 text-stone-300" />
            <span className="hidden sm:inline">{t.adminAccess}</span>
            <span className="sm:hidden">Admin</span>
          </button>

          {/* Mobile hamburger menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-stone-600 hover:text-stone-900 rounded-md cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expandable Search Input Strip */}
      {searchOpen && (
        <div className="border-t border-stone-200 bg-white/95 px-4 py-3">
          <div className="max-w-3xl mx-auto relative flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              autoFocus
              className="w-full pl-9 pr-8 py-2 text-sm bg-stone-50 border border-stone-200 rounded-md focus:outline-none focus:border-stone-900 focus:bg-white transition-all text-stone-900"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-[#FBF9F5] px-4 py-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 px-2 pb-1">
            {t.filterByCategory}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['All', ...categories.map((c) => c.name)].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  if (onNavigateHome) onNavigateHome();
                  onSelectCategory(cat);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2 text-xs rounded-md cursor-pointer ${
                  currentCategory === cat
                    ? 'bg-stone-900 text-white font-medium'
                    : 'text-stone-700 bg-white border border-stone-200'
                }`}
              >
                {cat === 'All' ? t.allCategories : cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
