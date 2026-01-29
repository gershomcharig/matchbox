'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  MapPin,
  ChevronDown,
  ArrowUpDown,
  Calendar,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { type PlaceWithCollection } from '@/app/actions/places';
import { type Collection } from '@/app/actions/collections';
import { isLegacyIconName, DEFAULT_EMOJI } from '@/lib/emojis';

type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a';

interface ListViewProps {
  /** Places to display */
  places: PlaceWithCollection[];
  /** Collections for grouping headers */
  collections: Collection[];
  /** Callback when a place is clicked */
  onPlaceClick: (placeId: string) => void;
  /** Currently selected place ID (for highlighting) */
  selectedPlaceId?: string | null;
  /** Whether filters are active (for better empty state messages) */
  hasActiveFilters?: boolean;
  /** Total number of places before filtering */
  totalPlacesCount?: number;
}

export default function ListView({
  places,
  collections,
  onPlaceClick,
  selectedPlaceId,
  hasActiveFilters = false,
  totalPlacesCount = 0,
}: ListViewProps) {
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Sort places based on selected option
  const sortedPlaces = useMemo(() => {
    const sorted = [...places];
    switch (sortOption) {
      case 'newest':
        sorted.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'oldest':
        sorted.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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

  // Group places by collection
  const groupedPlaces = useMemo(() => {
    const groups: Map<string, PlaceWithCollection[]> = new Map();

    // Initialize groups for all collections that have places
    sortedPlaces.forEach((place) => {
      const collectionId = place.collection?.id || 'uncategorized';
      if (!groups.has(collectionId)) {
        groups.set(collectionId, []);
      }
      groups.get(collectionId)!.push(place);
    });

    // Sort collection groups: first by having places, then by name
    const sortedGroups = Array.from(groups.entries()).sort(([aId], [bId]) => {
      if (aId === 'uncategorized') return 1;
      if (bId === 'uncategorized') return -1;
      const aCollection = collections.find((c) => c.id === aId);
      const bCollection = collections.find((c) => c.id === bId);
      return (aCollection?.name || '').localeCompare(bCollection?.name || '');
    });

    return sortedGroups;
  }, [sortedPlaces, collections]);

  // Get sort option label
  const getSortLabel = useCallback((option: SortOption) => {
    switch (option) {
      case 'newest':
        return 'Newest first';
      case 'oldest':
        return 'Oldest first';
      case 'a-z':
        return 'A to Z';
      case 'z-a':
        return 'Z to A';
    }
  }, []);

  // Get sort option icon
  const getSortIcon = useCallback((option: SortOption) => {
    switch (option) {
      case 'newest':
      case 'oldest':
        return Calendar;
      case 'a-z':
        return SortAsc;
      case 'z-a':
        return SortDesc;
    }
  }, []);

  const SortIcon = getSortIcon(sortOption);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  if (places.length === 0) {
    // Different messages for "no results from filter" vs "no places at all"
    const isFilteredEmpty = hasActiveFilters && totalPlacesCount > 0;

    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-xs">
          <MapPin size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
          {isFilteredEmpty ? (
            <>
              <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">No matching places</p>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">
                No places match your current filters. Try adjusting your search or clearing filters to see all {totalPlacesCount} place{totalPlacesCount !== 1 ? 's' : ''}.
              </p>
            </>
          ) : (
            <>
              <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">No places yet</p>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">
                Paste a Google Maps link or add a place manually to get started.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Sort bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {places.length} {places.length === 1 ? 'place' : 'places'}
        </span>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <SortIcon size={14} />
            <span>{getSortLabel(sortOption)}</span>
            <ChevronDown
              size={14}
              className={`transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isSortDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsSortDropdownOpen(false)}
              />
              {/* Menu */}
              <div className="absolute top-full right-0 mt-1 w-40 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1 z-50">
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
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <OptionIcon size={14} />
                      <span>{getSortLabel(option)}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grouped list */}
      <div className="flex-1 overflow-y-auto">
        {groupedPlaces.map(([collectionId, collectionPlaces]) => {
          const collection =
            collectionId === 'uncategorized'
              ? null
              : collections.find((c) => c.id === collectionId);
          const collectionEmoji = collection
            ? isLegacyIconName(collection.icon)
              ? DEFAULT_EMOJI.emoji
              : collection.icon
            : null;

          return (
            <div key={collectionId} className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0">
              {/* Collection header */}
              <div
                className="sticky top-0 flex items-center gap-3 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800"
                style={collection ? { borderLeftColor: collection.color, borderLeftWidth: '4px' } : {}}
              >
                {collection ? (
                  <>
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: collection.color }}
                    >
                      {collectionEmoji && <span className="text-sm leading-none">{collectionEmoji}</span>}
                    </div>
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                      {collection.name}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-md bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                      <MapPin size={14} className="text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <span className="font-medium text-sm text-zinc-600 dark:text-zinc-400">
                      Uncategorized
                    </span>
                  </>
                )}
                <span className="text-xs text-zinc-500 dark:text-zinc-500 ml-auto">
                  {collectionPlaces.length}
                </span>
              </div>

              {/* Places in this collection */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {collectionPlaces.map((place) => {
                  const isSelected = place.id === selectedPlaceId;

                  return (
                    <button
                      key={place.id}
                      onClick={() => onPlaceClick(place.id)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-900/20'
                          : 'bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      {/* Pin indicator with collection color */}
                      <div
                        className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: collection?.color || '#9ca3af' }}
                      />

                      {/* Place info */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium text-sm truncate ${
                            isSelected
                              ? 'text-amber-900 dark:text-amber-100'
                              : 'text-zinc-900 dark:text-zinc-100'
                          }`}
                        >
                          {place.name}
                        </h3>
                        {place.address && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            {place.address}
                          </p>
                        )}
                      </div>

                      {/* Date */}
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0 mt-0.5">
                        {formatDate(place.created_at)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
