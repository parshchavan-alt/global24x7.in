import React, { useState, useEffect, useRef } from 'react';
import {
  Image,
  Upload,
  Download,
  Trash2,
  Edit2,
  Check,
  Copy,
  Search,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  FileUp,
} from 'lucide-react';
import { MediaAsset, CustomCategory } from '../../types';

interface MediaManagerPanelProps {
  categories: CustomCategory[];
}

export const MediaManagerPanel: React.FC<MediaManagerPanelProps> = ({ categories }) => {
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [storageFilter, setStorageFilter] = useState<'all' | 'local' | 'remote'>('all');
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // File Upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState(categories[0]?.name || 'Technology');
  const [uploadAltText, setUploadAltText] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Remote URL download states
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadTopic, setDownloadTopic] = useState('');
  const [downloadCategory, setDownloadCategory] = useState(categories[0]?.name || 'Technology');
  const [isDownloading, setIsDownloading] = useState(false);

  // Bulk localization state
  const [isLocalizingAll, setIsLocalizingAll] = useState(false);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/media');
      const data = await res.json();
      if (data.success && data.media) {
        setMediaList(data.media);
      }
    } catch (err) {
      console.warn('Failed to fetch media list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage({ text: 'File exceeds 10MB limit.', type: 'error' });
      return;
    }

    setIsUploading(true);
    setStatusMessage({ text: `Uploading ${file.name} to server /media/ storage...`, type: 'info' });

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
              category: uploadCategory,
              seoAltText: uploadAltText.trim() || undefined,
              seoTitle: uploadTitle.trim() || undefined,
            }),
          });
          const data = await res.json();
          if (data.success && data.asset) {
            setStatusMessage({
              text: `Success! "${data.asset.filename}" uploaded directly to your server (/media/${data.asset.filename}).`,
              type: 'success',
            });
            setUploadAltText('');
            setUploadTitle('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            fetchMedia();
          } else {
            setStatusMessage({ text: data.error || 'Upload failed.', type: 'error' });
          }
        } catch (uploadErr: any) {
          setStatusMessage({ text: uploadErr.message || 'Error transmitting upload.', type: 'error' });
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        setStatusMessage({ text: 'Failed to read file from disk.', type: 'error' });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'File processing error.', type: 'error' });
      setIsUploading(false);
    }
  };

  const handleDownloadExternalUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!downloadUrl.trim()) return;
    setIsDownloading(true);
    setStatusMessage({ text: 'Downloading image from external URL to server storage...', type: 'info' });

    try {
      const res = await fetch('/api/media/download-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: downloadUrl.trim(),
          category: downloadCategory,
          topicTitle: downloadTopic.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          text: `Image downloaded, renamed SEO-friendly, and archived at ${data.asset.localPath}`,
          type: 'success',
        });
        setDownloadUrl('');
        setDownloadTopic('');
        fetchMedia();
      } else {
        setStatusMessage({ text: data.error || 'Failed to download image.', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Download failed.', type: 'error' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleLocalizeAllArticles = async () => {
    if (!confirm('Download and save all external images from all articles directly to your own server storage?')) return;
    setIsLocalizingAll(true);
    setStatusMessage({ text: 'Downloading external images and converting to local server files...', type: 'info' });

    try {
      const res = await fetch('/api/media/localize-article-images', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          text: data.message || `Successfully localized ${data.localizedCount} images to our server!`,
          type: 'success',
        });
        fetchMedia();
      } else {
        setStatusMessage({ text: data.error || 'Localization failed.', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Localization process failed.', type: 'error' });
    } finally {
      setIsLocalizingAll(false);
    }
  };

  const handleSaveMetadata = async () => {
    if (!editingAsset) return;
    try {
      const res = await fetch('/api/media/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAsset.id,
          seoAltText: editingAsset.seoAltText,
          seoTitle: editingAsset.seoTitle,
          category: editingAsset.category,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ text: 'SEO metadata updated successfully!', type: 'success' });
        setEditingAsset(null);
        fetchMedia();
      }
    } catch {
      setStatusMessage({ text: 'Failed to update metadata.', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this media asset from server disk storage?')) return;
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMediaList((prev) => prev.filter((m) => m.id !== id));
        setStatusMessage({ text: 'Asset removed from server storage.', type: 'info' });
      }
    } catch {}
  };

  const handleCopyPath = (path: string, id: string) => {
    navigator.clipboard.writeText(path);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredMedia = mediaList.filter((item) => {
    const isItemLocal = Boolean(item.localPath && item.localPath.startsWith('/media/'));
    if (storageFilter === 'local' && !isItemLocal) return false;
    if (storageFilter === 'remote' && isItemLocal) return false;

    const matchSearch =
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seoAltText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;

    return matchSearch && matchCat;
  });

  const localCount = mediaList.filter((m) => m.localPath && m.localPath.startsWith('/media/')).length;
  const remoteCount = mediaList.length - localCount;

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-5 h-5 text-stone-800" />
          <div>
            <h3 className="text-base font-bold font-editorial-serif text-stone-900">
              Media Library & Server-Hosted Image Vault
            </h3>
            <p className="text-xs text-stone-500 font-mono">
              Upload images directly from your device or download remote links to our local server storage (<code>/media/*</code>)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLocalizeAllArticles}
            disabled={isLocalizingAll}
            className="px-3 py-1.5 text-xs font-mono font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Download external images from articles and save them to our server"
          >
            <Download className={`w-3.5 h-3.5 ${isLocalizingAll ? 'animate-bounce' : ''}`} />
            <span>{isLocalizingAll ? 'Downloading...' : 'Localize All Article Images'}</span>
          </button>
          <button
            onClick={fetchMedia}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-mono font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded border border-stone-300 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded text-xs font-mono flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-stone-100 border-stone-300 text-stone-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-stone-400 hover:text-stone-700 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload & Ingestion Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Direct File Upload Box */}
        <div
          className={`p-4 bg-white border-2 rounded-lg transition-colors ${
            dragActive ? 'border-stone-900 bg-stone-50' : 'border-dashed border-stone-300 hover:border-stone-400'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFileUpload(e.dataTransfer.files);
            }
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Upload className="w-4 h-4 text-stone-800" />
            <h4 className="text-xs font-bold font-mono uppercase text-stone-900">
              Upload Image to Our Server (/media/*)
            </h4>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-stone-500 uppercase mb-0.5">
                  Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-2 py-1 text-xs font-mono border border-stone-300 rounded bg-stone-50"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-stone-500 uppercase mb-0.5">
                  SEO Alt Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cleanroom equipment"
                  value={uploadAltText}
                  onChange={(e) => setUploadAltText(e.target.value)}
                  className="w-full px-2 py-1 text-xs font-mono border border-stone-300 rounded bg-stone-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-stone-500 uppercase mb-0.5">
                  SEO Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Global 24x7 Analysis"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-2 py-1 text-xs font-mono border border-stone-300 rounded bg-stone-50"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                id="media-file-input"
              />
              <label
                htmlFor="media-file-input"
                className={`w-full sm:w-auto px-4 py-2 text-xs font-mono font-semibold rounded flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  isUploading
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                    : 'bg-stone-900 text-white hover:bg-stone-800'
                }`}
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading to Server...' : 'Select Image File from Device'}</span>
              </label>
              <span className="text-[11px] font-mono text-stone-400">
                Supports JPG, PNG, WEBP, GIF
              </span>
            </div>
          </div>
        </div>

        {/* Download from Remote Link to Server */}
        <div className="p-4 bg-white border border-stone-200 rounded-lg shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Download className="w-4 h-4 text-stone-800" />
              <h4 className="text-xs font-bold font-mono uppercase text-stone-900">
                Download & Save External Link to Server
              </h4>
            </div>
            <form onSubmit={handleDownloadExternalUrl} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-mono text-stone-500 uppercase mb-0.5">
                  External Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-300 rounded focus:border-stone-900 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-stone-500 uppercase mb-0.5">
                    Topic / Keyword Slug
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. quantum-semiconductor"
                    value={downloadTopic}
                    onChange={(e) => setDownloadTopic(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-stone-500 uppercase mb-0.5">
                    Category
                  </label>
                  <select
                    value={downloadCategory}
                    onChange={(e) => setDownloadCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-300 rounded bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={isDownloading || !downloadUrl.trim()}
                className="w-full px-3 py-1.5 text-xs font-mono font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>{isDownloading ? 'Downloading & Renaming...' : 'Download to Our Server'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-stone-50 p-3 rounded border border-stone-200">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-stone-400 ml-1" />
          <input
            type="text"
            placeholder="Search filenames, SEO alt text, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-2.5 py-1 text-xs font-mono border border-stone-300 rounded bg-white w-full sm:w-64 focus:border-stone-900 outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <div className="inline-flex rounded-md shadow-xs bg-white border border-stone-200 p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setStorageFilter('all')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                storageFilter === 'all' ? 'bg-stone-900 text-white font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All ({mediaList.length})
            </button>
            <button
              type="button"
              onClick={() => setStorageFilter('local')}
              className={`px-2.5 py-1 rounded cursor-pointer flex items-center gap-1 transition-colors ${
                storageFilter === 'local' ? 'bg-emerald-800 text-white font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <HardDrive className="w-3 h-3" />
              <span>On Our Server ({localCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStorageFilter('remote')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                storageFilter === 'remote' ? 'bg-amber-800 text-white font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              External ({remoteCount})
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-stone-500">Dept:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 text-xs font-mono border border-stone-300 rounded bg-white"
            >
              <option value="all">All Departments</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      {filteredMedia.length === 0 ? (
        <div className="p-12 text-center bg-white border border-stone-200 rounded space-y-2">
          <Image className="w-8 h-8 text-stone-300 mx-auto" />
          <div className="text-xs font-mono text-stone-500 font-semibold">
            No media assets found matching filter.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((asset) => {
            const isLocal = Boolean(asset.localPath && asset.localPath.startsWith('/media/'));
            return (
              <div
                key={asset.id}
                className="bg-white border border-stone-200 rounded overflow-hidden shadow-xs hover:border-stone-400 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video bg-stone-100 overflow-hidden group">
                    <img
                      src={asset.localPath}
                      alt={asset.seoAltText}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      onError={(e) => {
                        if (asset.originalUrl) {
                          (e.target as HTMLImageElement).src = asset.originalUrl;
                        }
                      }}
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase ${
                          isLocal ? 'bg-emerald-800 text-white' : 'bg-amber-800 text-white'
                        }`}
                      >
                        {isLocal ? '✓ Our Server (/media/*)' : 'External Link'}
                      </span>
                      <span className="px-1.5 py-0.5 bg-black/70 text-white rounded text-[9px] font-mono uppercase">
                        {asset.category}
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white rounded text-[9px] font-mono">
                      {formatFileSize(asset.fileSizeBytes)}
                    </div>
                  </div>

                  <div className="p-3 space-y-1.5">
                    <div className="text-xs font-mono font-bold text-stone-900 truncate" title={asset.filename}>
                      {asset.filename}
                    </div>
                    <div className="text-[11px] text-stone-600 line-clamp-2 leading-tight">
                      <strong>Alt:</strong> {asset.seoAltText}
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono flex items-center justify-between">
                      <span>{new Date(asset.uploadedAt).toLocaleDateString()}</span>
                      <span className="truncate max-w-[120px]">{asset.localPath}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 border-t border-stone-100 flex items-center justify-between gap-2 bg-stone-50/50">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={asset.localPath}
                      target="_blank"
                      rel="noreferrer"
                      className="text-stone-600 hover:text-stone-900 text-xs font-mono flex items-center gap-1"
                      title="Open full size"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyPath(asset.localPath, asset.id)}
                      className="text-stone-600 hover:text-stone-900 text-xs font-mono flex items-center gap-1 cursor-pointer ml-1"
                      title="Copy URL for articles"
                    >
                      {copiedId === asset.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingAsset(asset)}
                      className="p-1 text-stone-500 hover:text-stone-900 cursor-pointer"
                      title="Edit SEO metadata"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                      title="Delete image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h4 className="text-sm font-bold font-mono uppercase text-stone-900">
                Edit Image SEO Metadata
              </h4>
              <button
                onClick={() => setEditingAsset(null)}
                className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-stone-600 mb-1">
                  Local Server Path:
                </label>
                <div className="px-3 py-1.5 text-xs font-mono bg-stone-100 border border-stone-200 rounded text-stone-700 select-all">
                  {editingAsset.localPath}
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-stone-600 mb-1">
                  SEO Alt Text:
                </label>
                <input
                  type="text"
                  value={editingAsset.seoAltText}
                  onChange={(e) =>
                    setEditingAsset({ ...editingAsset, seoAltText: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono border border-stone-300 rounded focus:border-stone-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-stone-600 mb-1">
                  SEO Title Tag:
                </label>
                <input
                  type="text"
                  value={editingAsset.seoTitle}
                  onChange={(e) =>
                    setEditingAsset({ ...editingAsset, seoTitle: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono border border-stone-300 rounded focus:border-stone-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-stone-600 mb-1">
                  Department / Category:
                </label>
                <select
                  value={editingAsset.category}
                  onChange={(e) =>
                    setEditingAsset({ ...editingAsset, category: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono border border-stone-300 rounded bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                onClick={() => setEditingAsset(null)}
                className="px-4 py-2 text-xs font-mono text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMetadata}
                className="px-4 py-2 text-xs font-mono font-semibold bg-stone-900 text-white rounded hover:bg-stone-800 cursor-pointer"
              >
                Save SEO Metadata
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
