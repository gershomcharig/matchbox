'use client';

import { useEffect, useState } from 'react';
import { Folder, Plus, Pencil, Focus, Trash2 } from 'lucide-react';
import { getCollections, getCollectionPlaceCounts, type Collection } from '@/app/actions/collections';
import { getDeletedPlaces } from '@/app/actions/places';
import { findIconByName } from '@/lib/icons';

interface CollectionsListProps {
  /** Callback when "New Collection" is clicked */
  onNewCollection?: () => void;
  /** Callback when a collection is clicked */
  onSelectCollection?: (collection: Collection) => void;
  /** Callback when edit button is clicked */
  onEditCollection?: (collection: Collection) => void;
  /** Callback when focus button is clicked */
  onFocusCollection?: (collection: Collection) => void;
  /** Callback when Trash is clicked */
  onSelectTrash?: () => void;
  /** Currently selected collection ID */
  selectedId?: string;
  /** Trigger refresh when this value changes */
  refreshTrigger?: number;
}

export default function CollectionsList({
  onNewCollection,
  onSelectCollection,
  onEditCollection,
  onFocusCollection,
  onSelectTrash,
  selectedId,
  refreshTrigger,
}: CollectionsListProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [placeCounts, setPlaceCounts] = useState<Record<string, number>>({});
  const [trashCount, setTrashCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      // Fetch collections, place counts, and trash count in parallel
      const [collectionsResult, countsResult, trashResult] = await Promise.all([
        getCollections(),
        getCollectionPlaceCounts(),
        getDeletedPlaces(),
      ]);

      if (collectionsResult.success && collectionsResult.collections) {
        setCollections(collectionsResult.collections);
      } else {
        setError(collectionsResult.error || 'Failed to load collections');
      }

      if (countsResult.success && countsResult.counts) {
        setPlaceCounts(countsResult.counts);
      }

      if (trashResult.success && trashResult.places) {
        setTrashCount(trashResult.places.length);
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
            const iconData = findIconByName(collection.icon);
            const Icon = iconData?.icon || Folder;
            const isSelected = selectedId === collection.id;
            const count = placeCounts[collection.id] || 0;

            return (
              <div
                key={collection.id}
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
                  {/* Color swatch with icon */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: collection.color }}
                  >
                    <Icon className="w-4 h-4 text-white" />
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
                  {/* Focus on map button */}
                  {count > 0 && onFocusCollection && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFocusCollection(collection);
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      title="Show on map"
                    >
                      <Focus className="w-3.5 h-3.5" />
                    </button>
                  )}

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

      {/* Trash section */}
      {onSelectTrash && (
        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={onSelectTrash}
            className="w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            {/* Trash icon */}
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm bg-zinc-400 dark:bg-zinc-600">
              <Trash2 className="w-4 h-4 text-white" />
            </div>

            {/* Name and count */}
            <div className="flex-1 min-w-0 text-left">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate block">
                Trash
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {trashCount} {trashCount === 1 ? 'place' : 'places'}
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
