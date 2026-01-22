'use client';

import { Map, List } from 'lucide-react';

export type ViewMode = 'map' | 'list';

interface ViewToggleProps {
  /** Current view mode */
  viewMode: ViewMode;
  /** Callback when view mode changes */
  onViewModeChange: (mode: ViewMode) => void;
}

export default function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex rounded-xl overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 shadow-lg shadow-zinc-900/5 dark:shadow-zinc-950/50">
      <button
        onClick={() => onViewModeChange('map')}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
          viewMode === 'map'
            ? 'bg-amber-500 text-white'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
        aria-label="Map view"
      >
        <Map size={16} />
        <span className="hidden sm:inline">Map</span>
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
          viewMode === 'list'
            ? 'bg-amber-500 text-white'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
        aria-label="List view"
      >
        <List size={16} />
        <span className="hidden sm:inline">List</span>
      </button>
    </div>
  );
}
