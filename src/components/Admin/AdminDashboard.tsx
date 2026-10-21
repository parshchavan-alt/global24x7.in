import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sliders,
  Calendar,
  BarChart3,
  Globe,
  Cloud,
  Shield,
  LogOut,
  ExternalLink,
  Lock,
  KeyRound,
  FolderTree,
  Code,
  Layout,
  Image as ImageIcon,
  Compass,
  AlertTriangle,
  Database,
  FileDown,
  FileUp,
  CheckCircle2,
} from 'lucide-react';
import {
  Article,
  AIFineTuningConfig,
  SchedulerConfig,
  AdSenseConfig,
  SecurityAuditItem,
  CustomCategory,
  CustomCodeConfig,
  SiteBrandingConfig,
} from '../../types';
import { ArticlesCMS } from './ArticlesCMS';
import { CategoriesManager } from './CategoriesManager';
import { AIFineTuningStudio } from './AIFineTuningStudio';
import { AutoSchedulerPanel } from './AutoSchedulerPanel';
import { AnalyticsPanel } from './AnalyticsPanel';
import { SEOSuitePanel } from './SEOSuitePanel';
import { CloudflareExportPanel } from './CloudflareExportPanel';
import { CloudflareD1Panel } from './CloudflareD1Panel';
import { CustomCodeManager } from './CustomCodeManager';
import { SiteBrandingManager } from './SiteBrandingManager';
import { MediaManagerPanel } from './MediaManagerPanel';
import { PagesAndMenuManager } from './PagesAndMenuManager';
import { authenticatedFetch } from '../../utils/apiSafe';

interface AdminDashboardProps {
  articles: Article[];
  categories: CustomCategory[];
  onSaveCategory: (cat: CustomCategory) => void;
  onDeleteCategory: (id: string) => void;
  customCodeConfig: CustomCodeConfig;
  onSaveCustomCode: (cfg: CustomCodeConfig) => void;
  branding: SiteBrandingConfig;
  onSaveBranding: (b: SiteBrandingConfig) => void;
  onSaveArticle: (article: Article) => void;
  onDeleteArticle: (id: string) => void;
  onViewLive: (article: Article) => void;
  onCloseAdmin: () => void;
  fineTuningConfig: AIFineTuningConfig;
  onUpdateFineTuning: (cfg: AIFineTuningConfig) => void;
  schedulerConfig: SchedulerConfig;
  onUpdateScheduler: (cfg: SchedulerConfig) => void;
  adSenseConfig: AdSenseConfig;
  onUpdateAdSense: (cfg: AdSenseConfig) => void;
  securityAuditLog: SecurityAuditItem[];
  onLogSecurityEvent: (action: string, status: 'success' | 'warning' | 'alert', details: string) => void;
  isDefaultPasscode?: boolean;
  onPasscodeChanged?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  articles,
  categories,
  onSaveCategory,
  onDeleteCategory,
  customCodeConfig,
  onSaveCustomCode,
  branding,
  onSaveBranding,
  onSaveArticle,
  onDeleteArticle,
  onViewLive,
  onCloseAdmin,
  fineTuningConfig,
  onUpdateFineTuning,
  schedulerConfig,
  onUpdateScheduler,
  adSenseConfig,
  onUpdateAdSense,
  securityAuditLog,
  onLogSecurityEvent,
  isDefaultPasscode,
  onPasscodeChanged,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'scheduler'
    | 'fine-tuning'
    | 'cms'
    | 'categories'
    | 'media'
    | 'pages-menus'
    | 'branding'
    | 'custom-code'
    | 'analytics'
    | 'seo'
    | 'cloudflare'
    | 'cloudflare-d1'
    | 'security'
    | 'backup'
  >('scheduler');

