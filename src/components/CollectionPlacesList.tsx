'use client';

import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Calendar,
  SortAsc,
  SortDesc,
  MapPin,
  Pencil,
} from 'lucide-react';
import { type PlaceWithCollection } from '@/app/actions/places';
import { type Collection } from '@/app/actions/collections';
import { isLegacyIconName, DEFAULT_EMOJI } from '@/lib/emojis';

type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a';

interface CollectionPlacesListProps {
  collection: Collection;
  places: PlaceWithCollection[];
  onBack: () => void;
  onPlaceClick: (placeId: string) => void;
  onEditCollection?: (collection: Collection) => void;
  selectedPlaceId?: string | null;
}

export default function CollectionPlacesList({
  collection,
  places,
  onBack,
  onPlaceClick,
  onEditCollection,
  selectedPlaceId,
}: CollectionPlacesListProps) {
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const collectionEmoji = isLegacyIconName(collection.icon) ? DEFAULT_EMOJI.emoji : collection.icon;

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

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
            data-testid="collection-back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Collection info */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ backgroundColor: collection.color }}
            >
              <span className="text-base leading-none">{collectionEmoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {collection.name}
              </h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {places.length} {places.length === 1 ? 'place' : 'places'}
              </span>
            </div>
          </div>

          {/* Edit button */}
          {onEditCollection && (
            <button
              onClick={() => onEditCollection(collection)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Edit collection"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
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
              <MapPin className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
              No places in this collection yet
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center mt-1">
              Paste a Google Maps link to add one
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {sortedPlaces.map((place) => {
              const isSelected = place.id === selectedPlaceId;

              return (
                <button
                  key={place.id}
                  onClick={() => onPlaceClick(place.id)}
                  data-testid="place-item"
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-900/20'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  {/* Pin indicator */}
                  <div
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: collection.color }}
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
        )}
      </div>
    </div>
  );
}
