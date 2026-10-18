import React, { useState } from 'react';
import {
  Globe,
  Save,
  Check,
  Plus,
  Trash2,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Send,
  Eye,
  RotateCcw,
  Sparkles,
  Layers,
  Link as LinkIcon,
} from 'lucide-react';
import { SiteBrandingConfig, FooterLink, DEFAULT_BRANDING } from '../../types';

interface SiteBrandingManagerProps {
  branding: SiteBrandingConfig;
  onSaveBranding: (cfg: SiteBrandingConfig) => void;
  onLogSecurityEvent?: (action: string, status: 'success' | 'warning' | 'alert', details: string) => void;
}

export const SiteBrandingManager: React.FC<SiteBrandingManagerProps> = ({
  branding,
  onSaveBranding,
  onLogSecurityEvent,
}) => {
  const [formData, setFormData] = useState<SiteBrandingConfig>({
    ...DEFAULT_BRANDING,
    ...branding,
    socialLinks: {
      ...DEFAULT_BRANDING.socialLinks,
      ...(branding.socialLinks || {}),
    },
    footerLinks: branding.footerLinks || [...DEFAULT_BRANDING.footerLinks],
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const handleInputChange = (field: keyof SiteBrandingConfig, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSocialChange = (network: keyof typeof formData.socialLinks, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [network]: value,
      },
    }));
  };

  const handleAddFooterLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
    const newLink: FooterLink = {
      id: `fl-${Date.now()}`,
      label: newLinkLabel.trim(),
      url: newLinkUrl.trim(),
    };
    setFormData((prev) => ({
      ...prev,
      footerLinks: [...prev.footerLinks, newLink],
    }));
    setNewLinkLabel('');
    setNewLinkUrl('');
  };

  const handleRemoveFooterLink = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      footerLinks: prev.footerLinks.filter((l) => l.id !== id),
    }));
  };

  const handleQuickAddPreset = (label: string, url: string) => {
    if (formData.footerLinks.some((l) => l.label.toLowerCase() === label.toLowerCase())) {
      return;
    }
    const newLink: FooterLink = {
      id: `fl-${Date.now()}`,
      label,
      url,
    };
    setFormData((prev) => ({
      ...prev,
      footerLinks: [...prev.footerLinks, newLink],
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveBranding(formData);
      if (onLogSecurityEvent) {
        onLogSecurityEvent(
          'Branding & Footer Updated',
          'success',
          `Updated site identity: "${formData.siteName}" and customized footer sections`
        );
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all website branding and footer settings to default?')) {
      setFormData({ ...DEFAULT_BRANDING });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-bold font-editorial-serif text-stone-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-stone-700" />
            <span>Website Name & Footer Settings</span>
          </h2>
          <p className="text-xs text-stone-500 font-editorial-prose mt-1">
            Customize your publication brand name, masthead tagline, edition volume, footer about text, navigation links, and copyright info.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 border border-stone-200 hover:bg-stone-50 rounded transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded transition-colors cursor-pointer ${
              savedSuccess
                ? 'bg-emerald-700 text-white'
                : 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved & Synchronized</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Branding & Footer'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Core Publication Identity */}
        <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-mono">
                1. Masthead & Site Identity
              </h3>
            </div>
            <span className="text-[11px] font-mono text-stone-400">Controls top bar & front page</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Website / Publication Name *
              </label>
              <input
                type="text"
                required
                value={formData.siteName}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
                placeholder="e.g. Global 24x7"
                className="w-full text-sm font-serif font-bold px-3 py-2 border border-stone-300 rounded focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-hidden bg-stone-50/50"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Appears in header, browser tab, front-page masthead, and footer logo.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Publication Tagline / Motto
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                placeholder="Independent international broadsheet..."
                className="w-full text-sm px-3 py-2 border border-stone-300 rounded focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-hidden bg-stone-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Edition Header Line
              </label>
              <input
                type="text"
                value={formData.editionText}
                onChange={(e) => handleInputChange('editionText', e.target.value)}
                placeholder="Global 24x7 Digital Edition • 24/7 Live Feed"
                className="w-full text-sm font-mono px-3 py-2 border border-stone-300 rounded focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-hidden bg-stone-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Custom Logo URL (Optional)
              </label>
              <input
                type="url"
                value={formData.logoUrl || ''}
                onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full text-sm px-3 py-2 border border-stone-300 rounded focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-hidden bg-stone-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Canonical Website Domain URL
              </label>
              <input
                type="url"
                value={formData.siteUrl || ''}
                onChange={(e) => handleInputChange('siteUrl', e.target.value)}
                placeholder="https://www.global24x7.in"
                className="w-full text-sm font-mono px-3 py-2 border border-stone-300 rounded focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-hidden bg-stone-50/50"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Used in Sitemap.xml, RSS 2.0 Feed, OpenGraph social cards, and search engine canonical meta tags.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Footer Narrative */}
        <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-700" />
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-mono">
                2. Footer Narrative, About & Disclaimers
              </h3>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Footer About / Mission Statement
              </label>
              <textarea
                rows={3}
                value={formData.aboutText}
                onChange={(e) => handleInputChange('aboutText', e.target.value)}
                placeholder="Describe your news portal's editorial standards and focus..."
                className="w-full text-sm px-3 py-2 border border-stone-300 rounded focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-hidden bg-stone-50/50 font-editorial-prose"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Copyright Notice
                </label>
                <input
                  type="text"
                  value={formData.copyrightText}
                  onChange={(e) => handleInputChange('copyrightText', e.target.value)}
                  placeholder="© 2026 Global 24x7. All rights reserved."
                  className="w-full text-sm font-mono px-3 py-2 border border-stone-300 rounded focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-hidden bg-stone-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Image Attribution / Photo Credit Notice
                </label>
                <input
                  type="text"
                  value={formData.attributionNotice}
                  onChange={(e) => handleInputChange('attributionNotice', e.target.value)}
                  placeholder="Photography pre-cleared via Unsplash & NASA Public Domain"
                  className="w-full text-sm font-mono px-3 py-2 border border-stone-300 rounded focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-hidden bg-stone-50/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Compliance / Standards Notice
                </label>
                <input
                  type="text"
                  value={formData.complianceNotice}
                  onChange={(e) => handleInputChange('complianceNotice', e.target.value)}
                  placeholder="Google AdSense & Schema.org Compliant Broadsheet Architecture"
                  className="w-full text-sm font-mono px-3 py-2 border border-stone-300 rounded focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-hidden bg-stone-50/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Footer Navigation Links */}
        <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-stone-700" />
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-mono">
                3. Footer Navigation Links & Policy Pages
              </h3>
            </div>
            <span className="text-[11px] font-mono text-stone-400">
              {formData.footerLinks.length} Links Active
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold text-stone-600 block mb-2">
              Quick Add Standard Policy Links:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Editorial Guidelines', url: '/page/editorial-guidelines' },
                { label: 'Privacy Policy', url: '/page/privacy-policy' },
                { label: 'Terms of Service', url: '/page/terms-of-service' },
                { label: 'Contact Bureau', url: '/page/contact-us' },
                { label: 'About Global 24x7', url: '/page/about-us' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleQuickAddPreset(preset.label, preset.url)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 rounded transition-colors cursor-pointer"
                >
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-stone-200 rounded-md overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 font-mono text-stone-600">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Link Label</th>
                  <th className="py-2.5 px-4 font-semibold">Destination URL / Anchor</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {formData.footerLinks.map((link, idx) => (
                  <tr key={link.id} className="hover:bg-stone-50/70">
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => {
                            const updated = [...prev.footerLinks];
                            updated[idx] = { ...updated[idx], label: val };
                            return { ...prev, footerLinks: updated };
                          });
                        }}
                        className="w-full text-xs font-medium px-2 py-1 border border-transparent hover:border-stone-300 focus:border-stone-900 rounded outline-hidden"
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => {
                            const updated = [...prev.footerLinks];
                            updated[idx] = { ...updated[idx], url: val };
                            return { ...prev, footerLinks: updated };
                          });
                        }}
                        className="w-full text-xs font-mono text-stone-600 px-2 py-1 border border-transparent hover:border-stone-300 focus:border-stone-900 rounded outline-hidden"
                      />
                    </td>
                    <td className="py-2 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveFooterLink(link.id)}
                        className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-stone-50 p-3 rounded-md border border-stone-200 flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder="Link Label (e.g. Careers)"
              value={newLinkLabel}
              onChange={(e) => setNewLinkLabel(e.target.value)}
              className="flex-1 text-xs px-3 py-1.5 border border-stone-300 rounded bg-white outline-hidden focus:border-stone-900"
            />
            <input
              type="text"
              placeholder="URL (e.g. /page/about-us)"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              className="flex-1 text-xs font-mono px-3 py-1.5 border border-stone-300 rounded bg-white outline-hidden focus:border-stone-900"
            />
            <button
              type="button"
              onClick={handleAddFooterLink}
              disabled={!newLinkLabel.trim() || !newLinkUrl.trim()}
              className="px-3 py-1.5 bg-stone-900 text-white rounded text-xs font-medium hover:bg-stone-800 disabled:opacity-40 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Link</span>
            </button>
          </div>
        </div>

        {/* Section 4: Social Media */}
        <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-stone-700" />
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-mono">
                4. Social Media Channels
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Twitter className="w-4 h-4 text-stone-500 shrink-0" />
              <input
                type="url"
                value={formData.socialLinks?.twitter || ''}
                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                placeholder="Twitter / X profile URL"
                className="w-full text-xs font-mono px-3 py-2 border border-stone-300 rounded bg-stone-50/50 outline-hidden focus:border-stone-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <Facebook className="w-4 h-4 text-stone-500 shrink-0" />
              <input
                type="url"
                value={formData.socialLinks?.facebook || ''}
                onChange={(e) => handleSocialChange('facebook', e.target.value)}
                placeholder="Facebook page URL"
                className="w-full text-xs font-mono px-3 py-2 border border-stone-300 rounded bg-stone-50/50 outline-hidden focus:border-stone-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <Linkedin className="w-4 h-4 text-stone-500 shrink-0" />
              <input
                type="url"
                value={formData.socialLinks?.linkedin || ''}
                onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                placeholder="LinkedIn company profile URL"
                className="w-full text-xs font-mono px-3 py-2 border border-stone-300 rounded bg-stone-50/50 outline-hidden focus:border-stone-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-stone-500 shrink-0" />
              <input
                type="url"
                value={formData.socialLinks?.youtube || ''}
                onChange={(e) => handleSocialChange('youtube', e.target.value)}
                placeholder="YouTube channel URL"
                className="w-full text-xs font-mono px-3 py-2 border border-stone-300 rounded bg-stone-50/50 outline-hidden focus:border-stone-900"
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Send className="w-4 h-4 text-stone-500 shrink-0" />
              <input
                type="url"
                value={formData.socialLinks?.telegram || ''}
                onChange={(e) => handleSocialChange('telegram', e.target.value)}
                placeholder="Telegram channel URL"
                className="w-full text-xs font-mono px-3 py-2 border border-stone-300 rounded bg-stone-50/50 outline-hidden focus:border-stone-900"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <button
            type="submit"
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded shadow-sm transition-colors cursor-pointer ${
              savedSuccess
                ? 'bg-emerald-700 text-white'
                : 'bg-stone-900 hover:bg-stone-800 text-white'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved & Synchronized Successfully</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Website Branding & Footer'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
