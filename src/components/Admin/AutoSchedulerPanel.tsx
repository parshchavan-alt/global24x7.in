import React, { useState, useEffect } from 'react';
import {
  Play,
  Clock,
  RotateCw,
  Sparkles,
  Shuffle,
  TrendingUp,
  BookOpen,
  Layers,
} from 'lucide-react';
import {
  SchedulerConfig,
  Article,
  CustomCategory,
  SchedulerExecutionLog,
  TopicMixStrategy,
} from '../../types';
import { safeFetchJson } from '../../utils/apiSafe';
import { getLocalKeys } from '../../utils/keyStorage';
import { generateArticleDirectly } from '../../utils/geminiDirect';

interface AutoSchedulerPanelProps {
  categories: CustomCategory[];
  onArticleGenerated: (article: Article) => void;
  onNavigateToArticle?: (slug: string) => void;
}

const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  enabled: true,
  frequencyMinutes: 60,
  naturalJitter: true,
  topicStrategy: 'balanced',
  categoriesInRotation: ['Technology', 'Business', 'World', 'Science', 'Health', 'Culture'],
  autoPublish: true,
  languageMode: 'both',
  articlesGeneratedCount: 0,
};

function getInitialSchedulerConfig(): SchedulerConfig {
  try {
    const raw = localStorage.getItem('global24x7_scheduler_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.frequencyMinutes === 'number') {
        return { ...DEFAULT_SCHEDULER_CONFIG, ...parsed };
      }
    }
  } catch {}
  return DEFAULT_SCHEDULER_CONFIG;
}

