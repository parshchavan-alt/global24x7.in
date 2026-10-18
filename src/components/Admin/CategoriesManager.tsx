import React, { useState } from 'react';
import { Tag, Plus, Edit, Trash2, Check, X, FolderTree } from 'lucide-react';
import { CustomCategory, Article } from '../../types';

interface CategoriesManagerProps {
  categories: CustomCategory[];
  articles: Article[];
  onSaveCategory: (cat: CustomCategory) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categories,
  articles,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [accentColor, setAccentColor] = useState('#1C1917');
  const [error, setError] = useState<string | null>(null);

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setAccentColor('#1C1917');
    setError(null);
  };

  const handleStartEdit = (cat: CustomCategory) => {
    setEditingCategory(cat);
    setIsCreating(false);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setAccentColor(cat.accentColor || '#1C1917');
    setError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    const finalSlug = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const catToSave: CustomCategory = {
      id: editingCategory?.id || `cat-${Date.now()}`,
      name: name.trim(),
      slug: finalSlug,
      description: description.trim(),
      accentColor,
      isSystem: editingCategory?.isSystem || false,
    };

    onSaveCategory(catToSave);
    setIsCreating(false);
    setEditingCategory(null);
  };

  const getArticleCountForCategory = (catName: string) => {
    return articles.filter(
      (a) => a.category.toLowerCase() === catName.toLowerCase()
    ).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-stone-800" />
          <div>
            <h3 className="text-base font-bold font-editorial-serif text-stone-900">
              Department & Category Management
            </h3>
            <p className="text-xs text-stone-500 font-mono">
              Add custom categories, configure slugs, descriptions, and automated scheduler queues
            </p>
          </div>
        </div>
        <button
          onClick={handleStartCreate}
          className="px-3.5 py-1.5 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Category</span>
        </button>
      </div>

      {(isCreating || editingCategory) && (
        <div className="p-5 bg-white border border-stone-300 rounded shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h4 className="text-xs font-bold font-mono uppercase text-stone-900">
              {isCreating ? 'Create New Category' : `Edit Category: ${editingCategory?.name}`}
            </h4>
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingCategory(null);
              }}
              className="text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-stone-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (isCreating) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="Category Name"
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-stone-700 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="category-slug"
                  className="w-full px-3 py-1.5 text-xs font-mono bg-stone-50 border border-stone-300 rounded focus:outline-none focus:border-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-stone-700 mb-1">
                Description / Editorial Mandate
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of what this category covers..."
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded focus:outline-none focus:border-stone-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingCategory(null);
                }}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Category</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-sm overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-2.5 px-4">Category Name</th>
              <th className="py-2.5 px-3">Slug</th>
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3 text-right">Articles</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {categories.map((cat) => {
              const count = getArticleCountForCategory(cat.name);
              return (
                <tr key={cat.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-stone-900">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-stone-500" />
                      <span>{cat.name}</span>
                      {cat.isSystem && (
                        <span className="text-[10px] font-mono text-stone-400 uppercase bg-stone-100 px-1.5 py-0.2 rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-stone-500">
                    /{cat.slug}
                  </td>
                  <td className="py-3 px-3 text-stone-600 max-w-sm truncate">
                    {cat.description || '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-stone-700">
                    {count} dispatches
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                        title="Edit category"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {!cat.isSystem && (
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete category "${cat.name}"? Articles will remain but category will be removed.`
                              )
                            ) {
                              onDeleteCategory(cat.id);
                            }
                          }}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
