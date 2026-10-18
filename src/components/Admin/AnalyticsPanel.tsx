import React from 'react';
import { BarChart3, ArrowUpRight } from 'lucide-react';
import { Article } from '../../types';

interface AnalyticsPanelProps {
  articles: Article[];
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ articles }) => {
  const totalViews = articles.reduce((acc, a) => acc + (a.viewsCount || 0), 0);
  const estimatedReaders = Math.round(totalViews * 0.72);
  const avgReadTime = (
    articles.reduce((acc, a) => acc + a.readingTimeMinutes, 0) /
    (articles.length || 1)
  ).toFixed(1);

  // Group views by category
  const categoryStats: Record<string, { count: number; views: number }> = {};
  articles.forEach((a) => {
    if (!categoryStats[a.category]) {
      categoryStats[a.category] = { count: 0, views: 0 };
    }
    categoryStats[a.category].count += 1;
    categoryStats[a.category].views += a.viewsCount || 0;
  });

  const sortedCategories = Object.entries(categoryStats).sort(
    (a, b) => b[1].views - a[1].views
  );

  const topArticles = [...articles]
    .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
    .slice(0, 5);

  const maxCatViews = Math.max(...sortedCategories.map((c) => c[1].views), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-stone-200">
        <BarChart3 className="w-5 h-5 text-stone-800" />
        <div>
          <h3 className="text-base font-bold font-editorial-serif text-stone-900">
            Real-Time Readership & Audience Analytics
          </h3>
          <p className="text-xs text-stone-500 font-mono">
            Audience telemetry, category traction, and engagement depth
          </p>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-stone-200 rounded shadow-xs">
          <div className="text-xs font-mono text-stone-500 uppercase mb-1">Total Page Views</div>
          <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
            {totalViews.toLocaleString()}
          </div>
          <div className="text-[11px] text-green-700 font-mono mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />
            <span>+14.8% vs last week</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-stone-200 rounded shadow-xs">
          <div className="text-xs font-mono text-stone-500 uppercase mb-1">Unique Readers</div>
          <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
            {estimatedReaders.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-400 font-mono mt-1">
            Global audience reach
          </div>
        </div>

        <div className="p-4 bg-white border border-stone-200 rounded shadow-xs">
          <div className="text-xs font-mono text-stone-500 uppercase mb-1">Avg Dwell Time</div>
          <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
            {avgReadTime} min
          </div>
          <div className="text-[11px] text-green-700 font-mono mt-1">
            Deep investigative engagement
          </div>
        </div>

        <div className="p-4 bg-white border border-stone-200 rounded shadow-xs">
          <div className="text-xs font-mono text-stone-500 uppercase mb-1">Bounce Rate</div>
          <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
            28.4%
          </div>
          <div className="text-[11px] text-stone-400 font-mono mt-1">
            Industry standard: 45%
          </div>
        </div>
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h4 className="text-xs font-bold font-mono uppercase text-stone-800">
              Readership Volume by Department
            </h4>
            <span className="text-[11px] font-mono text-stone-400">Total Views</span>
          </div>

          <div className="space-y-3">
            {sortedCategories.map(([category, stats]) => {
              const percentage = Math.round((stats.views / maxCatViews) * 100);
              return (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-stone-800">{category}</span>
                    <span className="text-stone-500 tabular-nums">
                      {stats.views.toLocaleString()} views ({stats.count} articles)
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-stone-900 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-stone-200 rounded p-5 shadow-xs space-y-4">
          <div className="border-b border-stone-100 pb-2">
            <h4 className="text-xs font-bold font-mono uppercase text-stone-800">
              Traffic Acquisition Channels
            </h4>
            <p className="text-[11px] text-stone-400 mt-0.5">AdSense & organic search attribution</p>
          </div>

          <div className="space-y-3 text-xs font-mono">
            {[
              { channel: 'Organic Search (Google News / Discover)', share: 54, color: 'bg-stone-900' },
              { channel: 'Direct & Bookmarks', share: 26, color: 'bg-stone-700' },
              { channel: 'Social Referral (X, LinkedIn)', share: 14, color: 'bg-stone-500' },
              { channel: 'Syndicated RSS & Newsletters', share: 6, color: 'bg-stone-400' },
            ].map((src) => (
              <div key={src.channel} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-700">{src.channel}</span>
                  <span className="font-bold text-stone-900">{src.share}%</span>
                </div>
                <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                  <div className={`${src.color} h-full`} style={{ width: `${src.share}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-stone-50 rounded text-[11px] text-stone-500 font-mono leading-relaxed mt-4">
            Organic search health score: <strong>96/100</strong>. Google News sitemap and NewsArticle Schema JSON-LD are fully indexed and operational.
          </div>
        </div>
      </div>

      {/* Top 5 Trending Stories */}
      <div className="bg-white border border-stone-200 rounded p-5 shadow-xs">
        <h4 className="text-xs font-bold font-mono uppercase text-stone-800 mb-3 border-b border-stone-100 pb-2">
          Top Performing Dispatches
        </h4>
        <div className="divide-y divide-stone-100">
          {topArticles.map((art, idx) => (
            <div
              key={art.id}
              className="py-2.5 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-stone-400 font-bold w-4 text-center">
                  0{idx + 1}
                </span>
                <div>
                  <div className="font-bold font-editorial-serif text-stone-900 text-sm">
                    {art.title}
                  </div>
                  <div className="text-[11px] font-mono text-stone-400">
                    {art.category} • by {art.author.name}
                  </div>
                </div>
              </div>
              <div className="text-right font-mono text-stone-600">
                <div className="tabular-nums font-bold text-stone-900">
                  {art.viewsCount.toLocaleString()} views
                </div>
                <div className="text-[10px] text-stone-400">{art.readingTimeMinutes} min read</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
