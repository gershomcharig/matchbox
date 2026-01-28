'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, ChevronDown } from 'lucide-react';
import Modal from './Modal';
import TagInput from './TagInput';
import {
  type PlaceWithCollection,
  type Tag,
  updatePlace,
  updatePlaceTags,
  getTagsForPlace,
  softDeletePlace,
} from '@/app/actions/places';
import { getCollections, type Collection } from '@/app/actions/collections';
import { findIconByName } from '@/lib/icons';

interface EditPlaceModalProps {
  /** The place being edited */
  place: PlaceWithCollection | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when place is updated */
  onSave: () => void;
  /** Callback when place is deleted */
  onDelete: () => void;
}

export default function EditPlaceModal({
  place,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EditPlaceModalProps) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [collectionId, setCollectionId] = useState<string>('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isCollectionDropdownOpen, setIsCollectionDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load place data when modal opens
  useEffect(() => {
    if (isOpen && place) {
      setName(place.name);
      setNotes(place.notes || '');
      setCollectionId(place.collection_id);
      setError(null);
      setShowDeleteConfirm(false);

      // Load tags for this place
      getTagsForPlace(place.id).then((result) => {
        if (result.success && result.tags) {
          setTags(result.tags.map((t) => t.name));
        } else {
          setTags([]);
        }
      });

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
        notes,
        collectionId,
      });

      if (!updateResult.success) {
        setError(updateResult.error || 'Failed to update place');
        setIsSubmitting(false);
        return;
      }

      // Update tags
      const tagsResult = await updatePlaceTags(place.id, tags);
      if (!tagsResult.success) {
        console.error('Failed to update tags:', tagsResult.error);
        // Don't block save for tag errors
      }

      setIsSubmitting(false);
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving place:', err);
      setError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  }, [place, name, notes, collectionId, tags, onSave, onClose]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!place) return;

    setIsDeleting(true);
    setError(null);

    try {
      const result = await softDeletePlace(place.id);

      if (!result.success) {
        setError(result.error || 'Failed to delete place');
        setIsDeleting(false);
        return;
      }

      setIsDeleting(false);
      onDelete();
      onClose();
    } catch (err) {
      console.error('Error deleting place:', err);
      setError('An unexpected error occurred');
      setIsDeleting(false);
    }
  }, [place, onDelete, onClose]);

  // Get selected collection
  const selectedCollection = collections.find((c) => c.id === collectionId);
  const selectedCollectionIcon = selectedCollection
    ? findIconByName(selectedCollection.icon)
    : null;
  const SelectedIcon = selectedCollectionIcon?.icon;

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
                      className="w-5 h-5 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: selectedCollection.color }}
                    >
                      {SelectedIcon && (
                        <SelectedIcon size={12} className="text-white" strokeWidth={2.5} />
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
                  const iconData = findIconByName(collection.icon);
                  const Icon = iconData?.icon;
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
                        className="w-5 h-5 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: collection.color }}
                      >
                        {Icon && <Icon size={12} className="text-white" strokeWidth={2.5} />}
                      </div>
                      <span className="text-zinc-900 dark:text-zinc-100">{collection.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tags input */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Tags
          </label>
          <TagInput tags={tags} onChange={setTags} placeholder="Add tags..." />
        </div>

        {/* Notes input */}
        <div>
          <label
            htmlFor="edit-notes"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
          >
            Notes
          </label>
          <textarea
            id="edit-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-colors resize-none"
            placeholder="Add notes about this place..."
          />
        </div>

        {/* Delete section */}
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            <Trash2 size={16} />
            <span>Delete this place</span>
          </button>
        ) : (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              Are you sure you want to delete this place? It will be moved to trash.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, delete'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
