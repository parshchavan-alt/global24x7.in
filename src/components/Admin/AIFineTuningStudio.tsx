import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  Send,
  RefreshCw,
  Cpu,
  KeyRound,
  Trash2,
  Activity,
  Check,
  ShieldAlert,
  Plus,
} from 'lucide-react';
import {
  AIFineTuningConfig,
  Article,
  CustomCategory,
  GeminiModel,
  KeyPoolTelemetry,
} from '../../types';
import {
  fetchKeyPoolStatusSafe,
  addApiKeySafe,
  removeApiKeySafe,
  testApiKeySafe,
  getLocalKeys,
} from '../../utils/keyStorage';
import { safeFetchJson } from '../../utils/apiSafe';
import { generateArticleDirectly } from '../../utils/geminiDirect';

interface AIFineTuningStudioProps {
  config: AIFineTuningConfig;
  onUpdateConfig: (cfg: AIFineTuningConfig) => void;
  onPublishArticle: (article: Article) => void;
  categories: CustomCategory[];
}

export const AIFineTuningStudio: React.FC<AIFineTuningStudioProps> = ({
  config,
  onUpdateConfig,
  onPublishArticle,
  categories,
}) => {
  const [testCategory, setTestCategory] = useState<string>(
    categories[0]?.name || 'Technology'
  );
  const [testTopic, setTestTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<Article | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  // Key Pool State & Management
  const [keyPoolTelemetry, setKeyPoolTelemetry] = useState<KeyPoolTelemetry | null>(null);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestFeedback, setKeyTestFeedback] = useState<string | null>(null);

  const fetchKeyPoolStatus = async () => {
    try {
      const telemetry = await fetchKeyPoolStatusSafe();
      setKeyPoolTelemetry(telemetry);
    } catch {
      // safe fallback
    }
  };

  useEffect(() => {
    fetchKeyPoolStatus();
    const interval = setInterval(fetchKeyPoolStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyInput.trim()) return;

    setIsAddingKey(true);
    setKeyTestFeedback(null);
    try {
      const result = await addApiKeySafe(newKeyInput.trim(), newKeyLabel.trim());
      if (result.success) {
        setNewKeyInput('');
        setNewKeyLabel('');
        setKeyTestFeedback(result.message);
        await fetchKeyPoolStatus();
      } else {
        setKeyTestFeedback(`Notice: ${result.message}`);
      }
    } catch (err: any) {
      setKeyTestFeedback(`Notice: ${err.message || 'Key processed'}`);
    } finally {
      setIsAddingKey(false);
    }
  };

  const handleRemoveKey = async (id?: string, index?: number) => {
    if (!confirm('Remove this API key from the rotation pool?')) return;
    try {
      await removeApiKeySafe(id, index);
      await fetchKeyPoolStatus();
    } catch {}
  };

  const handleTestKeyConnectivity = async (specificKey?: string) => {
    const keyToTest = specificKey || newKeyInput.trim();
    setIsTestingKey(true);
    setKeyTestFeedback(null);
    try {
      const result = await testApiKeySafe(keyToTest);
      setKeyTestFeedback(result.message);
      await fetchKeyPoolStatus();
    } catch (err: any) {
      setKeyTestFeedback(`Verification note: ${err.message || 'Could not verify'}`);
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleTestGenerate = async () => {
    setIsGenerating(true);
    setStatusMessage(null);
    setIsError(false);
    setGeneratedArticle(null);

    try {
      const res = await safeFetchJson<{
        success: boolean;
        article?: Article;
        modelUsed?: string;
        activeAccount?: string;
        message?: string;
        error?: string;
      }>('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: testCategory,
          topic: testTopic,
          fineTuning: config,
          autoPublish: false,
        }),
      });

      if (res.ok && res.data?.success && res.data.article) {
        setGeneratedArticle(res.data.article);
        setStatusMessage(
          `Synthesized via ${res.data.modelUsed || config.selectedModel || 'gemini-3.8-flash'} using ${
            res.data.activeAccount || 'Active Account'
          }.`
        );
        await fetchKeyPoolStatus();
        return;
      }

      const localKeys = getLocalKeys();
      const activeKey = localKeys[0]?.key;
      if (activeKey) {
        setStatusMessage('Connecting directly to Google Gemini via browser engine...');
        const directResult = await generateArticleDirectly(
          activeKey,
          testCategory,
          testTopic,
          config.selectedModel || 'gemini-3.8-flash'
        );
        if (directResult.success && directResult.article) {
          setGeneratedArticle(directResult.article);
          setStatusMessage('✓ Synthesized successfully via Google Gemini client engine!');
          return;
        } else {
          setIsError(true);
          setStatusMessage(directResult.error || 'Direct synthesis failed. Please verify your Gemini API key.');
          return;
        }
      }

      setIsError(true);
      setStatusMessage(
        res.data?.message ||
          res.data?.error ||
          res.error ||
          'Please enter a valid Gemini API key in the manager above first.'
      );
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(`Synthesis note: ${err.message || 'Please check your API key'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishGenerated = () => {
    if (!generatedArticle) return;
    const published: Article = {
      ...generatedArticle,
      status: 'published',
      publishedAt: new Date().toISOString(),
    };
    onPublishArticle(published);
    setStatusMessage('Article published directly to public portal!');
  };

  const totalKeys = keyPoolTelemetry?.totalKeysConfigured || 0;
  const allExhausted =
    totalKeys > 0 &&
    keyPoolTelemetry?.accounts.every((a) => a.status === 'exhausted');

  return (
    <div className="space-y-6">
      {/* SECTION 1: IN-PANEL MULTI-ACCOUNT API KEYS MANAGEMENT */}
      <div className="p-5 bg-white border border-stone-200 rounded shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-stone-900" />
            <div>
              <h4 className="text-sm font-bold font-mono uppercase text-stone-900">
                Gemini API Keys & Multi-Account Rotation Manager
              </h4>
              <p className="text-xs text-stone-500 font-mono">
                Store up to 5 keys from multiple Google accounts • Auto-switches when daily free limits are reached
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTestKeyConnectivity()}
              disabled={isTestingKey || (totalKeys === 0 && !newKeyInput.trim())}
              className="px-3 py-1.5 text-xs font-mono font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded border border-stone-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isTestingKey ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Verifying Key...</span>
                </>
              ) : (
                <>
                  <Activity className="w-3 h-3 text-emerald-600" />
                  <span>Test Key Connectivity</span>
                </>
              )}
            </button>
          </div>
        </div>

        {allExhausted && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded text-xs font-mono text-amber-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>All Account Quotas Exhausted:</strong> Free tier limits were reached on all configured accounts. Please paste another free Gemini key from a secondary Google account below.
            </span>
          </div>
        )}

        {keyTestFeedback && (
          <div
            className={`p-3 rounded text-xs font-mono flex items-center justify-between ${
              keyTestFeedback.includes('Error') || keyTestFeedback.includes('failed')
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <span>{keyTestFeedback}</span>
            <button
              onClick={() => setKeyTestFeedback(null)}
              className="text-stone-400 hover:text-stone-700 ml-4 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Existing Configured Keys List */}
        <div className="space-y-2">
          {keyPoolTelemetry && keyPoolTelemetry.accounts.length > 0 ? (
            keyPoolTelemetry.accounts.map((acc, idx) => (
              <div
                key={acc.id || idx}
                className={`p-3 rounded border text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  acc.status === 'active'
                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 font-medium'
                    : acc.status === 'exhausted'
                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                    : 'border-stone-200 bg-stone-50 text-stone-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      acc.status === 'active'
                        ? 'bg-emerald-600 animate-pulse'
                        : acc.status === 'exhausted'
                        ? 'bg-amber-500'
                        : 'bg-stone-400'
                    }`}
                  />
                  <span className="font-bold">{acc.label}</span>
                  <span className="text-stone-400">({acc.maskedKey})</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                      acc.status === 'active'
                        ? 'bg-emerald-200 text-emerald-900'
                        : acc.status === 'exhausted'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {acc.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] self-end sm:self-auto">
                  <span className="text-stone-500 tabular-nums">
                    {acc.requestsHandled} dispatches handled
                  </span>
                  <button
                    onClick={() => handleRemoveKey(acc.id, acc.index)}
                    title="Remove this key"
                    className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 bg-stone-50 border border-stone-200 rounded text-xs text-stone-500 font-mono text-center">
              No custom API keys configured. Paste your Gemini key below to enable automated publishing.
            </div>
          )}
        </div>

        {/* Add New Key Form */}
        <form
          onSubmit={handleAddApiKey}
          className="p-4 bg-stone-50 border border-stone-200 rounded space-y-3"
        >
          <div className="text-xs font-bold font-mono uppercase text-stone-800">
            Add Another Gemini Account API Key (Free Quota Pool)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-mono text-stone-500 mb-1">
                Account Label / Note:
              </label>
              <input
                type="text"
                placeholder="e.g. Account 2 (Backup)"
                value={newKeyLabel}
                onChange={(e) => setNewKeyLabel(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-stone-300 rounded focus:border-stone-900 outline-none bg-white"
              />
            </div>
            <div className="sm:col-span-6">
              <label className="block text-[11px] font-mono text-stone-500 mb-1">
                Gemini API Key:
              </label>
              <input
                type="password"
                placeholder="Paste API key here (AIzaSy...)"
                value={newKeyInput}
                onChange={(e) => setNewKeyInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-stone-300 rounded focus:border-stone-900 outline-none bg-white"
              />
            </div>
            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={isAddingKey || !newKeyInput.trim() || totalKeys >= 5}
                className="w-full py-1.5 px-3 text-xs font-mono font-semibold bg-stone-900 text-white rounded hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Key</span>
              </button>
            </div>
          </div>
          <p className="text-[11px] text-stone-400 font-mono">
            Keys are stored securely on your server in <code>.data/api-keys.json</code>.
          </p>
        </form>
      </div>

      {/* SECTION 2: AI MODEL SELECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 p-5 bg-white border border-stone-200 rounded shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
            <Cpu className="w-4 h-4 text-stone-800" />
            <h4 className="text-xs font-bold font-mono uppercase text-stone-900">
              Generative Model Architecture
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                id: 'gemini-3.8-flash' as GeminiModel,
                name: 'Gemini 3.8 Flash (Recommended)',
                badge: 'Flagship Intelligence',
                desc: 'Standard for broadsheet journalism, historical depth, and nuanced Hindi/English translation.',
              },
              {
                id: 'gemini-3.1-flash-lite' as GeminiModel,
                name: 'Gemini 3.1 Flash Lite',
                badge: 'Max Throughput',
                desc: 'Ultra-low latency model for high-frequency wire reporting and rapid summary synthesis.',
              },
              {
                id: 'gemini-flash-latest' as GeminiModel,
                name: 'Gemini Flash Latest',
                badge: 'General Release',
                desc: 'Standard continuous release flash model for general-purpose publishing.',
              },
            ].map((m) => {
              const active = (config.selectedModel || 'gemini-3.8-flash') === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onUpdateConfig({ ...config, selectedModel: m.id })}
                  className={`text-left p-3.5 rounded border transition-colors cursor-pointer ${
                    active
                      ? 'border-stone-900 bg-stone-100/90 shadow-xs'
                      : 'border-stone-200 hover:border-stone-400 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-stone-900 font-mono">
                      {m.name}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-stone-600 bg-stone-200/70 px-1.5 py-0.5 rounded inline-block mb-1.5">
                    {m.badge}
                  </div>
                  <p className="text-[11px] text-stone-500 leading-tight">{m.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: EDITORIAL PERSONA & LIVE SANDBOX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Fine-Tuning Controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-200">
            <Sliders className="w-5 h-5 text-stone-800" />
            <h3 className="text-base font-bold font-editorial-serif text-stone-900">
              Journalistic Tone & Prompt Engine
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2 font-mono uppercase">
              Editorial Persona & Style Model
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'investigative',
                  name: 'Investigative Broadsheet',
                  desc: 'Deep institutional analysis, data-grounded, authoritative.',
                },
                {
                  id: 'analytical',
                  name: 'Analytical Explainer',
                  desc: 'Deconstructs complex mechanics with clarity and historical context.',
                },
                {
                  id: 'dispatch',
                  name: 'Wire Dispatch',
                  desc: 'Fast, strictly objective, urgent factual delivery.',
                },
                {
                  id: 'essayist',
                  name: 'Cultural Essayist',
                  desc: 'Nuanced, reflective, literary prose with rich metaphors.',
                },
              ].map((p) => {
                const active = config.writingPersona === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      onUpdateConfig({ ...config, writingPersona: p.id as any })
                    }
                    className={`text-left p-3 rounded border transition-colors cursor-pointer ${
                      active
                        ? 'border-stone-900 bg-stone-100/80 shadow-xs'
                        : 'border-stone-200 hover:border-stone-400 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-stone-900 font-mono mb-0.5">
                      {p.name}
                    </div>
                    <p className="text-[11px] text-stone-500 leading-tight">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 p-4 bg-stone-50 border border-stone-200 rounded">
            <div>
              <div className="flex items-center justify-between text-xs mb-1 font-mono">
                <span className="font-semibold text-stone-700">Formality Level</span>
                <span className="text-stone-500">Tier {config.toneFormality} of 5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={config.toneFormality}
                onChange={(e) =>
                  onUpdateConfig({ ...config, toneFormality: Number(e.target.value) })
                }
                className="w-full accent-stone-900 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1 font-mono">
                <span className="font-semibold text-stone-700">Analytical Depth</span>
                <span className="text-stone-500">Tier {config.depthLevel} of 5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={config.depthLevel}
                onChange={(e) =>
                  onUpdateConfig({ ...config, depthLevel: Number(e.target.value) })
                }
                className="w-full accent-stone-900 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1 font-mono">
                <span className="font-semibold text-stone-700">Target Word Count</span>
                <span className="text-stone-500">~{config.targetWordCount} words</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[500, 800, 1200, 1600].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => onUpdateConfig({ ...config, targetWordCount: count })}
                    className={`py-1.5 text-xs font-mono rounded border transition-colors cursor-pointer ${
                      config.targetWordCount === count
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'
                    }`}
                  >
                    {count}w
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
              Custom Newsroom System Directives
            </label>
            <textarea
              rows={3}
              value={config.customSystemDirectives || ''}
              onChange={(e) =>
                onUpdateConfig({ ...config, customSystemDirectives: e.target.value })
              }
              placeholder="e.g. Always emphasize empirical economic data and global monetary impacts; avoid sensationalism."
              className="w-full p-2.5 text-xs font-mono border border-stone-300 rounded focus:border-stone-900 outline-none"
            />
          </div>
        </div>

        {/* Right Column: Live Dispatch Sandbox */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-stone-50 border border-stone-200 rounded space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
              <Sparkles className="w-4 h-4 text-stone-800" />
              <h4 className="text-xs font-bold font-mono uppercase text-stone-900">
                Live AI Dispatch Testing Sandbox
              </h4>
            </div>
            <div>
              <label className="block text-xs font-mono text-stone-600 mb-1">
                Category:
              </label>
              <select
                value={testCategory}
                onChange={(e) => setTestCategory(e.target.value)}
                className="w-full p-2 text-xs border border-stone-300 rounded bg-white font-mono"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-stone-600 mb-1">
                Specific Topic or Angle (Optional):
              </label>
              <input
                type="text"
                value={testTopic}
                onChange={(e) => setTestTopic(e.target.value)}
                placeholder="Leave blank for autonomous breaking topic..."
                className="w-full p-2 text-xs border border-stone-300 rounded bg-white font-mono"
              />
            </div>
            <button
              onClick={handleTestGenerate}
              disabled={isGenerating}
              className="w-full py-2.5 text-xs font-semibold bg-stone-900 text-white rounded hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Article with AI...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Run Sandbox Test Generation</span>
                </>
              )}
            </button>
            {statusMessage && (
              <div
                className={`p-3 rounded text-xs font-mono leading-relaxed ${
                  isError
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {statusMessage}
              </div>
            )}
          </div>

          {generatedArticle && (
            <div className="p-4 bg-white border border-stone-300 rounded space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-stone-100 rounded text-stone-700 font-bold">
                  {generatedArticle.category}
                </span>
                <span className="text-[10px] font-mono text-stone-400">
                  {generatedArticle.readingTimeMinutes} min read
                </span>
              </div>
              <h4 className="font-editorial-serif font-bold text-sm text-stone-900 leading-snug">
                {generatedArticle.title}
              </h4>
              <p className="text-xs text-stone-600 line-clamp-3">
                {generatedArticle.summary}
              </p>
              <button
                onClick={handlePublishGenerated}
                className="w-full py-2 text-xs font-semibold bg-emerald-800 text-white rounded hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Publish Directly to Front Page</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
