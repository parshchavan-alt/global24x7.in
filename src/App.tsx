import React, { useState, useEffect, useCallback } from 'react';
import {
  Article,
  CustomCategory,
  SupportedLanguage,
  AIFineTuningConfig,
  SchedulerConfig,
  AdSenseConfig,
  SecurityAuditItem,
  CustomCodeConfig,
  SiteBrandingConfig,
  DEFAULT_BRANDING,
  CustomPage,
} from './types';
import { INITIAL_CATEGORIES } from './data/seedArticles';
import { getStoredArticles, persistArticle, removeArticle, saveArticlesToLocal } from './utils/articleStorage';
import { getLocalKeys } from './utils/keyStorage';
import { generateArticleDirectly } from './utils/geminiDirect';
import { safeFetchJson } from './utils/apiSafe';
import { PublicHeader } from './components/PublicHeader';
import { FrontPage } from './components/FrontPage';
import { ArticleDetail } from './components/ArticleDetail';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AdminAuthModal } from './components/Admin/AdminAuthModal';
import { BreakingTicker } from './components/BreakingTicker';
import { CustomPageView } from './components/CustomPageView';
import {
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Send,
  FileText,
  Rss,
  Globe,
  Lock,
} from 'lucide-react';

function getAdminToken(): string {
  return (
    sessionStorage.getItem('chronicle_admin_session') ||
    localStorage.getItem('chronicle_admin_token') ||
    ''
  );
}

