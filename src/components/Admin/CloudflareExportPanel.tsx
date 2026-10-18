import React, { useState } from 'react';
import { Cloud, Download, Github, Check, Copy, FileText, Terminal, FolderArchive } from 'lucide-react';
import { Article } from '../../types';

interface CloudflareExportPanelProps {
  articles: Article[];
}

export const CloudflareExportPanel: React.FC<CloudflareExportPanelProps> = ({ articles }) => {
  const [downloadingBundle, setDownloadingBundle] = useState(false);
  const [downloadingArchive, setDownloadingArchive] = useState(false);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [userRepoUrl, setUserRepoUrl] = useState('https://github.com/YOUR_USERNAME/chronicle-news.git');

  const handleDownloadBundle = async () => {
    setDownloadingBundle(true);
    try {
      const response = await fetch('/api/export/cloudflare-bundle');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cloudflare-pages-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export download failed:', err);
    } finally {
      setDownloadingBundle(false);
    }
  };

  const handleDownloadSourceArchive = async () => {
    setDownloadingArchive(true);
    try {
      const response = await fetch('/api/export/source-archive');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chronicle-news-portal-${new Date().toISOString().split('T')[0]}.tar.gz`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Source archive download failed:', err);
    } finally {
      setDownloadingArchive(false);
    }
  };

  const sampleMarkdown = `---
title: "${articles[0]?.title || 'Silicon Monolith Breakthrough'}"
slug: "${articles[0]?.slug || 'silicon-monolith'}"
date: "${articles[0]?.publishedAt || new Date().toISOString()}"
category: "${articles[0]?.category || 'Technology'}"
author: "${articles[0]?.author.name || 'Julian Sterling'}"
readingTime: ${articles[0]?.readingTimeMinutes || 5}
imageUrl: "${articles[0]?.imageUrl || ''}"
imageCredit:
  photographer: "${articles[0]?.imageCredit?.photographer || 'Alexandre Debieve'}"
  source: "${articles[0]?.imageCredit?.source || 'Unsplash'}"
tags: ${JSON.stringify(articles[0]?.tags || ['Quantum', 'Tech'])}
---

${articles[0]?.content || 'Article markdown content...'}`;

  const copyStepText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(index);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const gitPushCommand = `git remote add origin ${userRepoUrl}
git branch -M main
git push -u origin main`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <Github className="w-5 h-5 text-stone-800" />
          <div>
            <h3 className="text-base font-bold font-editorial-serif text-stone-900">
              GitHub Sync & Cloudflare Deployment Suite
            </h3>
            <p className="text-xs text-stone-500 font-mono">
              Push all files to your GitHub repository or download a complete deployable archive
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadSourceArchive}
            disabled={downloadingArchive}
            className="px-3.5 py-2 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 rounded flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            title="Download clean tar.gz source code archive"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>{downloadingArchive ? 'Packing Archive...' : 'Download Full Code Archive (.tar.gz)'}</span>
          </button>
          <button
            onClick={handleDownloadBundle}
            disabled={downloadingBundle}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-stone-300 text-stone-800 hover:bg-stone-100 rounded flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>{downloadingBundle ? 'Compiling...' : 'Cloudflare Content JSON'}</span>
          </button>
        </div>
      </div>

      <div className="p-5 bg-stone-900 text-stone-100 rounded shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-400">
              Push This Codebase to Your GitHub Account
            </h4>
          </div>
          <span className="text-[11px] font-mono text-stone-400">Git branch main</span>
        </div>
        <p className="text-xs text-stone-300 leading-relaxed">
          Enter your GitHub repository URL below (create an empty repository on GitHub first):
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={userRepoUrl}
            onChange={(e) => setUserRepoUrl(e.target.value)}
            placeholder="https://github.com/your-username/your-repo-name.git"
            className="w-full sm:flex-1 px-3 py-2 text-xs font-mono bg-stone-950 border border-stone-700 text-white rounded focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => copyStepText(gitPushCommand, 99)}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            {copiedStep === 99 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedStep === 99 ? 'Copied Commands' : 'Copy Git Push Commands'}</span>
          </button>
        </div>
        <div className="p-3 bg-stone-950 rounded border border-stone-800 font-mono text-xs text-stone-300 overflow-x-auto space-y-1">
          <div className="text-stone-500"># Run these commands in your project terminal:</div>
          <div className="text-emerald-400">git remote add origin {userRepoUrl}</div>
          <div className="text-emerald-400">git branch -M main</div>
          <div className="text-emerald-400">git push -u origin main</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-white border border-stone-200 rounded shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-stone-900 text-xs font-mono font-bold uppercase border-b border-stone-100 pb-2">
            <Github className="w-4 h-4 text-stone-700" />
            <span>Option 1: Push via GitHub CLI / Terminal</span>
          </div>
          <ol className="space-y-2 text-xs text-stone-600 list-decimal list-inside leading-relaxed font-editorial-prose">
            <li>Create an empty new repository on your GitHub account.</li>
            <li>Copy the push commands above with your repository URL.</li>
            <li>Run them in the terminal or authenticated git client.</li>
            <li>All project files, styles, seed data, and server routes will sync instantly!</li>
          </ol>
        </div>

        <div className="p-5 bg-white border border-stone-200 rounded shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-stone-900 text-xs font-mono font-bold uppercase border-b border-stone-100 pb-2">
            <FolderArchive className="w-4 h-4 text-stone-700" />
            <span>Option 2: 1-Click Archive Download</span>
          </div>
          <ol className="space-y-2 text-xs text-stone-600 list-decimal list-inside leading-relaxed font-editorial-prose">
            <li>Click <strong>"Download Full Code Archive (.tar.gz)"</strong> at the top.</li>
            <li>Unpack the folder on your local computer.</li>
            <li>Upload directly to your GitHub repository.</li>
            <li>Connect the repository directly to Cloudflare Pages for instant zero-config deployments.</li>
          </ol>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
          <Cloud className="w-4 h-4 text-orange-600" />
          <h4 className="text-xs font-bold font-mono uppercase text-stone-900">
            Deploy to Cloudflare Pages & Connect Custom Domain
          </h4>
        </div>
        <div className="space-y-2.5">
          {[
            {
              step: '1. Connect GitHub Repository',
              desc: 'In Cloudflare Dashboard -> Workers & Pages -> Create Application -> Pages -> Connect to Git -> Select your repository.',
              cmd: 'Framework preset: Vite',
            },
            {
              step: '2. Configure Build Command',
              desc: 'Set the build parameters in Cloudflare Pages so it compiles the frontend dist bundle automatically on every commit.',
              cmd: 'Build command: npm run build | Output directory: dist',
            },
            {
              step: '3. Attach Your Own Custom Domain',
              desc: 'In Cloudflare Pages -> Custom Domains -> Add your domain.',
              cmd: 'Cloudflare automatically provisions free SSL/TLS and updates DNS CNAME.',
            },
          ].map((item, idx) => (
            <div key={idx} className="p-3 bg-stone-50 rounded border border-stone-200 text-xs space-y-1">
              <div className="font-bold text-stone-900 font-mono">{item.step}</div>
              <p className="text-stone-600">{item.desc}</p>
              <div className="p-1 bg-stone-200/60 rounded font-mono text-[11px] text-stone-800">
                {item.cmd}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-stone-700" />
            <h4 className="text-xs font-bold font-mono uppercase text-stone-900">
              Sample Markdown with Frontmatter (SSG / Hugo / Astro Ready)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-stone-400">content/articles/example.md</span>
        </div>
        <pre className="p-3 bg-stone-900 text-stone-100 rounded text-xs font-mono overflow-x-auto max-h-56">
          {sampleMarkdown}
        </pre>
      </div>
    </div>
  );
};
