'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Calendar,
  SortAsc,
  SortDesc,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { type PlaceWithCollection, restorePlace, permanentlyDeletePlace } from '@/app/actions/places';
import { isLegacyIconName, DEFAULT_EMOJI } from '@/lib/emojis';

type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a';

interface TrashPlacesListProps {
  places: PlaceWithCollection[];
  onBack: () => void;
  onPlacesChanged: () => void;
}

export default function TrashPlacesList({
  places,
  onBack,
  onPlacesChanged,
}: TrashPlacesListProps) {
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Sort places based on selected option
  const sortedPlaces = useMemo(() => {
    const sorted = [...places];
    switch (sortOption) {
      case 'newest':
        sorted.sort(
          (a, b) =>
            new Date(b.deleted_at || b.created_at).getTime() -
            new Date(a.deleted_at || a.created_at).getTime()
        );
        break;
      case 'oldest':
        sorted.sort(
          (a, b) =>
            new Date(a.deleted_at || a.created_at).getTime() -
            new Date(b.deleted_at || b.created_at).getTime()
        );
        break;
      case 'a-z':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'z-a':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }
    return sorted;
  }, [places, sortOption]);

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'newest':
        return 'Newest';
      case 'oldest':
        return 'Oldest';
      case 'a-z':
        return 'A-Z';
      case 'z-a':
        return 'Z-A';
    }
  };

  const getSortIcon = (option: SortOption) => {
    switch (option) {
      case 'newest':
      case 'oldest':
        return Calendar;
      case 'a-z':
        return SortAsc;
      case 'z-a':
        return SortDesc;
    }
  };

  const SortIcon = getSortIcon(sortOption);

  // Calculate days until permanent deletion (30 days from deleted_at)
  const getDaysRemaining = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffMs = deleted.getTime() + 30 * 24 * 60 * 60 * 1000 - now.getTime();
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return Math.max(0, diffDays);
  };

  // Handle restore
  const handleRestore = useCallback(
    async (placeId: string) => {
      setActionInProgress(placeId);
      const result = await restorePlace(placeId);
      if (result.success) {
        onPlacesChanged();
      }
      setActionInProgress(null);
    },
    [onPlacesChanged]
  );

  // Handle permanent delete
  const handlePermanentDelete = useCallback(
    async (placeId: string) => {
      setActionInProgress(placeId);
      const result = await permanentlyDeletePlace(placeId);
      if (result.success) {
        onPlacesChanged();
      }
      setActionInProgress(null);
      setConfirmDelete(null);
    },
    [onPlacesChanged]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-zinc-200 dark:border-zinc-800">
        {/* Back button and title row */}
        <div className="flex items-center gap-2 px-3 py-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Back to collections"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Trash info */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm bg-zinc-400 dark:bg-zinc-600">
              <Trash2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                Trash
              </h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {places.length} {places.length === 1 ? 'place' : 'places'}
              </span>
            </div>
          </div>
        </div>

        {/* Sort bar */}
        {places.length > 1 && (
          <div className="flex items-center justify-end px-3 pb-2">
            <div className="relative">
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <SortIcon className="w-3 h-3" />
                <span>{getSortLabel(sortOption)}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isSortDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSortDropdownOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-1 w-28 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1 z-50">
                    {(['newest', 'oldest', 'a-z', 'z-a'] as SortOption[]).map((option) => {
                      const OptionIcon = getSortIcon(option);
                      const isSelected = sortOption === option;
                      return (
                        <button
                          key={option}
                          onClick={() => {
                            setSortOption(option);
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                            isSelected
                              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <OptionIcon className="w-3 h-3" />
                          <span>{getSortLabel(option)}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Places list */}
      <div className="flex-1 overflow-y-auto">
        {places.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
              Trash is empty
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center mt-1">
              Deleted places will appear here for 30 days
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 px-2 pb-1">
              Items are automatically removed after 30 days.
            </p>

            {sortedPlaces.map((place) => {
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
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3"
                >
                  <div className="flex items-start gap-3">
                    {/* Collection indicator */}
                    {place.collection && (
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border border-zinc-200 dark:border-zinc-700"
                      >
                        {collectionEmoji && (
                          <span className="text-sm leading-none">{collectionEmoji}</span>
                        )}
                      </div>
                    )}

                    {/* Place info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {place.name}
                      </h3>
                      {place.address && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {place.address}
                        </p>
                      )}
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                        {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
                      </p>
                    </div>

                    {/* Actions */}
                    {!isConfirmingDelete && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleRestore(place.id)}
                          disabled={isInProgress}
                          className="p-1.5 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                          title="Restore"
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(place.id)}
                          disabled={isInProgress}
                          className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                          title="Delete permanently"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Confirm permanent delete */}
                  {isConfirmingDelete && (
                    <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <div className="flex items-start gap-2">
                        <AlertTriangle
                          size={16}
                          className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                        />
                        <div className="flex-1">
                          <p className="text-xs text-red-700 dark:text-red-300">
                            Delete permanently? This cannot be undone.
                          </p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handlePermanentDelete(place.id)}
                              disabled={isInProgress}
                              className="px-2 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {isInProgress ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-2 py-1 rounded-md bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors"
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
      </div>
    </div>
  );
}
