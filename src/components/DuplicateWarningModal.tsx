'use client';

import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import { type PlaceWithCollection } from '@/app/actions/places';
import { isLegacyIconName, DEFAULT_EMOJI } from '@/lib/emojis';

interface DuplicateWarningModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** The name of the place being added */
  newPlaceName: string;
  /** The existing place that was found */
  existingPlace: PlaceWithCollection | null;
  /** How the duplicate was detected */
  matchType: 'coordinates' | 'url' | null;
  /** Callback when user chooses to add anyway */
  onAddAnyway: () => void;
  /** Whether the add action is in progress */
  isSubmitting?: boolean;
}

export default function DuplicateWarningModal({
  isOpen,
  onClose,
  newPlaceName,
  existingPlace,
  matchType,
  onAddAnyway,
  isSubmitting = false,
}: DuplicateWarningModalProps) {
  const getCollectionEmoji = (iconName: string) => {
    return isLegacyIconName(iconName) ? DEFAULT_EMOJI.emoji : iconName;
  };

  const matchDescription =
    matchType === 'url'
      ? 'This Google Maps link has already been saved'
      : 'A place at this location already exists';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Possible Duplicate" maxWidth="max-w-md">
      <div className="space-y-5">
        {/* Warning icon and message */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-zinc-700 dark:text-zinc-300">{matchDescription}</p>
        </div>

        {/* Existing place card */}
        {existingPlace && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-start gap-3">
              {/* Collection emoji */}
              {existingPlace.collection && (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border border-zinc-200 dark:border-zinc-700"
                >
                  <span className="text-lg leading-none">{getCollectionEmoji(existingPlace.collection.icon)}</span>
                </div>
              )}

              {/* Place info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {existingPlace.name}
                </h4>
                {existingPlace.address && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2">
                    {existingPlace.address}
                  </p>
                )}
                {existingPlace.collection && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    In collection: <span className="font-medium">{existingPlace.collection.name}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* New place name */}
        <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          You&apos;re trying to add: <span className="font-medium text-zinc-900 dark:text-zinc-100">{newPlaceName}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onAddAnyway}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
          >
            {isSubmitting ? 'Adding...' : 'Add Anyway'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
