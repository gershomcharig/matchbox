'use client';

import { useState, useEffect } from 'react';
import { Folder, Trash2, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import EmojiPicker from './EmojiPicker';
import { findEmojiByChar, isLegacyIconName, DEFAULT_EMOJI, type PresetEmoji } from '@/lib/emojis';
import type { Collection } from '@/app/actions/collections';

interface EditCollectionModalProps {
  /** The collection to edit */
  collection: Collection | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when collection is saved */
  onSave: (data: { id: string; name: string; color: string; icon: string }) => void;
  /** Callback when collection is deleted */
  onDelete: (id: string) => void;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Whether delete is in progress */
  isDeleting?: boolean;
  /** Number of places in this collection */
  placeCount?: number;
}

export default function EditCollectionModal({
  collection,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
  placeCount = 0,
}: EditCollectionModalProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState<PresetEmoji>(DEFAULT_EMOJI);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form when collection changes
  useEffect(() => {
    if (collection) {
      setName(collection.name);
      // Handle legacy icon names by falling back to default emoji
      if (isLegacyIconName(collection.icon)) {
        setEmoji(DEFAULT_EMOJI);
      } else {
        const foundEmoji = findEmojiByChar(collection.icon);
        setEmoji(foundEmoji || DEFAULT_EMOJI);
      }
      setShowDeleteConfirm(false);
    }
  }, [collection]);

  const isValid = name.trim().length > 0;
  const isLoading = isSaving || isDeleting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading || !collection) return;

    onSave({
      id: collection.id,
      name: name.trim(),
      color: '#FFFFFF',
      icon: emoji.emoji,
    });
  };

  const handleClose = () => {
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (collection) {
      onDelete(collection.id);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  if (!collection) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Collection" maxWidth="max-w-lg">
      {showDeleteConfirm ? (
        // Delete confirmation view
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Delete "{collection.name}"?
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm">
              {placeCount > 0 ? (
                <>
                  This collection contains <strong>{placeCount} {placeCount === 1 ? 'place' : 'places'}</strong>.
                  {' '}They will be moved to your default collection.
                </>
              ) : (
                'This collection is empty and will be permanently deleted.'
              )}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                'Deleting...'
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Collection
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        // Edit form view
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview */}
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-4">
              {/* Pin preview */}
              <div
                className="w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center transition-colors duration-200 bg-white border border-zinc-200 dark:border-zinc-700"
              >
                <span className="text-2xl leading-none">{emoji.emoji}</span>
              </div>
              {/* Name preview */}
              <div>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  {name || 'Collection Name'}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {emoji.name}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

          {/* Name input */}
          <div className="space-y-1">
            <label
              htmlFor="edit-collection-name"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Name
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                <Folder className="w-4 h-4" />
              </div>
              <input
                id="edit-collection-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Favorite Restaurants"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                autoFocus
                autoComplete="off"
              />
            </div>
          </div>

          {/* Emoji picker */}
          <EmojiPicker
            label="Emoji"
            value={emoji.emoji}
            onSelect={setEmoji}
          />

          {/* Delete link */}
          <div>
            <button
              type="button"
              onClick={handleDeleteClick}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete this collection
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