export function App() {
  const [articles, setArticles] = useState<Article[]>(getStoredArticles);
  const [categories, setCategories] = useState<CustomCategory[]>(INITIAL_CATEGORIES);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string>('All');
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedPageSlug, setSelectedPageSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isDefaultPasscode, setIsDefaultPasscode] = useState(false);

  // Track initial deep-linked article slug if page was loaded directly on /article/:slug
  const [pendingArticleSlug, setPendingArticleSlug] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/article/')) {
      return path.replace('/article/', '').replace(/\/$/, '');
    }
    return null;
  });

  // Website Branding
  const [branding, setBranding] = useState<SiteBrandingConfig>(() => {
    const saved = localStorage.getItem('global24x7_branding');
    if (saved) {
      try {
        return { ...DEFAULT_BRANDING, ...JSON.parse(saved) };
      } catch {}
    }
    return DEFAULT_BRANDING;
  });

  // Custom Code
  const [customCodeConfig, setCustomCodeConfig] = useState<CustomCodeConfig>(() => {
    try {
      const saved = localStorage.getItem('global24x7_custom_code');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      customCss: `/* Global 24x7 Broadsheet CSS */\n/* .font-editorial-serif { letter-spacing: -0.015em; } */`,
      headHtml: `<!-- Global 24x7 Head Injections (AdSense / Analytics / Meta) -->`,
      headerHtml: ``,
      afterArticleHtml: ``,
      footerHtml: ``,
    };
  });

  // Fine-Tuning
  const [fineTuningConfig, setFineTuningConfig] = useState<AIFineTuningConfig>(() => {
    const saved = localStorage.getItem('global24x7_fine_tuning');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      selectedModel: 'gemini-3.8-flash',
      writingPersona: 'investigative',
      toneFormality: 4,
      depthLevel: 4,
      neutralityLevel: 5,
      targetWordCount: 800,
      includeTakeaways: true,
      includeHistoricalContext: true,
      includeExpertQuotes: true,
      customSystemDirectives:
        'Deliver authoritative reporting matching elite broadsheet standards in English and Hindi. No colloquialisms, no sensationalism.',
    };
  });

  // Scheduler
  const [schedulerConfig, setSchedulerConfig] = useState<SchedulerConfig>({
    enabled: true,
    frequencyMinutes: 60,
    naturalJitter: true,
    topicStrategy: 'balanced',
    categoriesInRotation: [
      'Technology',
      'Economy',
      'Global Affairs',
      'Science',
      'Markets',
      'Opinion',
    ],
    autoPublish: true,
    languageMode: 'both',
    articlesGeneratedCount: 8,
  });

  // AdSense
  const [adSenseConfig, setAdSenseConfig] = useState<AdSenseConfig>(() => {
    const saved = localStorage.getItem('global24x7_adsense_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      enabled: false,
      publisherId: '',
      topBannerActive: true,
      inArticleActive: true,
      sidebarActive: true,
      stickyFooterActive: true,
      testMode: false,
    };
  });

  // Security Audit Log
  const [securityAuditLog, setSecurityAuditLog] = useState<SecurityAuditItem[]>(() => {
    const saved = localStorage.getItem('global24x7_security_log');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: 'sec-1',
        timestamp: new Date().toLocaleTimeString(),
        action: 'System Boot',
        ipMasked: '127.0.0.1 (Local)',
        status: 'success',
        details: 'Global 24x7 autonomous publishing engine initialized with multi-account key pool',
      },
    ];
  });

  const logSecurityEvent = (
    action: string,
    status: 'success' | 'warning' | 'alert',
    details: string
  ) => {
    const newLog: SecurityAuditItem = {
      id: `sec-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      action,
      ipMasked: '192.168.1.***',
      status,
      details,
    };
    setSecurityAuditLog((prev) => {
      const updated = [newLog, ...prev.slice(0, 49)];
      localStorage.setItem('global24x7_security_log', JSON.stringify(updated));
      return updated;
    });
  };

  // URL Navigation Helpers (Updating Browser History Bar & View State)
  const navigateToArticle = useCallback((art: Article) => {
    setSelectedArticle(art);
    setSelectedPageSlug(null);
    if (window.history && window.history.pushState) {
      window.history.pushState({ type: 'article', slug: art.slug }, '', `/article/${art.slug}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToPage = useCallback((slug: string) => {
    setSelectedPageSlug(slug);
    setSelectedArticle(null);
    if (window.history && window.history.pushState) {
      window.history.pushState({ type: 'page', slug }, '', `/page/${slug}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToCategory = useCallback((cat: string) => {
    setCurrentCategory(cat);
    setSelectedArticle(null);
    setSelectedPageSlug(null);
    setSearchQuery('');
    const targetUrl =
      cat === 'All'
        ? currentLanguage === 'hi'
          ? '/hi'
          : '/'
        : `/category/${encodeURIComponent(cat.toLowerCase())}`;
    if (window.history && window.history.pushState) {
      window.history.pushState({ type: 'category', category: cat }, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentLanguage]);

  const navigateToHome = useCallback(() => {
    setSelectedArticle(null);
    setSelectedPageSlug(null);
    setCurrentCategory('All');
    setSearchQuery('');
    const targetUrl = currentLanguage === 'hi' ? '/hi' : '/';
    if (window.history && window.history.pushState) {
      window.history.pushState({ type: 'home' }, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentLanguage]);

  const handleSelectLanguage = useCallback((lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    if (!selectedArticle && !selectedPageSlug && currentCategory === 'All') {
      if (window.history && window.history.pushState) {
        window.history.pushState({ type: 'home' }, '', lang === 'hi' ? '/hi' : '/');
      }
    }
  }, [selectedArticle, selectedPageSlug, currentCategory]);

  // Synchronize component view with current URL pathname
  const syncRouteWithUrl = useCallback((
    articlesList: Article[] = articles,
    pagesList: CustomPage[] = customPages,
    categoriesList: CustomCategory[] = categories
  ) => {
    const pathname = window.location.pathname;

    if (pathname.startsWith('/article/')) {
      const slug = pathname.replace('/article/', '').replace(/\/$/, '');
      if (slug) {
        const found = articlesList.find((a) => a.slug === slug || a.id === slug);
        if (found) {
          setSelectedArticle(found);
          setSelectedPageSlug(null);
          setPendingArticleSlug(null);
          return;
        } else {
          setPendingArticleSlug(slug);
        }
      }
    } else if (pathname.startsWith('/page/')) {
      const slug = pathname.replace('/page/', '').replace(/\/$/, '');
      if (slug) {
        setSelectedPageSlug(slug);
        setSelectedArticle(null);
        return;
      }
    } else if (pathname.startsWith('/category/')) {
      const rawCat = pathname.replace('/category/', '').replace(/\/$/, '');
      const decoded = decodeURIComponent(rawCat);
      const foundCat = categoriesList.find(
        (c) =>
          c.name.toLowerCase() === decoded.toLowerCase() ||
          c.slug.toLowerCase() === decoded.toLowerCase()
      );
      setCurrentCategory(foundCat ? foundCat.name : decoded);
      setSelectedArticle(null);
      setSelectedPageSlug(null);
      return;
    } else if (pathname === '/hi' || pathname.startsWith('/hi/')) {
      setCurrentLanguage('hi');
      setSelectedArticle(null);
      setSelectedPageSlug(null);
      return;
    } else if (pathname === '/admin') {
      handleOpenAdminTrigger();
      return;
    } else if (pathname === '/' || pathname === '') {
      setSelectedArticle(null);
      setSelectedPageSlug(null);
    }
  }, [articles, customPages, categories]);

  // Browser Back/Forward navigation listener (popstate)
  useEffect(() => {
    const onPopState = () => {
      syncRouteWithUrl(articles, customPages, categories);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [articles, customPages, categories, syncRouteWithUrl]);

  // Sync data from backend & check initial URL routing
  useEffect(() => {
    // 1. Articles Sync & pending slug resolution
    safeFetchJson<{ success: boolean; articles?: Article[] }>('/api/articles')
      .then((res) => {
        if (res.ok && Array.isArray(res.data?.articles)) {
          setArticles((prev) => {
            const map = new Map<string, Article>();
            for (const a of res.data!.articles!) map.set(a.id, a);
            for (const a of prev) map.set(a.id, a);
            const combined = Array.from(map.values()).sort(
              (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
            );
            saveArticlesToLocal(combined);

            // If user loaded the site directly on /article/:slug, resolve it immediately!
            const pathname = window.location.pathname;
            if (pathname.startsWith('/article/')) {
              const slug = pathname.replace('/article/', '').replace(/\/$/, '');
              const target = combined.find((a) => a.slug === slug || a.id === slug);
              if (target) {
                setSelectedArticle(target);
                setSelectedPageSlug(null);
              }
            }
            return combined;
          });
        }
      })
      .catch(() => {});

    // 2. Categories
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});

    // 3. Custom Code (with local preservation across container restarts)
    fetch('/api/custom-code')
      .then((r) => r.json())
      .then((data) => {
        const localSaved = localStorage.getItem('global24x7_custom_code');
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            const hasCustomEdits =
              Boolean(parsed.headerHtml?.trim()) ||
              Boolean(parsed.afterArticleHtml?.trim()) ||
              Boolean(parsed.footerHtml?.trim()) ||
              (parsed.customCss && !parsed.customCss.includes('Broadsheet CSS')) ||
              (parsed.headHtml && !parsed.headHtml.includes('Head Injections (AdSense'));
            if (hasCustomEdits) {
              setCustomCodeConfig(parsed);
              // Re-seed server so server-rendered endpoints also have the custom code
              fetch('/api/custom-code', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-admin-token': getAdminToken(),
                  'x-admin-passcode': localStorage.getItem('chronicle_admin_passcode') || '',
                },
                body: JSON.stringify(parsed),
              }).catch(() => {});
              return;
            }
          } catch {}
        }
        if (data.success && data.customCode) {
          setCustomCodeConfig(data.customCode);
          localStorage.setItem('global24x7_custom_code', JSON.stringify(data.customCode));
        }
      })
      .catch(() => {});

    // 4. Branding
    fetch('/api/branding')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.branding) {
          setBranding(data.branding);
          localStorage.setItem('global24x7_branding', JSON.stringify(data.branding));
        }
      })
      .catch(() => {});

    // 5. Pages
    fetch('/api/pages')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.pages)) {
          setCustomPages(data.pages);
        }
      })
      .catch(() => {});

    // 6. Scheduler
    fetch('/api/scheduler')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.config) {
          setSchedulerConfig(data.config);
        }
      })
      .catch(() => {});

    // 7. AdSense Config Sync from Server
    fetch('/api/adsense')
      .then((r) => r.json())
      .then((data) => {
        const localSaved = localStorage.getItem('global24x7_adsense_config');
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (parsed.userConfigured) {
              setAdSenseConfig(parsed);
              fetch('/api/adsense', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-admin-token': getAdminToken(),
                  'x-admin-passcode': localStorage.getItem('chronicle_admin_passcode') || '',
                },
                body: JSON.stringify(parsed),
              }).catch(() => {});
              return;
            }
          } catch {}
        }
        if (data.success && data.config) {
          setAdSenseConfig(data.config);
          localStorage.setItem('global24x7_adsense_config', JSON.stringify(data.config));
        }
      })
      .catch(() => {});

    // 8. Fine-Tuning Config Sync from Server
    fetch('/api/fine-tuning')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.config) {
          setFineTuningConfig(data.config);
          localStorage.setItem('global24x7_fine_tuning', JSON.stringify(data.config));
        }
      })
      .catch(() => {});

    // 9. Auth status check & auto-sync credentials across restarts
    const savedPasscode = localStorage.getItem('chronicle_admin_passcode');
    const token = getAdminToken();
    if (savedPasscode) {
      fetch('/api/auth/sync-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savedPasscode }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.token) {
            sessionStorage.setItem('chronicle_admin_session', data.token);
            sessionStorage.setItem('chronicle_admin_session_expiry', (Date.now() + 14 * 86400 * 1000).toString());
            localStorage.setItem('chronicle_admin_token', data.token);
            setIsDefaultPasscode(false);
          }
        })
        .catch(() => {});
    } else if (token) {
      fetch('/api/auth/status', {
        headers: {
          'x-admin-token': token,
          'x-admin-passcode': localStorage.getItem('chronicle_admin_passcode') || '',
        },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data && typeof data.isDefault === 'boolean') {
            setIsDefaultPasscode(data.isDefault);
          }
        })
        .catch(() => {});
    }

    // 10. Initial Route Parse
    const pathname = window.location.pathname;
    if (pathname.startsWith('/hi')) {
      setCurrentLanguage('hi');
    }
    if (pathname.startsWith('/page/')) {
      const slug = pathname.replace('/page/', '').replace(/\/$/, '');
      if (slug) setSelectedPageSlug(slug);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleOpenAdminTrigger();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cadence Runner for autonomous publishing
  useEffect(() => {
    let isGenerating = false;
    const interval = setInterval(async () => {
      if (isGenerating) return;
      let cfg: SchedulerConfig = schedulerConfig;
      const savedCfg = localStorage.getItem('global24x7_scheduler_config');
      if (savedCfg) {
        try {
          cfg = { ...schedulerConfig, ...JSON.parse(savedCfg) };
        } catch {}
      }
      if (!cfg.enabled) return;
      const keys = getLocalKeys();
      if (!keys || keys.length === 0) return;

      const now = Date.now();
      const lastRunRaw = localStorage.getItem('global24x7_last_run_timestamp');
      const lastRun = lastRunRaw ? parseInt(lastRunRaw, 10) : 0;
      const frequencyMinutes = cfg.frequencyMinutes || 60;
      const intervalMs = frequencyMinutes * 60 * 1000;

      if (!lastRun || now - lastRun >= intervalMs) {
        isGenerating = true;
        localStorage.setItem('global24x7_last_run_timestamp', String(now));
        const activeCats = cfg.categoriesInRotation?.length ? cfg.categoriesInRotation : categories.map((c) => c.name);
        const randomCat = activeCats[Math.floor(Math.random() * activeCats.length)] || 'Technology';

        try {
          const directResult = await generateArticleDirectly(keys[0].key, randomCat);
          if (directResult.success && directResult.article) {
            setArticles((prev) => {
              const updated = [directResult.article!, ...prev.filter((a) => a.id !== directResult.article!.id)];
              saveArticlesToLocal(updated);
              return updated;
            });
            logSecurityEvent('Autonomous Publishing', 'success', `Auto-published: "${directResult.article.title.slice(0, 35)}..."`);
          }
        } catch (genErr) {
          console.warn('[Global 24x7 Engine] Background generation note:', genErr);
        } finally {
          isGenerating = false;
        }
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [categories, schedulerConfig]);

  // Inject custom CSS
  useEffect(() => {
    let styleTag = document.getElementById('chronicle-custom-css') as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'chronicle-custom-css';
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = customCodeConfig.customCss || '';
  }, [customCodeConfig.customCss]);

  // Dynamic Document Title and Meta Description synchronization
  useEffect(() => {
    const siteTitle = branding.siteName || 'Global 24x7';
    if (selectedArticle) {
      document.title = `${selectedArticle.title} — ${siteTitle}`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', selectedArticle.summary || selectedArticle.title);
    } else if (selectedPageSlug) {
      const page = customPages.find((p) => p.slug === selectedPageSlug);
      const title = page ? page.title : 'Editorial Page';
      document.title = `${title} — ${siteTitle}`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && page?.metaDescription) metaDesc.setAttribute('content', page.metaDescription);
    } else if (currentCategory !== 'All') {
      document.title = `${currentCategory} News, Dispatches & Analysis — ${siteTitle}`;
    } else {
      document.title = `${siteTitle} — ${branding.tagline || 'Continuous World News'}`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', branding.aboutText || branding.tagline);
      }
    }
  }, [branding, selectedArticle, selectedPageSlug, currentCategory, customPages]);

  // Admin Mutate Handlers (Synchronizing Server and Local Cache with Auth Token)
  const handleSaveBranding = async (cfg: SiteBrandingConfig) => {
    setBranding(cfg);
    localStorage.setItem('global24x7_branding', JSON.stringify(cfg));
    try {
      const res = await fetch('/api/branding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (data.success) {
        logSecurityEvent('Branding Updated', 'success', `Updated site brand: ${cfg.siteName}`);
      }
    } catch {
      logSecurityEvent('Branding Updated (Local)', 'warning', `Updated local branding: ${cfg.siteName}`);
    }
  };

  const handleUpdateFineTuning = async (cfg: AIFineTuningConfig) => {
    setFineTuningConfig(cfg);
    localStorage.setItem('global24x7_fine_tuning', JSON.stringify(cfg));
    try {
      await fetch('/api/fine-tuning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
        body: JSON.stringify(cfg),
      });
    } catch {}
  };

  const handleUpdateScheduler = async (cfg: SchedulerConfig) => {
    setSchedulerConfig(cfg);
    try {
      await fetch('/api/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
        body: JSON.stringify(cfg),
      });
    } catch {}
  };

  const handleUpdateAdSense = async (cfg: AdSenseConfig) => {
    setAdSenseConfig(cfg);
    localStorage.setItem('global24x7_adsense_config', JSON.stringify(cfg));
    try {
      await fetch('/api/adsense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
        body: JSON.stringify(cfg),
      });
      logSecurityEvent('Monetization Saved', 'success', `AdSense status: ${cfg.enabled ? 'Enabled' : 'Disabled'}`);
    } catch (err) {
      console.error('Failed to persist AdSense config to server:', err);
    }
  };

  const handleSaveCategory = async (cat: CustomCategory) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
        body: JSON.stringify(cat),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
        logSecurityEvent('Category Saved', 'success', `Saved category: ${cat.name}`);
      }
    } catch {
      setCategories((prev) => {
        const idx = prev.findIndex((c) => c.id === cat.id);
        if (idx >= 0) {
          const cp = [...prev];
          cp[idx] = cat;
          return cp;
        }
        return [...prev, cat];
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': getAdminToken(),
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
        logSecurityEvent('Category Removed', 'warning', `Deleted category ID: ${id}`);
      }
    } catch {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleSaveCustomCode = async (cfg: CustomCodeConfig) => {
    setCustomCodeConfig(cfg);
    try {
      await fetch('/api/custom-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
        body: JSON.stringify(cfg),
      });
      logSecurityEvent('Custom Code Injected', 'success', 'Updated custom HTML/CSS code');
    } catch (err) {
      console.error('Failed to persist custom code to server:', err);
    }
  };

  const handleSaveArticle = async (art: Article) => {
    const updated = await persistArticle(art, articles);
    setArticles(updated);
    logSecurityEvent('Article Published', 'success', `Saved: "${art.title.slice(0, 30)}..."`);
  };

  const handleDeleteArticle = async (id: string) => {
    const updated = await removeArticle(id, articles);
    setArticles(updated);
    logSecurityEvent('Article Deleted', 'warning', `Deleted article ID: ${id}`);
  };

  const handleOpenAdminTrigger = () => {
    const session = sessionStorage.getItem('chronicle_admin_session');
    const expiry = sessionStorage.getItem('chronicle_admin_session_expiry');
    if (session && expiry && parseInt(expiry, 10) > Date.now()) {
      setAdminOpen(true);
    } else {
      setAuthModalOpen(true);
    }
  };

  const activeCustomPage = selectedPageSlug
    ? customPages.find((p) => p.slug === selectedPageSlug)
    : null;

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900 flex flex-col selection:bg-stone-900 selection:text-white">
      {/* Custom Header Injection */}
      {!adminOpen && customCodeConfig.headerHtml && (
        <div
          id="custom-header-banner"
          dangerouslySetInnerHTML={{ __html: customCodeConfig.headerHtml }}
        />
      )}

      {/* Admin Panel Workspace View */}
      {adminOpen ? (
        <AdminDashboard
          articles={articles}
          categories={categories}
          onSaveCategory={handleSaveCategory}
          onDeleteCategory={handleDeleteCategory}
          customCodeConfig={customCodeConfig}
          onSaveCustomCode={handleSaveCustomCode}
          branding={branding}
          onSaveBranding={handleSaveBranding}
          onSaveArticle={handleSaveArticle}
          onDeleteArticle={handleDeleteArticle}
          onViewLive={(art) => {
            setAdminOpen(false);
            navigateToArticle(art);
          }}
          onCloseAdmin={() => setAdminOpen(false)}
          fineTuningConfig={fineTuningConfig}
          onUpdateFineTuning={handleUpdateFineTuning}
          schedulerConfig={schedulerConfig}
          onUpdateScheduler={handleUpdateScheduler}
          adSenseConfig={adSenseConfig}
          onUpdateAdSense={handleUpdateAdSense}
          securityAuditLog={securityAuditLog}
          onLogSecurityEvent={logSecurityEvent}
          isDefaultPasscode={isDefaultPasscode}
          onPasscodeChanged={() => setIsDefaultPasscode(false)}
        />
      ) : (
        /* Public Broadsheet Portal View */
        <>
          <PublicHeader
            categories={categories}
            currentCategory={currentCategory}
            onSelectCategory={(cat) => navigateToCategory(cat)}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onOpenAdmin={handleOpenAdminTrigger}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            branding={branding}
            onNavigateHome={navigateToHome}
            onNavigateToPage={(slug) => navigateToPage(slug)}
          />

          <BreakingTicker
            articles={articles}
            currentLanguage={currentLanguage}
            onSelectArticle={(art) => navigateToArticle(art)}
          />

          <main className="flex-1">
            {activeCustomPage ? (
              <CustomPageView
                page={activeCustomPage}
                onBack={navigateToHome}
                branding={branding}
              />
            ) : selectedArticle ? (
              <ArticleDetail
                article={selectedArticle}
                onBack={navigateToHome}
                currentLanguage={currentLanguage}
                onSelectArticle={(art) => navigateToArticle(art)}
                allArticles={articles}
                adSenseConfig={adSenseConfig}
                customCodeConfig={customCodeConfig}
                branding={branding}
                onUpdateArticle={(updated) => {
                  setSelectedArticle(updated);
                  handleSaveArticle(updated);
                }}
              />
            ) : (
              <FrontPage
                articles={articles}
                categories={categories}
                currentCategory={currentCategory}
                onSelectCategory={(cat) => navigateToCategory(cat)}
                currentLanguage={currentLanguage}
                onSelectArticle={(art) => navigateToArticle(art)}
                searchQuery={searchQuery}
                adSenseConfig={adSenseConfig}
                branding={branding}
              />
            )}
          </main>

          {/* Footer */}
          <footer className="bg-stone-950 text-stone-300 border-t border-stone-800 mt-16 pt-12 pb-8 text-xs font-mono">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              {customCodeConfig.footerHtml && (
                <div
                  id="custom-footer-injection"
                  className="pb-6 border-b border-stone-800 text-stone-300"
                  dangerouslySetInnerHTML={{ __html: customCodeConfig.footerHtml }}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-stone-800">
                <div className="space-y-3">
                  {branding.logoUrl ? (
                    <img
                      src={branding.logoUrl}
                      alt={branding.siteName}
                      className="h-9 max-w-[180px] object-contain brightness-0 invert cursor-pointer"
                      onClick={navigateToHome}
                    />
                  ) : (
                    <span
                      onClick={navigateToHome}
                      className="font-editorial-serif font-black text-xl text-white tracking-tight uppercase block cursor-pointer hover:text-stone-300 transition-colors"
                    >
                      {branding.siteName || 'GLOBAL 24x7'}
                    </span>
                  )}
                  <p className="text-stone-400 font-editorial-prose text-xs leading-relaxed">
                    {branding.aboutText ||
                      'Global 24x7 is an independent, 24-hour international digital broadsheet delivering rigorous reporting, investigative analysis, and timeless guides.'}
                  </p>
                  {branding.socialLinks && (
                    <div className="flex items-center gap-3 pt-2 text-stone-400">
                      {branding.socialLinks.twitter && (
                        <a
                          href={branding.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-white transition-colors"
                          title="Twitter / X"
                        >
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                      {branding.socialLinks.facebook && (
                        <a
                          href={branding.socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-white transition-colors"
                          title="Facebook"
                        >
                          <Facebook className="w-4 h-4" />
                        </a>
                      )}
                      {branding.socialLinks.linkedin && (
                        <a
                          href={branding.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-white transition-colors"
                          title="LinkedIn"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {branding.socialLinks.youtube && (
                        <a
                          href={branding.socialLinks.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-white transition-colors"
                          title="YouTube"
                        >
                          <Youtube className="w-4 h-4" />
                        </a>
                      )}
                      {branding.socialLinks.telegram && (
                        <a
                          href={branding.socialLinks.telegram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-white transition-colors"
                          title="Telegram"
                        >
                          <Send className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="font-bold text-white uppercase tracking-wider mb-2">
                    Departments
                  </div>
                  <ul className="space-y-1.5 text-stone-400">
                    {categories.slice(0, 6).map((d) => (
                      <li key={d.id}>
                        <button
                          onClick={() => navigateToCategory(d.name)}
                          className="hover:text-white transition-colors text-left cursor-pointer"
                        >
                          {d.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="font-bold text-white uppercase tracking-wider mb-2">
                    Policies & Bureau
                  </div>
                  <ul className="space-y-1.5 text-stone-400">
                    {branding.footerLinks && branding.footerLinks.length > 0 ? (
                      branding.footerLinks.map((link) => (
                        <li key={link.id}>
                          {link.url.startsWith('/page/') ? (
                            <button
                              onClick={() => {
                                const slug = link.url.replace('/page/', '');
                                navigateToPage(slug);
                              }}
                              className="hover:text-white transition-colors text-left cursor-pointer"
                            >
                              {link.label}
                            </button>
                          ) : (
                            <a
                              href={link.url}
                              className="hover:text-white transition-colors"
                            >
                              {link.label}
                            </a>
                          )}
                        </li>
                      ))
                    ) : (
                      <>
                        <li>
                          <button
                            onClick={() => navigateToPage('privacy-policy')}
                            className="hover:text-white cursor-pointer"
                          >
                            Privacy Policy
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => navigateToPage('terms-of-service')}
                            className="hover:text-white cursor-pointer"
                          >
                            Terms of Service
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => navigateToPage('editorial-guidelines')}
                            className="hover:text-white cursor-pointer"
                          >
                            Editorial Guidelines
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => navigateToPage('contact-us')}
                            className="hover:text-white cursor-pointer"
                          >
                            Contact Bureau
                          </button>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <div>
                  <div className="font-bold text-white uppercase tracking-wider mb-2">
                    Compliance & Bureau
                  </div>
                  <ul className="space-y-1.5 text-stone-400 mb-3">
                    <li>
                      <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>Sitemap.xml</span>
                      </a>
                    </li>
                    <li>
                      <a href="/rss.xml" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1">
                        <Rss className="w-3 h-3" />
                        <span>RSS 2.0 Global Feed</span>
                      </a>
                    </li>
                    <li>
                      <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span>Robots.txt</span>
                      </a>
                    </li>
                    <li className="text-stone-500 text-[11px] leading-tight pt-1">
                      {branding.complianceNotice || 'Google AdSense & Schema.org Compliant Broadsheet Architecture'}
                    </li>
                  </ul>
                  <button
                    onClick={handleOpenAdminTrigger}
                    className="px-3 py-1.5 bg-stone-900 border border-stone-700 hover:bg-stone-800 text-stone-200 rounded flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Editorial Suite Access</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-4">
                <span>
                  {branding.copyrightText || `© ${new Date().getFullYear()} Global 24x7 News Network. All rights reserved.`}
                </span>
                <div className="flex items-center gap-4 flex-wrap">
                  <span>{branding.attributionNotice || 'Photography pre-cleared with SEO metadata'}</span>
                  <span>Schema.org NewsArticle Verified</span>
                  <button
                    onClick={handleOpenAdminTrigger}
                    className="text-stone-500 hover:text-stone-300 transition-colors cursor-pointer text-[10px] flex items-center gap-1 opacity-75 hover:opacity-100"
                    title="Editorial Staff Portal (Ctrl+Alt+E)"
                  >
                    <Lock className="w-2.5 h-2.5" />
                    <span>Staff Portal</span>
                  </button>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}

      <AdminAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={(isDef) => {
          if (isDef !== undefined) setIsDefaultPasscode(isDef);
          setAuthModalOpen(false);
          setAdminOpen(true);
        }}
        onLogSecurityEvent={logSecurityEvent}
      />
    </div>
  );
}

export default App;
