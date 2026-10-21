import React, { useState, useRef } from 'react';
import {
  Edit,
  Trash2,
  Plus,
  Eye,
  Search,
  Camera,
  Check,
  X,
  Save,
  Upload,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Download,
  Sparkles,
  Globe,
  ShieldCheck,
  Lightbulb,
  FileDown,
  FileUp,
  RefreshCw,
} from 'lucide-react';
import { Article, CustomCategory, ImageAttribution, MediaAsset } from '../../types';
import { CURATED_STOCK_PHOTOS } from '../../data/seedArticles';
import { safeFetchJson, authenticatedFetch } from '../../utils/apiSafe';
import { resolveArticleImage, searchWikimediaPressImages, WikimediaSearchResult } from '../../utils/imageService';
import { generateUniqueSlug } from '../../utils/slugs';

interface ArticlesCMSProps {
  articles: Article[];
  categories: CustomCategory[];
  onSaveArticle: (article: Article) => void;
  onDeleteArticle: (id: string) => void;
  onViewLive: (article: Article) => void;
  onRefreshArticles?: () => void;
}

interface OptimizedHeadlines {
  broadsheet: string;
  breaking: string;
  seo: string;
  explainer: string;
  viral: string;
  metaDescription: string;
  focusKeywords: string[];
}

interface FactCheckReport {
  confidenceScore: number;
  riskRating: 'Low' | 'Medium' | 'High';
  summary: string;
  claims: Array<{
    claim: string;
    status: string;
    editorialGuidance: string;
  }>;
}

