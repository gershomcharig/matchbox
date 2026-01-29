'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, ExternalLink, ChevronDown, Check } from 'lucide-react';
import Modal from './Modal';
import { getCollections, type Collection } from '@/app/actions/collections';
import { isLegacyIconName, DEFAULT_EMOJI } from '@/lib/emojis';

/**
 * Extracted place data from Google Maps URL
 */
export interface ExtractedPlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
  googleMapsUrl: string;
  urlExtractedName?: string | null;
  geocodedName?: string;
  displayName?: string;
  placeType?: string | null;
  city?: string | null;
  country?: string | null;
  // Additional API data
  types?: string[];
  website?: string;
  phone?: string;
  rating?: number;
  userRatingsTotal?: number;
  openingHours?: string[];
}

interface AddPlaceModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Extracted place data to display */
  place: ExtractedPlace | null;
  /** Callback when place is saved */
  onSave: (data: { place: ExtractedPlace; collectionId: string }) => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
}

export default function AddPlaceModal({
  isOpen,
  onClose,
  place,
  onSave,
  isSubmitting = false,
}: AddPlaceModalProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);

  // Fetch collections when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoadingCollections(true);
      getCollections().then((result) => {
        if (result.success && result.collections) {
          setCollections(result.collections);
          // Select the first collection by default
          if (result.collections.length > 0 && !selectedCollectionId) {
            setSelectedCollectionId(result.collections[0].id);
          }
        }
        setIsLoadingCollections(false);
      });
    }
  }, [isOpen, selectedCollectionId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!place || !selectedCollectionId || isSubmitting) return;

    onSave({
      place,
      collectionId: selectedCollectionId,
    });
  };

  const handleClose = () => {
    setIsDropdownOpen(false);
    onClose();
  };

  // Get selected collection details
  const selectedCollection = collections.find((c) => c.id === selectedCollectionId);

  // Get emoji for collection (handle legacy icon names)
  const getCollectionEmoji = (iconName: string) => {
    return isLegacyIconName(iconName) ? DEFAULT_EMOJI.emoji : iconName;
  };


  if (!place) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Place" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Place Info Card */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl p-5 border border-amber-200/50 dark:border-amber-800/30">
          {/* Place name */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {place.name}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2">
                {place.address}
              </p>
            </div>
          </div>

          {/* Quick actions row */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-amber-200/50 dark:border-amber-800/30">
            {/* Coordinates badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/60 dark:bg-zinc-900/40 text-xs text-zinc-600 dark:text-zinc-400">
              <Navigation className="w-3 h-3" />
              <span className="font-mono">
                {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
              </span>
            </div>

            {/* Google Maps link */}
            <a
              href={place.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/60 dark:bg-zinc-900/40 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>View on Maps</span>
            </a>
          </div>
        </div>

        {/* Collection Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Add to Collection
          </label>

          {isLoadingCollections ? (
            <div className="w-full py-3 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 text-sm">
              Loading collections...
            </div>
          ) : collections.length === 0 ? (
            <div className="w-full py-3 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 text-sm">
              No collections yet. A default collection will be created.
            </div>
          ) : (
            <div className="relative">
              {/* Dropdown button */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
              >
                {selectedCollection ? (
                  <div className="flex items-center gap-3">
                    {/* Collection color/emoji badge */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-zinc-200 dark:border-zinc-700"
                    >
                      <span className="text-base leading-none">{getCollectionEmoji(selectedCollection.icon)}</span>
                    </div>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {selectedCollection.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-500">Select a collection</span>
                )}
                <ChevronDown
                  className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 py-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl shadow-zinc-900/10 dark:shadow-zinc-950/50 max-h-48 overflow-y-auto">
                  {collections.map((collection) => {
                    const emoji = getCollectionEmoji(collection.icon);
                    const isSelected = collection.id === selectedCollectionId;

                    return (
                      <button
                        key={collection.id}
                        type="button"
                        onClick={() => {
                          setSelectedCollectionId(collection.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                          isSelected ? 'bg-amber-50 dark:bg-amber-950/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-zinc-200 dark:border-zinc-700"
                          >
                            <span className="text-base leading-none">{emoji}</span>
                          </div>
                          <span
                            className={`font-medium ${
                              isSelected
                                ? 'text-amber-700 dark:text-amber-300'
                                : 'text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {collection.name}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-amber-500" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selectedCollectionId || isSubmitting || isLoadingCollections}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
          >
            {isSubmitting ? 'Adding...' : 'Add Place'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
