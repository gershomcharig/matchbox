'use client';

import { useEffect, useState } from 'react';
import { Folder, Plus, Pencil } from 'lucide-react';
import { getCollections, getCollectionPlaceCounts, type Collection } from '@/app/actions/collections';
import { isLegacyIconName, DEFAULT_EMOJI } from '@/lib/emojis';

interface CollectionsListProps {
  /** Callback when "New Collection" is clicked */
  onNewCollection?: () => void;
  /** Callback when a collection is clicked */
  onSelectCollection?: (collection: Collection) => void;
  /** Callback when edit button is clicked */
  onEditCollection?: (collection: Collection) => void;
  /** Currently selected collection ID */
  selectedId?: string;
  /** Trigger refresh when this value changes */
  refreshTrigger?: number;
}

export default function CollectionsList({
  onNewCollection,
  onSelectCollection,
  onEditCollection,
  selectedId,
  refreshTrigger,
}: CollectionsListProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [placeCounts, setPlaceCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      // Fetch collections and place counts in parallel
      const [collectionsResult, countsResult] = await Promise.all([
        getCollections(),
        getCollectionPlaceCounts(),
      ]);

      if (collectionsResult.success && collectionsResult.collections) {
        setCollections(collectionsResult.collections);
      } else {
        setError(collectionsResult.error || 'Failed to load collections');
      }

      if (countsResult.success && countsResult.counts) {
        setPlaceCounts(countsResult.counts);
      }

      setIsLoading(false);
    }

    fetchData();
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
          Collections
        </h2>
        {onNewCollection && (
          <button
            onClick={onNewCollection}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="New Collection"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collections list */}
      {collections.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-3">
            <Folder className="w-6 h-6 text-zinc-400" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No collections yet
          </p>
          {onNewCollection && (
            <button
              onClick={onNewCollection}
              className="mt-3 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              Create your first collection
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {collections.map((collection) => {
            const displayEmoji = isLegacyIconName(collection.icon) ? DEFAULT_EMOJI.emoji : collection.icon;
            const isSelected = selectedId === collection.id;
            const count = placeCounts[collection.id] || 0;

            return (
              <div
                key={collection.id}
                data-testid="collection-item"
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                  ${
                    isSelected
                      ? 'bg-zinc-100 dark:bg-zinc-800'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }
                `}
              >
                {/* Main clickable area */}
                <button
                  onClick={() => onSelectCollection?.(collection)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  {/* Color swatch with emoji */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm bg-white border border-zinc-200 dark:border-zinc-700"
                  >
                    <span className="text-base leading-none">{displayEmoji}</span>
                  </div>

                  {/* Name and count */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={`
                        text-sm font-medium truncate block
                        ${
                          isSelected
                            ? 'text-zinc-900 dark:text-zinc-100'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }
                      `}
                    >
                      {collection.name}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {count} {count === 1 ? 'place' : 'places'}
                    </span>
                  </div>
                </button>

                {/* Action buttons (visible on hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Edit button */}
                  {onEditCollection && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCollection(collection);
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      title="Edit collection"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
