import React from 'react';
import { ExternalLink } from 'lucide-react';
import { AdSenseConfig } from '../types';

interface AdSenseUnitProps {
  slot: 'leaderboard' | 'in-article' | 'sidebar' | 'sticky-footer';
  config: AdSenseConfig;
}

export const AdSenseUnit: React.FC<AdSenseUnitProps> = ({ slot, config }) => {
  if (!config.enabled) return null;

  // Check individual slot toggles
  if (slot === 'leaderboard' && !config.topBannerActive) return null;
  if (slot === 'in-article' && !config.inArticleActive) return null;
  if (slot === 'sidebar' && !config.sidebarActive) return null;
  if (slot === 'sticky-footer' && !config.stickyFooterActive) return null;

  const publisherId = config.publisherId || 'ca-pub-0000000000000000';

  if (slot === 'leaderboard') {
    return (
      <div className="w-full my-6 flex flex-col items-center justify-center">
        <div className="text-[10px] uppercase font-mono tracking-widest text-stone-400 mb-1">
          ADVERTISEMENT
        </div>
        <div className="w-full max-w-[728px] h-[90px] bg-stone-100 border border-dashed border-stone-300 rounded flex flex-col items-center justify-center p-3 text-stone-500 text-xs">
          <div className="font-semibold text-stone-700 flex items-center gap-1.5">
            <span>Google AdSense Leaderboard Slot</span>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Responsive Unit • Publisher: {publisherId}
          </p>
        </div>
      </div>
    );
  }

  if (slot === 'in-article') {
    return (
      <div className="my-8 py-3 px-4 bg-stone-50/80 border-y border-stone-200">
        <div className="text-[10px] uppercase font-mono tracking-widest text-stone-400 text-center mb-2">
          ADVERTISEMENT
        </div>
        <div className="max-w-md mx-auto min-h-[140px] bg-white border border-stone-200 rounded p-4 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="text-xs font-semibold text-stone-800">
            AdSense In-Article Content Placement
          </div>
          <p className="text-[11px] text-stone-500 mt-1 max-w-xs">
            Optimized for editorial flow with strict spacing to eliminate accidental clicks.
          </p>
          <span className="text-[10px] text-stone-400 mt-2 font-mono">
            Compliant with AdSense Content Policies
          </span>
        </div>
      </div>
    );
  }

  if (slot === 'sidebar') {
    return (
      <div className="my-6">
        <div className="text-[10px] uppercase font-mono tracking-widest text-stone-400 mb-1.5">
          ADVERTISEMENT
        </div>
        <div className="w-[300px] h-[250px] sm:h-[600px] bg-stone-50 border border-stone-200 rounded p-4 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-medium text-stone-700">AdSense Half-Page Unit</span>
          <p className="text-[11px] text-stone-400 mt-2">
            300 × 600 Sticky Sidebar Placement
          </p>
        </div>
      </div>
    );
  }

  if (slot === 'sticky-footer') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-stone-900/95 backdrop-blur-sm text-white px-4 py-2 border-t border-stone-700 shadow-xl flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase bg-stone-800 px-1.5 py-0.5 rounded text-stone-300">
              AD
            </span>
            <span className="text-stone-300 text-[11px] hidden sm:inline">
              Support independent broadsheet reporting via our verified sponsors.
            </span>
          </div>
          <span className="text-stone-400 font-mono text-[10px]">
            Publisher: {publisherId.slice(0, 14)}...
          </span>
        </div>
      </div>
    );
  }

  return null;
};