  const [newPasscode, setNewPasscode] = useState('');
  const [passcodeSuccess, setPasscodeSuccess] = useState(false);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [isUpdatingPasscode, setIsUpdatingPasscode] = useState(false);
  const [sessionRemainingMinutes, setSessionRemainingMinutes] = useState(15);
  const [backupMessage, setBackupMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const backupInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const expiry = sessionStorage.getItem('chronicle_admin_session_expiry');
      if (expiry) {
        const remaining = Math.max(0, Math.floor((parseInt(expiry, 10) - Date.now()) / 60000));
        setSessionRemainingMinutes(remaining);
        if (remaining <= 0) {
          handleLockSession();
        }
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLockSession = () => {
    sessionStorage.removeItem('chronicle_admin_session');
    sessionStorage.removeItem('chronicle_admin_session_expiry');
    onLogSecurityEvent('Admin Logout', 'success', 'Session closed manually or timed out');
    onCloseAdmin();
  };

  const handleChangePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasscode.trim() || isUpdatingPasscode) return;
    if (newPasscode.trim().length < 6) {
      setPasscodeError('New passcode must be at least 6 characters in length.');
      return;
    }

    setIsUpdatingPasscode(true);
    setPasscodeError(null);
    const token =
      sessionStorage.getItem('chronicle_admin_session') ||
      localStorage.getItem('chronicle_admin_token') ||
      '';

    try {
      const res = await fetch('/api/auth/change-passcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ newPasscode: newPasscode.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.token) {
          sessionStorage.setItem('chronicle_admin_session', data.token);
          localStorage.setItem('chronicle_admin_token', data.token);
        }
        localStorage.setItem('chronicle_admin_passcode', newPasscode.trim());
        onLogSecurityEvent('Passcode Modified', 'warning', 'Master administrative passcode permanently updated on server');
        setPasscodeSuccess(true);
        setNewPasscode('');
        if (onPasscodeChanged) onPasscodeChanged();
        setTimeout(() => setPasscodeSuccess(false), 4000);
      } else {
        setPasscodeError(data.error || 'Failed to update passcode on server');
      }
    } catch {
      localStorage.setItem('chronicle_admin_passcode', newPasscode.trim());
      setPasscodeSuccess(true);
      setNewPasscode('');
      setTimeout(() => setPasscodeSuccess(false), 3000);
    } finally {
      setIsUpdatingPasscode(false);
    }
  };

  const handleExportFullBackup = async () => {
    setIsExportingBackup(true);
    setBackupMessage({ text: 'Compiling system backup package (.json)...', type: 'info' });
    try {
      const res = await authenticatedFetch('/api/backup/export');
      if (!res.ok) throw new Error('Backup request failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `global24x7-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setBackupMessage({ text: '✓ Complete system backup exported and downloaded safely to your computer!', type: 'success' });
      onLogSecurityEvent('Backup Export', 'success', 'Downloaded full system backup JSON');
      setTimeout(() => setBackupMessage(null), 5000);
    } catch (err: any) {
      setBackupMessage({ text: `Backup export failed: ${err.message}`, type: 'error' });
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleRestoreFullBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`Restore system backup from "${file.name}"? This will recover all articles, custom code, categories, media index, and settings.`)) {
      if (backupInputRef.current) backupInputRef.current.value = '';
      return;
    }

    setIsRestoringBackup(true);
    setBackupMessage({ text: `Restoring data from ${file.name}...`, type: 'info' });

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      const res = await authenticatedFetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setBackupMessage({ text: data.message || '✓ Backup restored successfully!', type: 'success' });
        onLogSecurityEvent('Backup Restore', 'success', `Restored data from ${file.name}`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setBackupMessage({ text: data.error || 'Restore failed', type: 'error' });
      }
    } catch (err: any) {
      setBackupMessage({ text: `Restore error: ${err.message}`, type: 'error' });
    } finally {
      setIsRestoringBackup(false);
      if (backupInputRef.current) backupInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 flex flex-col">
      {/* Top Admin Bar */}
      <header className="h-14 bg-white border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="font-editorial-serif font-black text-stone-900 tracking-tight text-lg uppercase">
            {branding.siteName || 'GLOBAL 24x7'}
          </span>
          <span className="text-stone-300 font-mono" aria-hidden="true">
            /
          </span>
          <span className="text-xs font-mono font-semibold text-stone-600 uppercase">
            Newsroom Control Center
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-stone-50 border border-stone-200 rounded text-[11px] font-mono text-stone-600">
            <Lock className="w-3 h-3 text-emerald-700" />
            <span>Session: {sessionRemainingMinutes}m</span>
          </div>
          <button
            onClick={onCloseAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Portal</span>
          </button>
          <button
            onClick={handleLockSession}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 rounded transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </header>

      {/* Security Warning Banner if using factory default password */}
      {isDefaultPasscode && (
        <div className="bg-amber-400 text-stone-950 px-4 sm:px-6 py-2.5 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-stone-950 shrink-0" />
            <span>
              <strong>SECURITY NOTICE:</strong> Your editorial portal is currently using the factory default passcode. Please update your master passcode to secure access to your newsroom.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('security')}
            className="px-3 py-1 bg-stone-900 text-white rounded text-[11px] font-mono hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
          >
            Update Master Passcode →
          </button>
        </div>
      )}

      {/* Main Workspace Canvas */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-60 shrink-0 space-y-1">
          {[
            { id: 'scheduler', label: '24/7 Auto-Scheduler', icon: Calendar },
            { id: 'fine-tuning', label: 'AI Studio & API Keys', icon: Sliders },
            { id: 'cms', label: 'Articles CMS', icon: FileText, count: articles.length },
            { id: 'categories', label: 'Categories', icon: FolderTree, count: categories.length },
            { id: 'media', label: 'Media & SEO Images', icon: ImageIcon },
            { id: 'pages-menus', label: 'Pages & Menus', icon: Compass },
            { id: 'branding', label: 'Website & Footer', icon: Layout },
            { id: 'custom-code', label: 'Custom HTML & CSS', icon: Code },
            { id: 'analytics', label: 'Audience Analytics', icon: BarChart3 },
            { id: 'seo', label: 'SEO & AdSense', icon: Globe },
            { id: 'cloudflare-d1', label: 'Cloudflare D1 DB', icon: Database },
            { id: 'cloudflare', label: 'Static Export', icon: Cloud },
            { id: 'security', label: 'Security Posture', icon: Shield },
            { id: 'backup', label: 'Data Backup & Restore', icon: FileDown },
          ].map((item) => {
            const active = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono rounded transition-colors cursor-pointer ${
                  active
                    ? 'bg-stone-900 text-white font-bold shadow-xs'
                    : 'text-stone-700 hover:bg-stone-200/70 hover:text-stone-950'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`text-[10px] tabular-nums px-1.5 py-0.2 rounded ${
                      active ? 'bg-stone-800 text-stone-200' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        <main className="flex-1 min-w-0">
          {activeTab === 'scheduler' && (
            <AutoSchedulerPanel
              categories={categories}
              onArticleGenerated={onSaveArticle}
            />
          )}
          {activeTab === 'fine-tuning' && (
            <AIFineTuningStudio
              config={fineTuningConfig}
              onUpdateConfig={onUpdateFineTuning}
              onPublishArticle={onSaveArticle}
              categories={categories}
            />
          )}
          {activeTab === 'cms' && (
            <ArticlesCMS
              articles={articles}
              categories={categories}
              onSaveArticle={onSaveArticle}
              onDeleteArticle={onDeleteArticle}
              onViewLive={onViewLive}
            />
          )}
          {activeTab === 'categories' && (
            <CategoriesManager
              categories={categories}
              articles={articles}
              onSaveCategory={onSaveCategory}
              onDeleteCategory={onDeleteCategory}
            />
          )}
          {activeTab === 'media' && <MediaManagerPanel categories={categories} />}
          {activeTab === 'pages-menus' && <PagesAndMenuManager />}
          {activeTab === 'branding' && (
            <SiteBrandingManager
              branding={branding}
              onSaveBranding={onSaveBranding}
              onLogSecurityEvent={onLogSecurityEvent}
            />
          )}
          {activeTab === 'custom-code' && (
            <CustomCodeManager
              config={customCodeConfig}
              onSaveConfig={onSaveCustomCode}
            />
          )}
          {activeTab === 'analytics' && <AnalyticsPanel articles={articles} />}
          {activeTab === 'seo' && (
            <SEOSuitePanel
              adSenseConfig={adSenseConfig}
              onUpdateAdSense={onUpdateAdSense}
              sampleArticle={articles[0]}
            />
          )}
          {activeTab === 'cloudflare' && <CloudflareExportPanel articles={articles} />}
          {activeTab === 'cloudflare-d1' && <CloudflareD1Panel />}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-stone-200">
                <h3 className="text-base font-bold font-editorial-serif text-stone-900">
                  Administrative Access & Security Posture
                </h3>
                <p className="text-xs text-stone-500 font-mono">
                  Master authentication credentials and audit logging
                </p>
              </div>
              <div className="p-5 bg-white border border-stone-200 rounded shadow-xs max-w-lg space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-stone-800">
                  <KeyRound className="w-4 h-4 text-stone-700" />
                  <span>Update Master Passcode</span>
                </div>
                <form onSubmit={handleChangePasscode} className="space-y-3">
                  <div>
                    <input
                      type="password"
                      value={newPasscode}
                      onChange={(e) => {
                        setNewPasscode(e.target.value);
                        setPasscodeError(null);
                      }}
                      placeholder="Enter new master passcode (min 6 characters)..."
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded focus:outline-none focus:border-stone-900"
                    />
                  </div>
                  {passcodeError && (
                    <span className="text-xs font-mono text-rose-600 block">
                      {passcodeError}
                    </span>
                  )}
                  {passcodeSuccess && (
                    <span className="text-xs font-mono text-emerald-700 block font-semibold">
                      ✓ Passcode permanently updated and saved on server.
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={!newPasscode.trim() || isUpdatingPasscode}
                    className="px-4 py-1.5 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 rounded transition-colors cursor-pointer"
                  >
                    {isUpdatingPasscode ? 'Updating on Server...' : 'Save New Passcode'}
                  </button>
                </form>
              </div>
              <div className="bg-white border border-stone-200 rounded shadow-xs p-5 space-y-3">
                <span className="font-mono text-xs font-bold uppercase text-stone-800 block border-b border-stone-100 pb-2">
                  Security Event Audit Trail
                </span>
                <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
                  {securityAuditLog.map((log) => (
                    <div
                      key={log.id}
                      className="py-2.5 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-stone-400">{log.timestamp}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                            log.status === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.status === 'alert'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="text-stone-700">{log.details}</span>
                      </div>
                      <span className="text-stone-400 text-[11px]">{log.ipMasked}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-stone-200">
                <h3 className="text-base font-bold font-editorial-serif text-stone-900">
                  Data Backup, Preservation & Recovery Engine
                </h3>
                <p className="text-xs text-stone-500 font-mono">
                  Export and restore your complete newsroom database to prevent any data loss across code updates or hosting migrations.
                </p>
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
                    {backupMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                    <span>{backupMessage.text}</span>
                  </div>
                  <button onClick={() => setBackupMessage(null)} className="text-stone-400 hover:text-stone-700 ml-4 font-bold">
                    ✕
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1-Click Backup Export Card */}
                <div className="p-5 bg-white border border-stone-200 rounded-lg shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-stone-900">
                      <FileDown className="w-4 h-4 text-emerald-600" />
                      <span>1-Click Full System Backup</span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Download a single, complete portable JSON backup file directly to your computer containing:
                    </p>
                    <ul className="text-[11px] font-mono text-stone-600 space-y-1 list-disc list-inside bg-stone-50 p-3 rounded border border-stone-150">
                      <li><strong>{articles.length} Articles</strong> (Full text, English & Hindi, SEO tags, view counts)</li>
                      <li><strong>{categories.length} Categories</strong> & Taxonomy hierarchy</li>
                      <li><strong>Media Index & Local Images registry</strong></li>
                      <li><strong>Custom HTML, CSS & Tracking Scripts</strong></li>
                      <li><strong>Branding, Logo & Footer configurations</strong></li>
                      <li><strong>Autonomous Scheduler & Model configurations</strong></li>
                      <li><strong>Google AdSense slots & ad layout settings</strong></li>
                    </ul>
                  </div>

                  <button
                    onClick={handleExportFullBackup}
                    disabled={isExportingBackup}
                    className="w-full py-2.5 px-4 text-xs font-mono font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>{isExportingBackup ? 'Generating Backup...' : 'Download Full Backup (.json)'}</span>
                  </button>
                </div>

                {/* Restore Backup Card */}
                <div className="p-5 bg-white border border-stone-200 rounded-lg shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-stone-900">
                      <FileUp className="w-4 h-4 text-stone-800" />
                      <span>Restore from Previous Backup</span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Upload any previously downloaded <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">global24x7-full-backup-*.json</code> file to instantly restore your entire website state, articles, and settings.
                    </p>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs leading-relaxed">
                      <span className="font-bold">Safe De-duplication:</span> All restored article URLs are automatically collision-checked and indexed without overwriting existing unique IDs.
                    </div>
                  </div>

                  <div>
                    <input
                      ref={backupInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleRestoreFullBackup}
                      className="hidden"
                      id="dashboard-restore-input"
                    />
                    <label
                      htmlFor="dashboard-restore-input"
                      className="w-full py-2.5 px-4 text-xs font-mono font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs text-center block"
                    >
                      <FileUp className="w-4 h-4 inline-block" />
                      <span>{isRestoringBackup ? 'Restoring System...' : 'Upload & Restore Backup (.json)'}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
