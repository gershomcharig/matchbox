'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import {
  getDeletedPlaces,
  restorePlace,
  permanentlyDeletePlace,
  type PlaceWithCollection,
} from '@/app/actions/places';
import { isLegacyIconName, DEFAULT_EMOJI } from '@/lib/emojis';

export default function TrashPage() {
  const router = useRouter();
  const [deletedPlaces, setDeletedPlaces] = useState<PlaceWithCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Fetch deleted places
  const fetchDeletedPlaces = useCallback(async () => {
    const result = await getDeletedPlaces();
    if (result.success && result.places) {
      setDeletedPlaces(result.places);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDeletedPlaces();
  }, [fetchDeletedPlaces]);

  // Handle restore
  const handleRestore = useCallback(
    async (placeId: string) => {
      setActionInProgress(placeId);
      const result = await restorePlace(placeId);
      if (result.success) {
        await fetchDeletedPlaces();
      }
      setActionInProgress(null);
    },
    [fetchDeletedPlaces]
  );

  // Handle permanent delete
  const handlePermanentDelete = useCallback(
    async (placeId: string) => {
      setActionInProgress(placeId);
      const result = await permanentlyDeletePlace(placeId);
      if (result.success) {
        await fetchDeletedPlaces();
      }
      setActionInProgress(null);
      setConfirmDelete(null);
    },
    [fetchDeletedPlaces]
  );

  // Calculate days until permanent deletion (30 days from deleted_at)
  const getDaysRemaining = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffMs = deleted.getTime() + 30 * 24 * 60 * 60 * 1000 - now.getTime();
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return Math.max(0, diffDays);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 -ml-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Trash2 size={20} className="text-zinc-400" />
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Trash
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : deletedPlaces.length === 0 ? (
          <div className="text-center py-12">
            <Trash2 size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              Trash is empty
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Deleted places will appear here for 30 days before being permanently removed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              {deletedPlaces.length} deleted place{deletedPlaces.length !== 1 ? 's' : ''}.
              Items are automatically removed after 30 days.
            </p>

            {deletedPlaces.map((place) => {
              const collectionEmoji = place.collection
                ? isLegacyIconName(place.collection.icon)
                  ? DEFAULT_EMOJI.emoji
                  : place.collection.icon
                : null;
              const daysRemaining = place.deleted_at
                ? getDaysRemaining(place.deleted_at)
                : 30;
              const isInProgress = actionInProgress === place.id;
              const isConfirmingDelete = confirmDelete === place.id;

              return (
                <div
                  key={place.id}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
                >
                  <div className="flex items-start gap-3">
                    {/* Collection indicator */}
                    {place.collection && (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: place.collection.color }}
                      >
                        {collectionEmoji && (
                          <span className="text-base leading-none">{collectionEmoji}</span>
                        )}
                      </div>
                    )}

                    {/* Place info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {place.name}
                      </h3>
                      {place.address && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                          {place.address}
                        </p>
                      )}
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                        {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} until permanent deletion
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isConfirmingDelete && (
                        <>
                          <button
                            onClick={() => handleRestore(place.id)}
                            disabled={isInProgress}
                            className="p-2 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                            title="Restore"
                          >
                            <RotateCcw size={18} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(place.id)}
                            disabled={isInProgress}
                            className="p-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                            title="Delete permanently"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Confirm permanent delete */}
                  {isConfirmingDelete && (
                    <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <div className="flex items-start gap-2">
                        <AlertTriangle
                          size={18}
                          className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-red-700 dark:text-red-300">
                            Permanently delete this place? This cannot be undone.
                          </p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handlePermanentDelete(place.id)}
                              disabled={isInProgress}
                              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              {isInProgress ? 'Deleting...' : 'Delete Forever'}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