export const AutoSchedulerPanel: React.FC<AutoSchedulerPanelProps> = ({
  categories,
  onArticleGenerated,
}) => {
  const [config, setConfig] = useState<SchedulerConfig>(getInitialSchedulerConfig);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(() => {
    return (getInitialSchedulerConfig().frequencyMinutes || 60) * 60;
  });
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [isRunningCycle, setIsRunningCycle] = useState(false);
  const [logs, setLogs] = useState<SchedulerExecutionLog[]>([]);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>(() =>
    String(getInitialSchedulerConfig().frequencyMinutes || 60)
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchSchedulerState = async () => {
    try {
      const res = await safeFetchJson<{
        success: boolean;
        config?: SchedulerConfig;
        countdownSeconds?: number;
        isRunningCycle?: boolean;
        logs?: SchedulerExecutionLog[];
      }>('/api/scheduler');
      if (res.ok && res.data?.config) {
        setIsServerConnected(true);
        setConfig(res.data.config);
        setCustomMinutesInput(String(res.data.config.frequencyMinutes));
        if (typeof res.data.countdownSeconds === 'number') {
          setCountdownSeconds(res.data.countdownSeconds);
        }
        setIsRunningCycle(res.data.isRunningCycle || false);
        if (res.data.logs) {
          setLogs(res.data.logs);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch scheduler state:', err);
    }
  };

  useEffect(() => {
    fetchSchedulerState();
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (!config.enabled) return prev;
        if (prev <= 1) {
          if (!isServerConnected && !isRunningCycle) {
            handleRunNow();
          }
          return (config.frequencyMinutes || 60) * 60;
        }
        return prev - 1;
      });
    }, 1000);

    const syncInterval = setInterval(fetchSchedulerState, 20000);
    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, [config.enabled, config.frequencyMinutes, isServerConnected, isRunningCycle]);

  const updateConfigOnServer = async (newConfig: Partial<SchedulerConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    try {
      localStorage.setItem('global24x7_scheduler_config', JSON.stringify(updated));
    } catch {}

    if (newConfig.frequencyMinutes && newConfig.frequencyMinutes !== config.frequencyMinutes) {
      setCountdownSeconds(newConfig.frequencyMinutes * 60);
    }

    try {
      const res = await safeFetchJson<{ success: boolean; config?: SchedulerConfig }>('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (res.ok && res.data?.config) {
        setIsServerConnected(true);
        setConfig(res.data.config);
      }
    } catch (err) {
      console.error('Failed to update scheduler config:', err);
    }
  };

  const handleRunNow = async () => {
    setIsRunningCycle(true);
    setStatusMessage('Initiating autonomous cycle on newsroom server...');
    try {
      let res = await safeFetchJson<{
        success: boolean;
        article?: Article;
        error?: string;
      }>('/api/scheduler/run-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // If server returned 401, attempt auto-syncing credentials once and retry
      if (!res.ok && res.status === 401) {
        const savedPasscode = localStorage.getItem('chronicle_admin_passcode');
        if (savedPasscode) {
          const syncRes = await safeFetchJson('/api/auth/sync-credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ savedPasscode }),
          });
          if (syncRes.ok && syncRes.data?.token) {
            sessionStorage.setItem('chronicle_admin_session', syncRes.data.token);
            localStorage.setItem('chronicle_admin_token', syncRes.data.token);
            res = await safeFetchJson('/api/scheduler/run-now', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }
      }

      if (res.ok && res.data?.success && res.data.article) {
        onArticleGenerated(res.data.article);
        setStatusMessage(`Cycle complete! Published: "${res.data.article.title}"`);
        fetchSchedulerState();
        return;
      }

      const localKeys = getLocalKeys();
      const activeKey = localKeys[0]?.key;
      if (activeKey) {
        setStatusMessage('Synthesizing scheduled article via client engine (Gemini 3.8 Flash)...');
        const activeCats = config.categoriesInRotation?.length ? config.categoriesInRotation : categories.map((c) => c.name);
        const randomCat = activeCats[Math.floor(Math.random() * activeCats.length)] || 'Technology';
        const directResult = await generateArticleDirectly(activeKey, randomCat);
        if (directResult.success && directResult.article) {
          onArticleGenerated(directResult.article);
          setStatusMessage(`Cycle complete! Published: "${directResult.article.title}" (Browser Engine)`);
          const newLog: SchedulerExecutionLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            category: randomCat,
            title: directResult.article.title,
            status: 'Success (Published)',
            topicType: 'breaking',
            language: 'en',
            modelUsed: 'gemini-3.8-flash (Client)',
            articleId: directResult.article.id,
          };
          setLogs((prev) => [newLog, ...prev]);
          updateConfigOnServer({
            articlesGeneratedCount: (config.articlesGeneratedCount || 0) + 1,
            lastRunTimestamp: new Date().toISOString(),
          });
          return;
        } else {
          setStatusMessage(directResult.error || 'Cycle generation failed. Please verify API key.');
          return;
        }
      }

      setStatusMessage(res.error || res.data?.error || 'Please add a Gemini API key in the AI Tuning panel first.');
    } catch (err: any) {
      setStatusMessage(err.message || 'Error triggering cycle');
    } finally {
      setIsRunningCycle(false);
    }
  };

  const toggleCategoryInRotation = (catName: string) => {
    const exists = config.categoriesInRotation.includes(catName);
    const updated = exists
      ? config.categoriesInRotation.filter((c) => c !== catName)
      : [...config.categoriesInRotation, catName];
    updateConfigOnServer({ categoriesInRotation: updated });
  };

  const formatCountdown = (totalSecs: number) => {
    if (totalSecs <= 0) return 'Publishing Soon...';
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    }
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const FREQUENCY_PRESETS = [
    { label: '15 Mins (Breaking Wire)', mins: 15 },
    { label: '30 Mins (Fast Newsroom)', mins: 30 },
    { label: '1 Hour (Standard Broadsheet)', mins: 60 },
    { label: '2 Hours (Deep Analysis)', mins: 120 },
    { label: '4 Hours (Edition Cycle)', mins: 240 },
    { label: '6 Hours (Quarter-Day)', mins: 360 },
    { label: '12 Hours (Twice Daily)', mins: 720 },
    { label: '24 Hours (Daily Morning Edition)', mins: 1440 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-stone-900 text-white flex items-center justify-center font-bold font-editorial-serif text-lg">
            24
          </div>
          <div>
            <h3 className="text-base font-bold font-editorial-serif text-stone-900">
              Global 24x7 Autonomous Publishing & Cadence Engine
            </h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isServerConnected
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-blue-100 text-blue-900 border border-blue-300'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {isServerConnected
                  ? 'Server 24/7 Cron Daemon Active'
                  : 'Client Engine Mode Active'}
              </span>
              <p className="text-xs text-stone-500 font-mono">
                {isServerConnected
                  ? 'Autonomous background publisher active 24 hours a day'
                  : 'Auto-publishes articles on schedule while admin tab is open'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunNow}
            disabled={isRunningCycle}
            className="px-4 py-2 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 rounded flex items-center gap-2 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            {isRunningCycle ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Server Cycle...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run Autonomous Cycle Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-stone-100 border border-stone-300 rounded text-xs font-mono text-stone-800 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-stone-400 hover:text-stone-700 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main 3-Column Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-white border border-stone-200 rounded shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-stone-700 uppercase">
              24/7 Background Daemon
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                config.enabled ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-stone-200 text-stone-600'
              }`}
            >
              {config.enabled ? 'Active 24/7' : 'Suspended'}
            </span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            The scheduler runs persistently on the host server in Node.js. Even if your browser is closed, articles continue publishing on cadence.
          </p>
          <button
            onClick={() => updateConfigOnServer({ enabled: !config.enabled })}
            className={`w-full py-2.5 text-xs font-semibold rounded border transition-colors cursor-pointer ${
              config.enabled
                ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {config.enabled ? 'Pause 24/7 Automation Engine' : 'Arm Continuous 24/7 Scheduler'}
          </button>
          <div className="pt-2 border-t border-stone-100 text-[11px] font-mono text-stone-500">
            Total Articles Synthesized: <strong>{config.articlesGeneratedCount}</strong>
          </div>
        </div>

        <div className="p-5 bg-white border border-stone-200 rounded shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-stone-700 uppercase">
              Next Scheduled Dispatch
            </span>
            <Clock className="w-4 h-4 text-stone-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-stone-900 tabular-nums">
            {config.enabled ? formatCountdown(countdownSeconds) : 'Engine Paused'}
          </div>
          <div className="text-xs text-stone-600 font-mono">
            Pacing: <strong>Every {config.frequencyMinutes} Minutes</strong>
            {config.naturalJitter && <span className="text-stone-400"> (±10% Jitter)</span>}
          </div>
          <div className="text-[11px] text-stone-500 font-mono truncate">
            Next target: {config.nextRunTimestamp ? new Date(config.nextRunTimestamp).toLocaleTimeString() : 'Pending'}
          </div>
          <label className="flex items-center gap-2 pt-2 border-t border-stone-100 text-xs text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={config.naturalJitter}
              onChange={(e) => updateConfigOnServer({ naturalJitter: e.target.checked })}
              className="rounded accent-stone-900"
            />
            <span className="flex items-center gap-1">
              <Shuffle className="w-3 h-3 text-stone-500" />
              <span>Organic publication pacing (randomize ±10%)</span>
            </span>
          </label>
        </div>

        <div className="p-5 bg-white border border-stone-200 rounded shadow-xs space-y-3">
          <span className="font-mono text-xs font-semibold text-stone-700 uppercase block">
            Publishing Gatekeeper & Language
          </span>
          <label className="flex items-center gap-2.5 text-xs text-stone-800 cursor-pointer">
            <input
              type="radio"
              name="publishMode"
              checked={config.autoPublish}
              onChange={() => updateConfigOnServer({ autoPublish: true })}
              className="accent-stone-900"
            />
            <span>Publish Directly to Live Front Page</span>
          </label>
          <label className="flex items-center gap-2.5 text-xs text-stone-800 cursor-pointer">
            <input
              type="radio"
              name="publishMode"
              checked={!config.autoPublish}
              onChange={() => updateConfigOnServer({ autoPublish: false })}
              className="accent-stone-900"
            />
            <span>Hold in Draft Review Queue</span>
          </label>
          <div className="pt-2 border-t border-stone-100">
            <span className="text-[11px] font-mono text-stone-500 block mb-1.5 uppercase">
              Language Output:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'both', label: 'EN + HI (Dual)' },
                { id: 'en_only', label: 'English Only' },
                { id: 'hi_only', label: 'हिन्दी' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => updateConfigOnServer({ languageMode: lang.id as any })}
                  className={`py-1.5 px-2 text-[10px] font-mono rounded border text-center transition-colors cursor-pointer ${
                    config.languageMode === lang.id
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cadence Presets */}
      <div className="p-5 bg-white border border-stone-200 rounded space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-stone-800" />
            <h4 className="text-xs font-bold font-mono uppercase text-stone-900">
              Customize Publication Cadence & Timing Variations
            </h4>
          </div>
          <span className="text-[11px] font-mono text-stone-400">
            Choose a preset or set exact custom minutes
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {FREQUENCY_PRESETS.map((p) => {
            const active = config.frequencyMinutes === p.mins;
            return (
              <button
                key={p.mins}
                type="button"
                onClick={() => {
                  setCustomMinutesInput(String(p.mins));
                  updateConfigOnServer({ frequencyMinutes: p.mins });
                }}
                className={`text-left p-3 rounded border transition-colors cursor-pointer ${
                  active
                    ? 'border-stone-900 bg-stone-100 font-semibold text-stone-900 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-400 text-stone-700'
                }`}
              >
                <div className="text-xs font-mono">{p.label}</div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
          <label className="text-xs font-mono text-stone-600">
            Or specify custom interval in minutes:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="5"
              max="10080"
              value={customMinutesInput}
              onChange={(e) => setCustomMinutesInput(e.target.value)}
              className="w-24 px-3 py-1.5 text-xs font-mono border border-stone-300 rounded focus:border-stone-900 outline-none"
            />
            <button
              onClick={() => {
                const mins = parseInt(customMinutesInput, 10);
                if (mins && mins >= 5) {
                  updateConfigOnServer({ frequencyMinutes: mins });
                }
              }}
              className="px-3 py-1.5 text-xs font-mono font-semibold bg-stone-900 text-white rounded hover:bg-stone-800 cursor-pointer"
            >
              Apply Interval
            </button>
          </div>
        </div>
      </div>

      {/* Topic Strategy Mix */}
      <div className="p-5 bg-white border border-stone-200 rounded space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-bold font-mono uppercase text-stone-900">
              Article Topic Mix Strategy: Latest News vs. Evergreen Traffic
            </h4>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 font-semibold">
            SEO & AdSense Traffic Maximizer
          </span>
        </div>
        <p className="text-xs text-stone-600">
          Balance immediate high-interest breaking stories with timeless, authoritative guides that bring recurring organic visitors for months:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: 'balanced' as TopicMixStrategy,
              title: 'Balanced 50/50 Mix (Recommended)',
              badge: 'Highest AdSense & SEO ROI',
              desc: 'Alternates every cycle: one breaking dispatch, followed by one comprehensive evergreen guide or explainer.',
              icon: Layers,
            },
            {
              id: 'breaking_trending' as TopicMixStrategy,
              title: 'Breaking & Trending Focus',
              badge: 'Viral & Google Discover',
              desc: 'Focuses 100% on urgent regulatory shifts, market surprises, and live developments for rapid surge traffic.',
              icon: TrendingUp,
            },
            {
              id: 'evergreen_pillars' as TopicMixStrategy,
              title: 'Evergreen Traffic Pillars',
              badge: 'Long-Term Passive Traffic',
              desc: 'Focuses 100% on definitive guides, architectural explainers, and timeless reference pieces with high search intent.',
              icon: BookOpen,
            },
          ].map((strat) => {
            const active = (config.topicStrategy || 'balanced') === strat.id;
            const Icon = strat.icon;
            return (
              <button
                key={strat.id}
                type="button"
                onClick={() => updateConfigOnServer({ topicStrategy: strat.id })}
                className={`text-left p-4 rounded border transition-colors cursor-pointer ${
                  active
                    ? 'border-stone-900 bg-stone-100/90 shadow-xs'
                    : 'border-stone-200 hover:border-stone-400 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900 font-mono">
                    <Icon className="w-3.5 h-3.5 text-stone-800" />
                    <span>{strat.title}</span>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded inline-block mb-1.5">
                  {strat.badge}
                </div>
                <p className="text-[11px] text-stone-500 leading-tight">{strat.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Rotation */}
      <div className="p-5 bg-stone-50 border border-stone-200 rounded space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-stone-800 font-mono uppercase">
            Active Category Rotation Queue
          </div>
          <span className="text-[11px] font-mono text-stone-500">
            {config.categoriesInRotation.length} active departments
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {categories.map((cat) => {
            const isChecked = config.categoriesInRotation.includes(cat.name);
            return (
              <label
                key={cat.id}
                className={`flex items-center gap-2 p-2.5 rounded text-xs cursor-pointer border transition-colors ${
                  isChecked
                    ? 'bg-white border-stone-900 text-stone-900 font-medium shadow-xs'
                    : 'bg-stone-100/70 border-stone-200 text-stone-500'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCategoryInRotation(cat.name)}
                  className="rounded accent-stone-900"
                />
                <span className="truncate">{cat.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Execution Logs */}
      <div className="bg-white border border-stone-200 rounded p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <span className="font-mono text-xs font-semibold text-stone-700 uppercase">
            24/7 Server Autonomous Execution Log
          </span>
          <span className="text-[11px] font-mono text-stone-400">
            {logs.length} logged runs
          </span>
        </div>
        {logs.length === 0 ? (
          <p className="text-xs text-stone-400 italic py-4 text-center">
            No runs recorded yet. Click "Run Autonomous Cycle Now" above to trigger article generation.
          </p>
        ) : (
          <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className="py-2.5 flex items-center justify-between text-xs font-mono gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-stone-400 shrink-0">{log.timestamp}</span>
                  <span className="px-1.5 py-0.5 bg-stone-100 rounded text-stone-800 font-bold shrink-0">
                    {log.category}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${
                      log.topicType === 'evergreen'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {log.topicType === 'evergreen' ? 'Evergreen Pillar' : 'Breaking Wire'}
                  </span>
                  <span className="text-stone-800 truncate font-sans font-medium">
                    {log.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-emerald-700 text-[11px]">{log.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
