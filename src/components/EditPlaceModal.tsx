'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import Modal from './Modal';
import {
  type PlaceWithCollection,
  updatePlace,
} from '@/app/actions/places';
import { getCollections, type Collection } from '@/app/actions/collections';
import { isLegacyIconName, DEFAULT_EMOJI } from '@/lib/emojis';

interface EditPlaceModalProps {
  /** The place being edited */
  place: PlaceWithCollection | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when place is updated */
  onSave: () => void;
}

export default function EditPlaceModal({
  place,
  isOpen,
  onClose,
  onSave,
}: EditPlaceModalProps) {
  const [name, setName] = useState('');
  const [collectionId, setCollectionId] = useState<string>('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isCollectionDropdownOpen, setIsCollectionDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load place data when modal opens
  useEffect(() => {
    if (isOpen && place) {
      setName(place.name);
      setCollectionId(place.collection_id);
      setError(null);

      // Load collections for dropdown
      getCollections().then((result) => {
        if (result.success && result.collections) {
          setCollections(result.collections);
        }
      });
    }
  }, [isOpen, place]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!place) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Update place
      const updateResult = await updatePlace({
        id: place.id,
        name,
        collectionId,
      });

      if (!updateResult.success) {
        setError(updateResult.error || 'Failed to update place');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving place:', err);
      setError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  }, [place, name, collectionId, onSave, onClose]);

  // Get selected collection
  const selectedCollection = collections.find((c) => c.id === collectionId);
  const selectedEmoji = selectedCollection
    ? isLegacyIconName(selectedCollection.icon)
      ? DEFAULT_EMOJI.emoji
      : selectedCollection.icon
    : null;

  if (!place) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Place" maxWidth="max-w-lg" testId="edit-place-modal">
      <div className="space-y-5">
        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Name input */}
        <div>
          <label
            htmlFor="edit-name"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
          >
            Name
          </label>
          <input
            id="edit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-colors"
            placeholder="Place name"
          />
        </div>

        {/* Collection dropdown */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Collection
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCollectionDropdownOpen(!isCollectionDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-left focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                {selectedCollection && (
                  <>
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center bg-white border border-zinc-200 dark:border-zinc-700"
                    >
                      {selectedEmoji && (
                        <span className="text-xs leading-none">{selectedEmoji}</span>
                      )}
                    </div>
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {selectedCollection.name}
                    </span>
                  </>
                )}
                {!selectedCollection && (
                  <span className="text-zinc-400">Select collection</span>
                )}
              </div>
              <ChevronDown
                size={18}
                className={`text-zinc-400 transition-transform ${
                  isCollectionDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown menu */}
            {isCollectionDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {collections.map((collection) => {
                  const emoji = isLegacyIconName(collection.icon) ? DEFAULT_EMOJI.emoji : collection.icon;
                  const isSelected = collection.id === collectionId;

                  return (
                    <button
                      key={collection.id}
                      type="button"
                      onClick={() => {
                        setCollectionId(collection.id);
                        setIsCollectionDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors ${
                        isSelected ? 'bg-amber-50 dark:bg-amber-900/20' : ''
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center bg-white border border-zinc-200 dark:border-zinc-700"
                      >
                        <span className="text-xs leading-none">{emoji}</span>
                      </div>
                      <span className="text-zinc-900 dark:text-zinc-100">{collection.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || !name.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
