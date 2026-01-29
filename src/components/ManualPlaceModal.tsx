'use client';

import { useState, useEffect } from 'react';
import { Loader2, Check, ChevronDown, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import TagInput from './TagInput';
import { getCollections, type Collection } from '@/app/actions/collections';
import { isLegacyIconName, DEFAULT_EMOJI } from '@/lib/emojis';

interface ManualPlaceModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when place is saved */
  onSave: (data: {
    name: string;
    address: string;
    notes: string;
    tags: string[];
    collectionId: string;
  }) => Promise<void>;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Error message to display */
  error?: string | null;
}

export default function ManualPlaceModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting = false,
  error = null,
}: ManualPlaceModalProps) {
  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Collection selector state
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);

  // Validation
  const [touched, setTouched] = useState({ name: false, address: false });

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

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setAddress('');
      setNotes('');
      setTags([]);
      setTouched({ name: false, address: false });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!name.trim() || !address.trim()) {
      setTouched({ name: true, address: true });
      return;
    }

    if (!selectedCollectionId || isSubmitting) return;

    await onSave({
      name: name.trim(),
      address: address.trim(),
      notes: notes.trim(),
      tags,
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

  // Get color for collection
  const getCollectionColor = (colorValue: string) => {
    return colorValue || '#f59e0b';
  };

  const nameError = touched.name && !name.trim();
  const addressError = touched.address && !address.trim();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Place Manually" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Name field (required) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            placeholder="e.g., Central Park, Joe's Coffee"
            className={`w-full py-3 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border ${
              nameError
                ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/50'
                : 'border-zinc-200 dark:border-zinc-700 focus:border-amber-500 focus:ring-amber-500/50'
            } focus:outline-none focus:ring-2 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400`}
            autoFocus
          />
          {nameError && (
            <p className="text-xs text-red-500 dark:text-red-400">Name is required</p>
          )}
        </div>

        {/* Address field (required) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, address: true }))}
            placeholder="e.g., 123 Main St, New York, NY"
            className={`w-full py-3 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border ${
              addressError
                ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/50'
                : 'border-zinc-200 dark:border-zinc-700 focus:border-amber-500 focus:ring-amber-500/50'
            } focus:outline-none focus:ring-2 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400`}
          />
          {addressError && (
            <p className="text-xs text-red-500 dark:text-red-400">Address is required</p>
          )}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            We&apos;ll find the location on the map from this address
          </p>
        </div>

        {/* Notes field (optional) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Notes <span className="text-zinc-400 dark:text-zinc-500 font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this place..."
            rows={3}
            className="w-full py-3 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none"
          />
        </div>

        {/* Tags field (optional) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Tags <span className="text-zinc-400 dark:text-zinc-500 font-normal">(optional)</span>
          </label>
          <TagInput tags={tags} onChange={setTags} placeholder="Add tags..." />
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
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: getCollectionColor(selectedCollection.color) }}
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
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: getCollectionColor(collection.color) }}
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
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Finding location...
              </>
            ) : (
              'Add Place'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