export const ArticlesCMS: React.FC<ArticlesCMSProps> = ({
  articles,
  categories,
  onSaveArticle,
  onDeleteArticle,
  onViewLive,
  onRefreshArticles,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [serverMediaModalOpen, setServerMediaModalOpen] = useState(false);
  const [serverMediaList, setServerMediaList] = useState<MediaAsset[]>([]);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');

  // Image upload & localization states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDownloadingToLocal, setIsDownloadingToLocal] = useState(false);
  const [imageActionMessage, setImageActionMessage] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Wikimedia Press Photo Finder modal
  const [wikiModalOpen, setWikiModalOpen] = useState(false);
  const [wikiQuery, setWikiQuery] = useState('');
  const [wikiResults, setWikiResults] = useState<WikimediaSearchResult[]>([]);
  const [isSearchingWiki, setIsSearchingWiki] = useState(false);
  const [isImportingWikiItem, setIsImportingWikiItem] = useState<string | null>(null);

  // AI Headline Optimizer modal
  const [headlineModalOpen, setHeadlineModalOpen] = useState(false);
  const [isOptimizingHeadline, setIsOptimizingHeadline] = useState(false);
  const [optimizedHeadlines, setOptimizedHeadlines] = useState<OptimizedHeadlines | null>(null);

  // AI Fact-Check modal
  const [factCheckModalOpen, setFactCheckModalOpen] = useState(false);
  const [isFactChecking, setIsFactChecking] = useState(false);
  const [factCheckReport, setFactCheckReport] = useState<FactCheckReport | null>(null);

  const filtered = articles.filter((art) => {
    if (categoryFilter !== 'All' && art.category !== categoryFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      art.title.toLowerCase().includes(q) ||
      art.summary.toLowerCase().includes(q) ||
      art.category.toLowerCase().includes(q)
    );
  });

  const fetchServerMedia = async () => {
    setIsMediaLoading(true);
    try {
      const res = await safeFetchJson<{ success: boolean; media?: MediaAsset[] }>('/api/media');
      if (res.ok && res.data?.success && res.data.media) {
        setServerMediaList(res.data.media);
      }
    } catch (err) {
      console.warn('Failed to fetch server media:', err);
    } finally {
      setIsMediaLoading(false);
    }
  };

  const handleOpenServerMedia = () => {
    fetchServerMedia();
    setServerMediaModalOpen(true);
  };

  const handleSelectServerAsset = (asset: MediaAsset) => {
    if (!editingArticle) return;
    setEditingArticle({
      ...editingArticle,
      imageUrl: asset.localPath,
      imageCaption: asset.seoAltText || editingArticle.title,
      imageCredit: {
        photographer: 'Global 24x7 Media Bureau',
        source: 'Local Server Storage',
        license: 'Proprietary Image Archive',
        originalUrl: asset.localPath,
      },
    });
    setServerMediaModalOpen(false);
    setImageActionMessage(`Linked server media asset: ${asset.localPath}`);
    setTimeout(() => setImageActionMessage(null), 3000);
  };

  // Image Upload File Handler
  const handleUploadImageFile = async (files: FileList | null) => {
    if (!files || files.length === 0 || !editingArticle) return;
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      setImageActionMessage('Error: Image exceeds 10MB limit.');
      return;
    }

    setIsUploadingImage(true);
    setImageActionMessage(`Uploading ${file.name} directly to our server storage...`);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await safeFetchJson<{ success: boolean; asset?: MediaAsset; error?: string }>('/api/media/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              base64Data,
              category: editingArticle.category,
              seoAltText: `${editingArticle.title} - Global 24x7`,
              seoTitle: editingArticle.title,
            }),
          });
          if (res.ok && res.data?.success && res.data.asset) {
            setEditingArticle({
              ...editingArticle,
              imageUrl: res.data.asset.localPath,
              imageCaption: res.data.asset.seoAltText || editingArticle.title,
              imageCredit: {
                photographer: 'Global 24x7 Media Bureau',
                source: 'Local Server Storage',
                license: 'Proprietary Image Archive',
              },
            });
            setImageActionMessage(`Image uploaded directly to our server storage: ${res.data.asset.localPath}`);
            setTimeout(() => setImageActionMessage(null), 4000);
          } else {
            setImageActionMessage(`Upload failed: ${res.data?.error || res.error || 'Server error'}`);
          }
        } catch (uploadErr: any) {
          setImageActionMessage(`Upload error: ${uploadErr.message}`);
        } finally {
          setIsUploadingImage(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.onerror = () => {
        setImageActionMessage('Could not read image file.');
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setImageActionMessage(`Upload processing error: ${err.message}`);
      setIsUploadingImage(false);
    }
  };

  const handleDownloadCurrentUrlToLocal = async () => {
    if (!editingArticle || !editingArticle.imageUrl || !editingArticle.imageUrl.startsWith('http')) return;
    setIsDownloadingToLocal(true);
    setImageActionMessage('Downloading external image and archiving locally on server...');

    try {
      const res = await safeFetchJson<{ success: boolean; asset?: MediaAsset; error?: string }>('/api/media/download-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: editingArticle.imageUrl,
          category: editingArticle.category,
          topicTitle: editingArticle.title,
        }),
      });
      if (res.ok && res.data?.success && res.data.asset) {
        setEditingArticle({
          ...editingArticle,
          imageUrl: res.data.asset.localPath,
          imageCredit: {
            ...editingArticle.imageCredit,
            source: 'Global 24x7 Local Server Storage',
          },
        });
        setImageActionMessage(`Image localized and saved to our server at ${res.data.asset.localPath}!`);
        setTimeout(() => setImageActionMessage(null), 4000);
      } else {
        setImageActionMessage(`Download failed: ${res.data?.error || res.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setImageActionMessage(`Error: ${err.message}`);
    } finally {
      setIsDownloadingToLocal(false);
    }
  };

  const handleGenerateAiVisual = async () => {
    if (!editingArticle) return;
    setImageActionMessage('Synthesizing concrete photojournalistic AI visual matching headline...');
    try {
      const visual = resolveArticleImage(
        editingArticle.category,
        editingArticle.title,
        editingArticle.tags || [],
        'ai-generated',
        `Award-winning editorial documentary photograph of ${editingArticle.title}`
      );
      
      setEditingArticle({
        ...editingArticle,
        imageUrl: visual.url,
        imageCaption: visual.caption,
        imageCredit: visual.credit,
      });

      // Automatically download to local server storage
      try {
        const downloadRes = await safeFetchJson<{ success: boolean; asset?: MediaAsset }>('/api/media/download-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: visual.url,
            category: editingArticle.category,
            topicTitle: editingArticle.title,
          }),
        });
        if (downloadRes.ok && downloadRes.data?.asset) {
          setEditingArticle((prev) =>
            prev
              ? {
                  ...prev,
                  imageUrl: downloadRes.data!.asset!.localPath,
                  imageCredit: { ...visual.credit, source: 'Global 24x7 Local Server Storage' },
                }
              : null
          );
          setImageActionMessage('✓ AI visual generated and permanently saved to your server /media/!');
        } else {
          setImageActionMessage('✓ AI visual generated successfully!');
        }
      } catch {
        setImageActionMessage('✓ AI visual generated successfully!');
      }

      setTimeout(() => setImageActionMessage(null), 3500);
    } catch (err: any) {
      setImageActionMessage(`Error: ${err.message}`);
    }
  };

  // Open Wikimedia Finder modal
  const handleOpenWikimediaFinder = () => {
    if (!editingArticle) return;
    setWikiQuery(editingArticle.title.slice(0, 50));
    setWikiModalOpen(true);
    handleSearchWikimedia(editingArticle.title.slice(0, 50));
  };

  const handleSearchWikimedia = async (customQuery?: string) => {
    const q = customQuery || wikiQuery;
    if (!q.trim()) return;
    setIsSearchingWiki(true);
    try {
      const res = await safeFetchJson<{ success: boolean; results?: WikimediaSearchResult[] }>(
        `/api/media/search-wikimedia?q=${encodeURIComponent(q.trim())}&limit=12`
      );
      if (res.ok && res.data?.results) {
        setWikiResults(res.data.results);
      }
    } catch (err) {
      console.warn('Failed to query Wikimedia:', err);
    } finally {
      setIsSearchingWiki(false);
    }
  };

  const handleApplyWikimediaPhoto = async (item: WikimediaSearchResult) => {
    if (!editingArticle) return;
    setIsImportingWikiItem(item.url);
    try {
      const res = await safeFetchJson<{ success: boolean; imageUrl?: string; credit?: ImageAttribution; error?: string }>(
        '/api/media/search-and-import-web',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            directUrl: item.url,
            category: editingArticle.category,
            articleTitle: editingArticle.title,
            articleSlug: editingArticle.slug,
            photographer: item.photographer,
            license: item.license,
            pageUrl: item.pageUrl,
          }),
        }
      );

      if (res.ok && res.data?.success && res.data.imageUrl) {
        setEditingArticle({
          ...editingArticle,
          imageUrl: res.data.imageUrl,
          imageCaption: `${item.description || editingArticle.title} — International Press Wire`,
          imageCredit: res.data.credit || {
            photographer: item.photographer,
            source: 'Wikimedia Commons / Open Press Wire',
            license: item.license,
            originalUrl: item.pageUrl,
          },
        });
        setWikiModalOpen(false);
        setImageActionMessage(`✓ Copyright-free press photo archived to server: ${res.data.imageUrl}`);
        setTimeout(() => setImageActionMessage(null), 4000);
      } else {
        alert(res.data?.error || 'Failed to import photo from Wikimedia.');
      }
    } catch (err: any) {
      alert(`Error importing photo: ${err.message}`);
    } finally {
      setIsImportingWikiItem(null);
    }
  };

  // AI Headline Optimizer
  const handleOpenHeadlineOptimizer = async () => {
    if (!editingArticle) return;
    setHeadlineModalOpen(true);
    setIsOptimizingHeadline(true);
    try {
      const res = await safeFetchJson<{ success: boolean; headlines?: OptimizedHeadlines }>('/api/ai/optimize-headline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingArticle.title,
          summary: editingArticle.summary,
          content: editingArticle.content,
          category: editingArticle.category,
        }),
      });
      if (res.ok && res.data?.headlines) {
        setOptimizedHeadlines(res.data.headlines);
      }
    } catch (err) {
      console.warn('Failed to optimize headline:', err);
    } finally {
      setIsOptimizingHeadline(false);
    }
  };

  const handleApplyHeadline = (headline: string) => {
    if (!editingArticle) return;
    const newSlug = generateUniqueSlug(headline, articles, editingArticle.id);
    setEditingArticle({
      ...editingArticle,
      title: headline,
      slug: newSlug,
      seo: {
        ...editingArticle.seo,
        metaTitle: optimizedHeadlines?.seo || `${headline} | Global 24x7`,
        metaDescription: optimizedHeadlines?.metaDescription || editingArticle.summary,
        focusKeywords: optimizedHeadlines?.focusKeywords || editingArticle.seo?.focusKeywords || [editingArticle.category.toLowerCase()],
      },
    });
    setHeadlineModalOpen(false);
  };

  // AI Fact-Check
  const handleOpenFactCheck = async () => {
    if (!editingArticle) return;
    setFactCheckModalOpen(true);
    setIsFactChecking(true);
    try {
      const res = await safeFetchJson<{ success: boolean; factCheck?: FactCheckReport }>('/api/ai/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingArticle.title,
          summary: editingArticle.summary,
          content: editingArticle.content,
        }),
      });
      if (res.ok && res.data?.factCheck) {
        setFactCheckReport(res.data.factCheck);
      }
    } catch (err) {
      console.warn('Failed to run fact check:', err);
    } finally {
      setIsFactChecking(false);
    }
  };

  // Backup System Handlers
  const handleExportBackup = async () => {
    setIsBackingUp(true);
    setBackupMessage({ text: 'Generating full data backup (.json)...', type: 'info' });
    try {
      const res = await authenticatedFetch('/api/backup/export');
      if (!res.ok) throw new Error('Backup export failed on server');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `global24x7-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setBackupMessage({ text: '✓ Full system backup downloaded successfully to your computer!', type: 'success' });
      setTimeout(() => setBackupMessage(null), 5000);
    } catch (err: any) {
      setBackupMessage({ text: `Backup failed: ${err.message}`, type: 'error' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Are you sure you want to restore this backup? This will restore articles, categories, media index, and customized settings.')) {
      if (backupInputRef.current) backupInputRef.current.value = '';
      return;
    }

    setIsBackingUp(true);
    setBackupMessage({ text: `Restoring data from ${file.name}...`, type: 'info' });

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      const res = await safeFetchJson<{ success: boolean; message?: string; error?: string }>('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData),
      });

      if (res.ok && res.data?.success) {
        setBackupMessage({ text: res.data.message || '✓ Backup restored successfully!', type: 'success' });
        if (onRefreshArticles) onRefreshArticles();
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setBackupMessage({ text: res.data?.error || res.error || 'Restore failed', type: 'error' });
      }
    } catch (err: any) {
      setBackupMessage({ text: `Restore error: ${err.message}`, type: 'error' });
    } finally {
      setIsBackingUp(false);
      if (backupInputRef.current) backupInputRef.current.value = '';
    }
  };

  const handleCreateNew = () => {
    const defaultTitle = 'New Editorial Dispatch Title';
    const uniqueSlug = generateUniqueSlug(defaultTitle, articles);
    const newArt: Article = {
      id: `art-${Date.now()}`,
      slug: uniqueSlug,
      title: defaultTitle,
      summary: 'Executive deck summarizing the core thesis and strategic developments.',
      content: `The editorial desk has filed this report regarding recent systemic developments.\n\n## Analytical Context\nA rigorous examination of primary factors indicates long-term institutional adjustments across the sector.\n\n## Forward Projections\nStakeholders anticipate further policy clarification within the upcoming fiscal cycle.`,
      keyTakeaways: [
        'Strategic realignment observed across institutional participants.',
        'Heightened transparency and compliance protocols prioritized.',
      ],
      tags: ['General', 'Analysis', 'Dispatch'],
      category: categories[0]?.name || 'Technology',
      author: {
        name: 'Global 24x7 Editorial Desk',
        title: 'Senior Correspondent',
      },
      publishedAt: new Date().toISOString(),
      readingTimeMinutes: 4,
      status: 'draft',
      featuredRank: 3,
      imageUrl: CURATED_STOCK_PHOTOS.Technology[0].url,
      imageCaption: CURATED_STOCK_PHOTOS.Technology[0].caption,
      imageCredit: CURATED_STOCK_PHOTOS.Technology[0].credit,
      language: 'en',
      viewsCount: 0,
      likesCount: 0,
      seo: {
        metaTitle: 'New Editorial Dispatch',
        metaDescription: 'Executive deck summarizing strategic developments.',
        focusKeywords: ['strategy', 'policy', 'analysis'],
      },
    };
    setEditingArticle(newArt);
  };

  const isCurrentUrlLocal = Boolean(
    editingArticle?.imageUrl && editingArticle.imageUrl.startsWith('/media/')
  );

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title, category..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded focus:outline-none focus:border-stone-900"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded text-stone-700"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Controls: Backup, Restore, New Article */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={backupInputRef}
            type="file"
            accept=".json"
            onChange={handleRestoreBackupFile}
            className="hidden"
            id="restore-backup-input"
          />
          <button
            onClick={handleExportBackup}
            disabled={isBackingUp}
            className="px-3 py-1.5 text-xs font-mono font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Download full backup of all articles, categories, media, and settings to your computer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isBackingUp ? 'Exporting...' : 'Backup Articles (.json)'}</span>
          </button>
          <label
            htmlFor="restore-backup-input"
            className="px-3 py-1.5 text-xs font-mono font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded border border-stone-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Restore articles and settings from a previously downloaded .json backup"
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Restore Backup</span>
          </label>
          <button
            onClick={handleCreateNew}
            className="px-3 py-1.5 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Article</span>
          </button>
        </div>
      </div>

      {backupMessage && (
        <div
          className={`p-3 rounded text-xs font-mono flex items-center justify-between border ${
            backupMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : backupMessage.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-stone-100 border-stone-300 text-stone-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {backupMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {backupMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{backupMessage.text}</span>
          </div>
          <button onClick={() => setBackupMessage(null)} className="text-stone-400 hover:text-stone-700 ml-4 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Articles Table */}
      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 font-mono uppercase text-stone-500 text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Visual</th>
                <th className="py-2.5 px-3">Title & Summary</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">URL Slug</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-150">
              {filtered.map((art) => {
                const isLocal = Boolean(art.imageUrl && art.imageUrl.startsWith('/media/'));
                return (
                  <tr key={art.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-2.5 px-3 w-16">
                      <div className="w-12 h-8 rounded bg-stone-100 overflow-hidden relative border border-stone-200">
                        {art.imageUrl ? (
                          <img
                            src={art.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=100&q=80';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-stone-400">
                            None
                          </div>
                        )}
                        {isLocal && (
                          <span
                            className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white"
                            title="Stored locally on our server"
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 max-w-md">
                      <div className="font-semibold text-stone-900 line-clamp-1">{art.title}</div>
                      <div className="text-stone-500 text-[11px] line-clamp-1">{art.summary}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-stone-100 text-stone-700 border border-stone-200">
                        {art.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-stone-500">
                      <div className="line-clamp-1 text-emerald-800">/{art.slug}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                          art.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {art.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewLive(art)}
                          className="p-1 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-100"
                          title="View live article"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingArticle(art)}
                          className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                          title="Edit article"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${art.title}"?`)) {
                              onDeleteArticle(art.id);
                            }
                          }}
                          className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                          title="Delete article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Article Editor Modal */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-stone-300 shadow-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-4">
              <div>
                <h4 className="text-sm font-bold font-mono uppercase text-stone-900">
                  {editingArticle.id ? 'Edit Editorial Dispatch' : 'New Article'}
                </h4>
                <p className="text-xs text-stone-500 font-mono">
                  Canonical URL: /{editingArticle.language || 'en'}/article/{editingArticle.slug}
                </p>
              </div>
              <button
                onClick={() => setEditingArticle(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Headline with AI Optimizer Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700 font-mono uppercase">
                    Headline
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenHeadlineOptimizer}
                    className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 rounded border border-purple-200 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Lightbulb className="w-3 h-3 text-purple-600" />
                    <span>✨ AI Optimize Headline</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={editingArticle.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    const autoSlug = generateUniqueSlug(newTitle, articles, editingArticle.id);
                    setEditingArticle({ ...editingArticle, title: newTitle, slug: autoSlug });
                  }}
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded focus:outline-none focus:border-stone-900 font-editorial-serif font-bold"
                />
              </div>

              {/* URL Slug (Enforced Unique) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700 font-mono uppercase">
                    URL Slug (Guaranteed Unique)
                  </label>
                  <span className="text-[10px] font-mono text-emerald-700">✓ Collision-Protected URL</span>
                </div>
                <input
                  type="text"
                  value={editingArticle.slug}
                  onChange={(e) =>
                    setEditingArticle({
                      ...editingArticle,
                      slug: generateUniqueSlug(e.target.value, articles, editingArticle.id),
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded font-mono text-stone-800"
                />
              </div>

              {/* Deck / Summary */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
                  Deck / Executive Summary
                </label>
                <textarea
                  rows={2}
                  value={editingArticle.summary}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, summary: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded focus:outline-none focus:border-stone-900 font-editorial-prose"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
                    Category
                  </label>
                  <select
                    value={editingArticle.category}
                    onChange={(e) =>
                      setEditingArticle({
                        ...editingArticle,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
                    Publication Status
                  </label>
                  <select
                    value={editingArticle.status}
                    onChange={(e) =>
                      setEditingArticle({
                        ...editingArticle,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft Review</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
                    Front-Page Rank
                  </label>
                  <select
                    value={editingArticle.featuredRank}
                    onChange={(e) =>
                      setEditingArticle({
                        ...editingArticle,
                        featuredRank: parseInt(e.target.value, 10) as any,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded"
                  >
                    <option value={1}>★ 1 (Lead Story)</option>
                    <option value={2}>2 (Secondary Feature)</option>
                    <option value={3}>3 (Column)</option>
                  </select>
                </div>
              </div>

              {/* Photo Section with Wikimedia Finder and AI Scene Generator */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-md space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-stone-800 font-mono uppercase">
                    <Camera className="w-4 h-4 text-stone-600" />
                    <span>Article Feature Image & Sourcing</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadImageFile(e.target.files)}
                      className="hidden"
                      id="article-image-upload"
                    />
                    <label
                      htmlFor="article-image-upload"
                      className="px-2.5 py-1 text-xs bg-stone-900 hover:bg-stone-800 text-white rounded font-mono flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingImage ? 'Uploading...' : 'Upload File'}</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenServerMedia}
                      className="px-2.5 py-1 text-xs bg-stone-200 hover:bg-stone-300 text-stone-800 rounded font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Server Media</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenWikimediaFinder}
                      className="px-2.5 py-1 text-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded font-mono flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                      title="Search & import real copyright-free press photos from Wikimedia Commons"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Find Press Photo (Wikimedia)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateAiVisual}
                      className="px-2.5 py-1 text-xs bg-purple-700 hover:bg-purple-800 text-white rounded font-mono flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                      title="Synthesize custom AI photojournalism image matching this specific article headline"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Synthesize AI Scene</span>
                    </button>
                  </div>
                </div>

                {imageActionMessage && (
                  <div className="p-2 bg-stone-100 border border-stone-300 rounded text-xs font-mono text-stone-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{imageActionMessage}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start gap-4 p-2 bg-white rounded border border-stone-200">
                  {editingArticle.imageUrl ? (
                    <div className="relative w-36 h-24 bg-stone-100 rounded overflow-hidden shrink-0 border border-stone-200 group">
                      <img
                        src={editingArticle.imageUrl}
                        alt="Article preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-36 h-24 bg-stone-100 rounded border border-dashed border-stone-300 flex items-center justify-center text-xs font-mono text-stone-400 shrink-0">
                      No Image
                    </div>
                  )}

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isCurrentUrlLocal ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>✓ Stored on Our Server (/media/*)</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>External Image Link</span>
                          </span>
                        )}
                      </div>
                      {!isCurrentUrlLocal && editingArticle.imageUrl && (
                        <button
                          type="button"
                          onClick={handleDownloadCurrentUrlToLocal}
                          disabled={isDownloadingToLocal}
                          className="px-2 py-1 text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded font-mono flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <HardDrive className="w-3 h-3" />
                          <span>{isDownloadingToLocal ? 'Saving...' : 'Save to Our Server'}</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-stone-500 font-mono uppercase">
                          Image URL / Server Path
                        </label>
                        <input
                          type="text"
                          value={editingArticle.imageUrl}
                          onChange={(e) =>
                            setEditingArticle({ ...editingArticle, imageUrl: e.target.value })
                          }
                          className="w-full px-2 py-1 text-xs bg-stone-50 border border-stone-300 rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500 font-mono uppercase">
                          Photographer & License Credit
                        </label>
                        <input
                          type="text"
                          value={`${editingArticle.imageCredit?.photographer || 'Editorial Bureau'} (${editingArticle.imageCredit?.license || 'CC-BY'})`}
                          onChange={(e) =>
                            setEditingArticle({
                              ...editingArticle,
                              imageCredit: {
                                ...editingArticle.imageCredit,
                                photographer: e.target.value,
                              },
                            })
                          }
                          className="w-full px-2 py-1 text-xs bg-stone-50 border border-stone-300 rounded"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-500 font-mono uppercase">
                        Image Caption & Alt Text
                      </label>
                      <input
                        type="text"
                        value={editingArticle.imageCaption}
                        onChange={(e) =>
                          setEditingArticle({ ...editingArticle, imageCaption: e.target.value })
                        }
                        className="w-full px-2 py-1 text-xs bg-stone-50 border border-stone-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Article Content with AI Fact Check Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700 font-mono uppercase">
                    Article Body (Markdown)
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenFactCheck}
                    className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>🛡️ AI Fact-Check & Verification</span>
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={editingArticle.content}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, content: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded focus:outline-none focus:border-stone-900 font-mono leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-200 mt-5">
              <button
                type="button"
                onClick={() => setEditingArticle(null)}
                className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingArticle.title.trim()) return;
                  const finalArticle = {
                    ...editingArticle,
                    slug: generateUniqueSlug(editingArticle.slug || editingArticle.title, articles, editingArticle.id),
                  };
                  onSaveArticle(finalArticle);
                  setEditingArticle(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-stone-900 text-white rounded hover:bg-stone-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save & Publish Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wikimedia Press Media Finder Modal */}
      {wikiModalOpen && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col border border-stone-300 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="text-sm font-bold font-mono uppercase text-stone-900">
                    Find Copyright-Free Press Photos (Wikimedia Commons)
                  </h4>
                  <p className="text-[11px] text-stone-500 font-mono">
                    Official news, political, sports, and documentary archives under Creative Commons CC-BY
                  </p>
                </div>
              </div>
              <button onClick={() => setWikiModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchWikimedia();
              }}
              className="flex gap-2 mb-4"
            >
              <input
                type="text"
                placeholder="Search world events, politicians, space missions, organizations..."
                value={wikiQuery}
                onChange={(e) => setWikiQuery(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs font-mono border border-stone-300 rounded focus:border-stone-900 outline-none"
              />
              <button
                type="submit"
                disabled={isSearchingWiki || !wikiQuery.trim()}
                className="px-4 py-1.5 text-xs font-mono font-semibold bg-stone-900 text-white rounded hover:bg-stone-800 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Search className={`w-3.5 h-3.5 ${isSearchingWiki ? 'animate-spin' : ''}`} />
                <span>{isSearchingWiki ? 'Searching...' : 'Search'}</span>
              </button>
            </form>

            <div className="flex-1 overflow-y-auto">
              {isSearchingWiki ? (
                <div className="py-12 text-center text-xs font-mono text-stone-500 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-stone-700" />
                  <span>Searching Wikimedia press wire...</span>
                </div>
              ) : wikiResults.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-stone-500">
                  No press photos found for &quot;{wikiQuery}&quot;. Try a broader keyword (e.g. &quot;ISRO&quot;, &quot;White House&quot;, &quot;Parliament&quot;).
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
                  {wikiResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="border border-stone-200 hover:border-emerald-600 rounded bg-white p-2 transition-all flex flex-col justify-between"
                    >
                      <div className="aspect-video w-full bg-stone-100 rounded overflow-hidden mb-2 relative">
                        <img
                          src={item.thumbUrl}
                          alt={item.description}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute bottom-1 right-1 text-[9px] font-mono px-1 bg-black/75 text-white rounded">
                          {item.license.slice(0, 15)}
                        </span>
                      </div>
                      <div className="text-[11px] font-medium text-stone-800 line-clamp-1 mb-0.5">
                        {item.description || item.title}
                      </div>
                      <div className="text-[10px] text-stone-500 line-clamp-1 mb-2 font-mono">
                        By {item.photographer}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyWikimediaPhoto(item)}
                        disabled={isImportingWikiItem === item.url}
                        className="w-full py-1 text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Download className="w-3 h-3" />
                        <span>{isImportingWikiItem === item.url ? 'Importing...' : 'Use for Article'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Headline Optimizer Modal */}
      {headlineModalOpen && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full border border-stone-300 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-600" />
                <h4 className="text-sm font-bold font-mono uppercase text-stone-900">
                  AI Headline & SEO Optimizer
                </h4>
              </div>
              <button onClick={() => setHeadlineModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isOptimizingHeadline ? (
              <div className="py-12 text-center text-xs font-mono text-stone-500 flex flex-col items-center gap-2">
                <Sparkles className="w-5 h-5 animate-spin text-purple-600" />
                <span>Analyzing draft and generating 5 high-converting headline variants...</span>
              </div>
            ) : optimizedHeadlines ? (
              <div className="space-y-3">
                <p className="text-xs text-stone-500 font-mono mb-2">
                  Select a generated headline style to apply to this article:
                </p>

                {[
                  { label: 'Broadsheet Style (Authoritative)', key: 'broadsheet', text: optimizedHeadlines.broadsheet },
                  { label: 'Breaking News Wire (High Urgency)', key: 'breaking', text: optimizedHeadlines.breaking },
                  { label: 'SEO Search Magnet (Google Ranks)', key: 'seo', text: optimizedHeadlines.seo },
                  { label: 'Analytical Explainer (How / Why)', key: 'explainer', text: optimizedHeadlines.explainer },
                  { label: 'High-CTR Social (Engaging)', key: 'viral', text: optimizedHeadlines.viral },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => handleApplyHeadline(item.text)}
                    className="p-3 border border-stone-200 hover:border-purple-600 hover:bg-purple-50/40 rounded transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase text-stone-400 mb-1 group-hover:text-purple-700">
                      <span>{item.label}</span>
                      <span className="text-purple-600 font-bold">Apply &rarr;</span>
                    </div>
                    <div className="text-xs font-bold text-stone-900 font-editorial-serif">{item.text}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* AI Fact-Check & Verification Scanner Modal */}
      {factCheckModalOpen && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full border border-stone-300 shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-bold font-mono uppercase text-stone-900">
                  AI Editorial Fact-Check & Verification Scanner
                </h4>
              </div>
              <button onClick={() => setFactCheckModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isFactChecking ? (
              <div className="py-12 text-center text-xs font-mono text-stone-500 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                <span>Scanning article claims, statistics, and dates for journalistic veracity...</span>
              </div>
            ) : factCheckReport ? (
              <div className="space-y-4">
                <div className="p-3 bg-stone-50 border border-stone-200 rounded flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-stone-500">Editorial Confidence Score</div>
                    <div className="text-xl font-bold font-mono text-emerald-700">{factCheckReport.confidenceScore}%</div>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs font-mono uppercase rounded font-bold ${
                      factCheckReport.riskRating === 'Low'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {factCheckReport.riskRating} Risk Rating
                  </span>
                </div>

                <div className="text-xs text-stone-700 font-editorial-prose p-3 bg-stone-50 rounded border border-stone-200">
                  {factCheckReport.summary}
                </div>

                <div>
                  <h5 className="text-xs font-bold font-mono uppercase text-stone-900 mb-2">
                    Key Claims Verified ({factCheckReport.claims?.length || 0})
                  </h5>
                  <div className="space-y-2">
                    {factCheckReport.claims?.map((c, i) => (
                      <div key={i} className="p-2.5 border border-stone-200 rounded bg-white text-xs">
                        <div className="font-semibold text-stone-900 mb-1">&quot;{c.claim}&quot;</div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500">
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                            {c.status}
                          </span>
                          <span>{c.editorialGuidance}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Server Media Library Modal */}
      {serverMediaModalOpen && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col border border-stone-300 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-stone-700" />
                <h4 className="text-sm font-bold font-mono uppercase text-stone-900">
                  Select Image from Our Server Media Library
                </h4>
              </div>
              <button onClick={() => setServerMediaModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-3">
              <input
                type="text"
                placeholder="Search server media filenames or alt text..."
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-stone-300 rounded focus:border-stone-900 outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {isMediaLoading ? (
                <div className="py-12 text-center text-xs font-mono text-stone-500">Loading server media...</div>
              ) : serverMediaList.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-stone-500">
                  No images uploaded yet. Upload an image to /media/* above.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-1">
                  {serverMediaList
                    .filter(
                      (m) =>
                        !mediaSearch.trim() ||
                        m.filename.toLowerCase().includes(mediaSearch.toLowerCase()) ||
                        m.seoAltText?.toLowerCase().includes(mediaSearch.toLowerCase())
                    )
                    .map((asset) => (
                      <div
                        key={asset.id}
                        onClick={() => handleSelectServerAsset(asset)}
                        className="group border border-stone-200 hover:border-stone-900 rounded bg-stone-50 p-1.5 transition-all cursor-pointer"
                      >
                        <div className="aspect-video w-full bg-stone-200 rounded overflow-hidden mb-1.5">
                          <img
                            src={asset.localPath}
                            alt={asset.seoAltText}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="text-[10px] font-mono text-stone-700 line-clamp-1">{asset.filename}</div>
                        <div className="text-[9px] text-stone-400 font-mono">{asset.category}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
