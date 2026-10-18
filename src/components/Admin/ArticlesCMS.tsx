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
} from 'lucide-react';
import { Article, CustomCategory, ImageAttribution, MediaAsset } from '../../types';
import { CURATED_STOCK_PHOTOS } from '../../data/seedArticles';

interface ArticlesCMSProps {
  articles: Article[];
  categories: CustomCategory[];
  onSaveArticle: (article: Article) => void;
  onDeleteArticle: (id: string) => void;
  onViewLive: (article: Article) => void;
}

export const ArticlesCMS: React.FC<ArticlesCMSProps> = ({
  articles,
  categories,
  onSaveArticle,
  onDeleteArticle,
  onViewLive,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [serverMediaModalOpen, setServerMediaModalOpen] = useState(false);
  const [serverMediaList, setServerMediaList] = useState<MediaAsset[]>([]);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');

  // Image upload states inside article editor
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDownloadingToLocal, setIsDownloadingToLocal] = useState(false);
  const [imageActionMessage, setImageActionMessage] = useState<string | null>(null);

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
      const res = await fetch('/api/media');
      const data = await res.json();
      if (data.success && data.media) {
        setServerMediaList(data.media);
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

  const handleSelectServerMedia = (asset: MediaAsset) => {
    if (!editingArticle) return;
    setEditingArticle({
      ...editingArticle,
      imageUrl: asset.localPath,
      imageCaption: asset.seoAltText || editingArticle.imageCaption || editingArticle.title,
      imageCredit: {
        photographer: 'Global 24x7 Media Bureau',
        source: 'Local Server Storage',
        license: 'Archived Internal Asset',
      },
    });
    setServerMediaModalOpen(false);
    setImageActionMessage(`Attached server media: ${asset.filename}`);
    setTimeout(() => setImageActionMessage(null), 3000);
  };

  const handleUploadImageFile = async (files: FileList | null) => {
    if (!files || files.length === 0 || !editingArticle) return;
    const file = files[0];
    setIsUploadingImage(true);
    setImageActionMessage(`Uploading ${file.name} to server...`);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch('/api/media/upload', {
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
          const data = await res.json();
          if (data.success && data.asset) {
            setEditingArticle({
              ...editingArticle,
              imageUrl: data.asset.localPath,
              imageCaption: data.asset.seoAltText || editingArticle.title,
              imageCredit: {
                photographer: 'Global 24x7 Media Bureau',
                source: 'Local Server Storage',
                license: 'Proprietary Image Archive',
              },
            });
            setImageActionMessage(`Image uploaded directly to our server storage: ${data.asset.localPath}`);
            setTimeout(() => setImageActionMessage(null), 4000);
          } else {
            setImageActionMessage(`Upload failed: ${data.error || 'Server error'}`);
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
      const res = await fetch('/api/media/download-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: editingArticle.imageUrl,
          category: editingArticle.category,
          topicTitle: editingArticle.title,
        }),
      });
      const data = await res.json();
      if (data.success && data.asset) {
        setEditingArticle({
          ...editingArticle,
          imageUrl: data.asset.localPath,
          imageCredit: {
            ...editingArticle.imageCredit,
            source: 'Global 24x7 Local Server Storage',
          },
        });
        setImageActionMessage(`Image localized and saved to our server at ${data.asset.localPath}!`);
        setTimeout(() => setImageActionMessage(null), 4000);
      } else {
        setImageActionMessage(`Download failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setImageActionMessage(`Error: ${err.message}`);
    } finally {
      setIsDownloadingToLocal(false);
    }
  };

  const handleCreateNew = () => {
    const newArt: Article = {
      id: `art-${Date.now()}`,
      slug: `dispatch-${Date.now()}`,
      title: 'New Editorial Dispatch Title',
      summary: 'Executive deck summarizing the core thesis and strategic developments.',
      content: `The editorial desk has filed this report regarding recent systemic developments.\n\n## Analytical Context\nA rigorous examination of primary factors indicates long-term institutional adjustments across the sector.\n\n## Forward Projections\nStakeholders anticipate further policy clarification within the upcoming fiscal cycle.`,
      keyTakeaways: [
        'Strategic realignment observed across institutional participants.',
        'Policy harmonisation anticipated to take effect next quarter.',
        'Verification mechanisms validated through independent audit.',
      ],
      category: 'Technology',
      tags: ['Strategy', 'Policy', 'Analysis'],
      author: {
        name: 'Editorial Staff',
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

  const handleSelectCuratedPhoto = (photo: { url: string; caption: string; credit: ImageAttribution }) => {
    if (!editingArticle) return;
    setEditingArticle({
      ...editingArticle,
      imageUrl: photo.url,
      imageCaption: photo.caption,
      imageCredit: photo.credit,
    });
    setPhotoPickerOpen(false);
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
        <button
          onClick={handleCreateNew}
          className="px-3 py-1.5 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Article</span>
        </button>
      </div>

      {/* Articles Table */}
      <div className="bg-white border border-stone-200 rounded-sm overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Title & Slug</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Image Host</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3 text-right">Published</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((art) => {
                const isLocalImg = art.imageUrl && art.imageUrl.startsWith('/media/');
                return (
                  <tr key={art.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4 max-w-xs sm:max-w-md">
                      <div className="flex items-center gap-2">
                        {art.imageUrl && (
                          <img
                            src={art.imageUrl}
                            alt=""
                            className="w-10 h-7 object-cover rounded shrink-0 border border-stone-200"
                          />
                        )}
                        <div className="truncate">
                          <div className="font-semibold text-stone-900 truncate font-editorial-serif text-sm">
                            {art.title}
                          </div>
                          <div className="text-[11px] text-stone-400 font-mono truncate">
                            /{art.language || 'en'}/article/{art.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-stone-100 rounded text-stone-700 font-mono text-[10px] uppercase">
                        {art.category}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {isLocalImg ? (
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-mono font-semibold">
                          Our Server
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-mono">
                          External
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                          art.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {art.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-600">
                      {art.featuredRank === 1 ? '★ Lead' : art.featuredRank === 2 ? 'Secondary' : 'Column'}
                    </td>
                    <td className="py-3 px-3 text-right text-stone-500 font-mono text-[11px]">
                      {new Date(art.publishedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewLive(art)}
                          className="p-1 text-stone-400 hover:text-stone-800 transition-colors cursor-pointer"
                          title="View Live Article"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingArticle(art)}
                          className="p-1 text-stone-400 hover:text-stone-800 transition-colors cursor-pointer"
                          title="Edit Dispatch & Photo"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete dispatch "${art.title}"?`)) {
                              onDeleteArticle(art.id);
                            }
                          }}
                          className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Dispatch"
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

      {/* Edit / Create Article Full Modal */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white border border-stone-300 rounded shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div>
                <h4 className="text-base font-bold text-stone-900 font-editorial-serif">
                  {editingArticle.id.includes('art-') && editingArticle.title !== 'New Editorial Dispatch Title'
                    ? 'Edit Broadsheet Dispatch'
                    : 'Compose New Editorial Dispatch'}
                </h4>
                <p className="text-xs text-stone-500 font-mono">
                  Slug: /{editingArticle.language || 'en'}/article/{editingArticle.slug}
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
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
                  Headline
                </label>
                <input
                  type="text"
                  value={editingArticle.title}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, title: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded focus:outline-none focus:border-stone-900 font-editorial-serif font-bold"
                />
              </div>

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

              {/* Photo Section */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-md space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-stone-800 font-mono uppercase">
                    <Camera className="w-4 h-4 text-stone-600" />
                    <span>Article Feature Image & Server Storage</span>
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
                      <span>{isUploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenServerMedia}
                      className="px-2.5 py-1 text-xs bg-stone-200 hover:bg-stone-300 text-stone-800 rounded font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Media Library</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoPickerOpen(true)}
                      className="px-2.5 py-1 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded font-mono transition-colors cursor-pointer"
                    >
                      Stock Photos
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
                          className="px-2 py-1 text-[11px] font-mono bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Download className="w-3 h-3" />
                          <span>{isDownloadingToLocal ? 'Downloading...' : 'Download to Server'}</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-stone-500 font-mono uppercase">
                          Image URL / Local Server Path
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
                          Photographer Credit
                        </label>
                        <input
                          type="text"
                          value={editingArticle.imageCredit.photographer}
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

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
                  Article Body (Markdown)
                </label>
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
                  onSaveArticle(editingArticle);
                  setEditingArticle(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Local Server Media Library Picker Modal */}
      {serverMediaModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-stone-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-3xl bg-white border border-stone-300 rounded shadow-2xl p-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
              <div>
                <h4 className="text-sm font-bold text-stone-900 font-mono uppercase flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-700" />
                  <span>Select Image from Our Server Storage (/media/*)</span>
                </h4>
                <p className="text-xs text-stone-500 font-mono">
                  All images hosted directly on our server disk.
                </p>
              </div>
              <button
                onClick={() => setServerMediaModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-3">
              <input
                type="text"
                placeholder="Search server media..."
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-stone-300 rounded"
              />
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px]">
              {isMediaLoading ? (
                <div className="p-8 text-center text-xs font-mono text-stone-400">
                  Loading server media library...
                </div>
              ) : serverMediaList.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-stone-400">
                  No images found on server yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {serverMediaList
                    .filter((m) =>
                      m.filename.toLowerCase().includes(mediaSearch.toLowerCase()) ||
                      m.seoAltText.toLowerCase().includes(mediaSearch.toLowerCase())
                    )
                    .map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleSelectServerMedia(m)}
                        className="group cursor-pointer border border-stone-200 rounded overflow-hidden hover:border-stone-900 transition-all bg-stone-50 flex flex-col justify-between"
                      >
                        <div className="aspect-[16/10] overflow-hidden bg-stone-200 relative">
                          <img
                            src={m.localPath}
                            alt={m.seoAltText}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 text-white rounded text-[8px] font-mono">
                            {m.category}
                          </span>
                        </div>
                        <div className="p-2 text-xs">
                          <div className="font-semibold text-stone-800 font-mono text-[10px] truncate" title={m.filename}>
                            {m.filename}
                          </div>
                          <div className="text-[10px] text-stone-500 line-clamp-1">
                            {m.seoAltText}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stock Photo Picker */}
      {photoPickerOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-stone-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white border border-stone-300 rounded shadow-2xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div>
                <h4 className="text-sm font-bold text-stone-900 font-mono uppercase">
                  Curated Stock Photo Library
                </h4>
                <p className="text-xs text-stone-500">
                  Select a photo for this article.
                </p>
              </div>
              <button
                onClick={() => setPhotoPickerOpen(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(CURATED_STOCK_PHOTOS).flatMap(([cat, photos]) =>
                photos.map((p, idx) => (
                  <div
                    key={`${cat}-${idx}`}
                    onClick={() => handleSelectCuratedPhoto(p)}
                    className="group cursor-pointer border border-stone-200 rounded overflow-hidden hover:border-stone-900 transition-colors bg-stone-50"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-stone-200">
                      <img
                        src={p.url}
                        alt={p.caption}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform"
                      />
                    </div>
                    <div className="p-2 text-xs">
                      <div className="font-semibold text-stone-800 font-mono text-[11px] mb-0.5">
                        {cat} • {p.credit.photographer}
                      </div>
                      <p className="text-[11px] text-stone-500 line-clamp-1 italic">
                        {p.caption}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
