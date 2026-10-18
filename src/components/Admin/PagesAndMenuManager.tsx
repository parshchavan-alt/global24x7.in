import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Save,
} from 'lucide-react';
import { CustomPage, NavigationMenuConfig, NavigationMenuItem } from '../../types';

export const PagesAndMenuManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'pages' | 'menus'>('pages');

  // Custom Pages State
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [pageMessage, setPageMessage] = useState<string | null>(null);

  // Menus State
  const [menus, setMenus] = useState<NavigationMenuConfig>({
    headerMenu: [],
    footerMenu: [],
  });
  const [menuMessage, setMenuMessage] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/pages');
      const data = await res.json();
      if (data.success && data.pages) {
        setPages(data.pages);
      }
    } catch {}
  };

  const fetchMenus = async () => {
    try {
      const res = await fetch('/api/menus');
      const data = await res.json();
      if (data.success && data.menus) {
        setMenus(data.menus);
      }
    } catch {}
  };

  useEffect(() => {
    fetchPages();
    fetchMenus();
  }, []);

  const handleSavePage = async () => {
    if (!editingPage) return;
    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPage),
      });
      const data = await res.json();
      if (data.success) {
        setPageMessage(`Page "${editingPage.title}" saved successfully!`);
        setEditingPage(null);
        setIsCreatingNew(false);
        fetchPages();
      }
    } catch (err: any) {
      setPageMessage(`Error: ${err.message}`);
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom page?')) return;
    try {
      const res = await fetch(`/api/pages/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchPages();
      } else {
        alert(data.error || 'Failed to delete page');
      }
    } catch {}
  };

  const handleSaveMenus = async (updated: NavigationMenuConfig) => {
    try {
      const res = await fetch('/api/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        setMenus(data.menus);
        setMenuMessage('Navigation menus updated successfully!');
      }
    } catch {}
  };

  const addHeaderMenuItem = () => {
    const newItem: NavigationMenuItem = {
      id: `hm-${Date.now()}`,
      label: 'New Link',
      url: '/',
      order: menus.headerMenu.length + 1,
    };
    const updated = {
      ...menus,
      headerMenu: [...menus.headerMenu, newItem],
    };
    setMenus(updated);
    handleSaveMenus(updated);
  };

  const removeHeaderMenuItem = (id: string) => {
    const updated = {
      ...menus,
      headerMenu: menus.headerMenu.filter((m) => m.id !== id),
    };
    setMenus(updated);
    handleSaveMenus(updated);
  };

  const updateHeaderMenuItem = (id: string, field: 'label' | 'url', val: string) => {
    const updated = {
      ...menus,
      headerMenu: menus.headerMenu.map((m) =>
        m.id === id ? { ...m, [field]: val } : m
      ),
    };
    setMenus(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Sub-Tab Nav */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h3 className="text-base font-bold font-editorial-serif text-stone-900">
            Pages & Navigation Menu Manager
          </h3>
          <p className="text-xs text-stone-500 font-mono">
            Customize policy pages (Privacy, Terms, About) and primary navigation links
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded border border-stone-200">
          <button
            onClick={() => setActiveSubTab('pages')}
            className={`px-3 py-1.5 text-xs font-mono rounded cursor-pointer transition-colors ${
              activeSubTab === 'pages'
                ? 'bg-white text-stone-900 font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Custom Pages ({pages.length})
          </button>
          <button
            onClick={() => setActiveSubTab('menus')}
            className={`px-3 py-1.5 text-xs font-mono rounded cursor-pointer transition-colors ${
              activeSubTab === 'menus'
                ? 'bg-white text-stone-900 font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Navigation Menus
          </button>
        </div>
      </div>

      {activeSubTab === 'pages' && (
        <div className="space-y-6">
          {pageMessage && (
            <div className="p-3 bg-stone-100 border border-stone-300 rounded text-xs font-mono text-stone-800 flex items-center justify-between">
              <span>{pageMessage}</span>
              <button
                onClick={() => setPageMessage(null)}
                className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {!editingPage ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-stone-700 uppercase">
                  Published Pages & Broadsheet Policies
                </span>
                <button
                  onClick={() => {
                    setIsCreatingNew(true);
                    setEditingPage({
                      id: `page-${Date.now()}`,
                      slug: 'new-page',
                      title: 'New Page',
                      content: '# New Page\n\nWrite your markdown content here...',
                      metaTitle: 'New Page | Global 24x7',
                      metaDescription: 'Description for search engines',
                      isSystem: false,
                      published: true,
                      updatedAt: new Date().toISOString(),
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-mono font-semibold bg-stone-900 text-white rounded hover:bg-stone-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Page</span>
                </button>
              </div>

              <div className="divide-y divide-stone-200 border border-stone-200 rounded bg-white shadow-xs">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900 font-editorial-serif">
                          {page.title}
                        </span>
                        {page.isSystem && (
                          <span className="px-1.5 py-0.2 bg-stone-200 text-stone-700 rounded text-[9px] font-mono uppercase">
                            System Policy
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-stone-500">
                        Path: <code>/page/{page.slug}</code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <a
                        href={`/page/${page.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-xs font-mono text-stone-600 hover:text-stone-900 border border-stone-200 rounded flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                      </a>
                      <button
                        onClick={() => setEditingPage(page)}
                        className="px-2.5 py-1 text-xs font-mono font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded border border-stone-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      {!page.isSystem && (
                        <button
                          onClick={() => handleDeletePage(page.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                          title="Delete page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-stone-800" />
                  <h4 className="text-sm font-bold font-mono uppercase text-stone-900">
                    {isCreatingNew ? 'Create New Page' : `Editing Page: ${editingPage.title}`}
                  </h4>
                </div>
                <button
                  onClick={() => {
                    setEditingPage(null);
                    setIsCreatingNew(false);
                  }}
                  className="text-xs font-mono text-stone-500 hover:text-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-stone-600 mb-1">
                    Page Title:
                  </label>
                  <input
                    type="text"
                    value={editingPage.title}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, title: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono border border-stone-300 rounded focus:border-stone-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-stone-600 mb-1">
                    URL Slug (/page/[slug]):
                  </label>
                  <input
                    type="text"
                    value={editingPage.slug}
                    onChange={(e) =>
                      setEditingPage({
                        ...editingPage,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      })
                    }
                    disabled={editingPage.isSystem}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-stone-300 rounded focus:border-stone-900 outline-none disabled:bg-stone-100 disabled:text-stone-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-stone-600 mb-1">
                  Page Content (Markdown supported):
                </label>
                <textarea
                  rows={14}
                  value={editingPage.content}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, content: e.target.value })
                  }
                  className="w-full p-3 text-xs font-mono border border-stone-300 rounded focus:border-stone-900 outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                <div>
                  <label className="block text-xs font-mono text-stone-600 mb-1">
                    SEO Meta Title:
                  </label>
                  <input
                    type="text"
                    value={editingPage.metaTitle}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, metaTitle: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono border border-stone-300 rounded focus:border-stone-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-stone-600 mb-1">
                    SEO Meta Description:
                  </label>
                  <input
                    type="text"
                    value={editingPage.metaDescription}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, metaDescription: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono border border-stone-300 rounded focus:border-stone-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  onClick={() => {
                    setEditingPage(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-4 py-2 text-xs font-mono text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleSavePage}
                  className="px-5 py-2 text-xs font-mono font-semibold bg-stone-900 text-white rounded hover:bg-stone-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Publish Page</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: MENUS BUILDER */}
      {activeSubTab === 'menus' && (
        <div className="space-y-6">
          {menuMessage && (
            <div className="p-3 bg-stone-100 border border-stone-300 rounded text-xs font-mono text-stone-800 flex items-center justify-between">
              <span>{menuMessage}</span>
              <button
                onClick={() => setMenuMessage(null)}
                className="text-stone-400 hover:text-stone-700 ml-4 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div className="bg-white border border-stone-200 rounded p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h4 className="text-xs font-bold font-mono uppercase text-stone-900">
                  Header Navigation Bar Links
                </h4>
                <p className="text-[11px] text-stone-500 font-mono">
                  Controls primary navigation links shown at the top of the Global 24x7 front page
                </p>
              </div>
              <button
                onClick={addHeaderMenuItem}
                className="px-3 py-1.5 text-xs font-mono font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded border border-stone-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Nav Link</span>
              </button>
            </div>

            <div className="space-y-2">
              {menus.headerMenu.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2.5 bg-stone-50 border border-stone-200 rounded text-xs font-mono"
                >
                  <span className="text-stone-400 w-6 text-center">{idx + 1}.</span>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) =>
                      updateHeaderMenuItem(item.id, 'label', e.target.value)
                    }
                    placeholder="Link Label"
                    className="w-1/3 px-2 py-1 text-xs border border-stone-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    value={item.url}
                    onChange={(e) =>
                      updateHeaderMenuItem(item.id, 'url', e.target.value)
                    }
                    placeholder="Destination URL (e.g. /category/technology or /page/about-us)"
                    className="flex-1 px-2 py-1 text-xs border border-stone-300 rounded bg-white"
                  />
                  <button
                    onClick={() => removeHeaderMenuItem(item.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleSaveMenus(menus)}
                className="px-4 py-2 text-xs font-mono font-semibold bg-stone-900 text-white rounded hover:bg-stone-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Navigation Links</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
