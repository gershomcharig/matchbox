'use client';

import { useState } from 'react';
import { Folder } from 'lucide-react';
import Modal from './Modal';
import EmojiPicker from './EmojiPicker';
import { DEFAULT_EMOJI, type PresetEmoji } from '@/lib/emojis';

interface NewCollectionModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when collection is submitted */
  onSubmit: (data: { name: string; color: string; icon: string }) => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
}

export default function NewCollectionModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: NewCollectionModalProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState<PresetEmoji>(DEFAULT_EMOJI);

  const isValid = name.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    onSubmit({
      name: name.trim(),
      color: '#FFFFFF',
      icon: emoji.emoji,
    });
  };

  const handleClose = () => {
    // Reset form when closing
    setName('');
    setEmoji(DEFAULT_EMOJI);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Collection" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Preview */}
        <div className="flex items-center justify-center py-4">
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
        <div className="space-y-2">
          <label
            htmlFor="collection-name"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Name
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
              <Folder className="w-4 h-4" />
            </div>
            <input
              id="collection-name"
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
            disabled={!isValid || isSubmitting}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
          >
            {isSubmitting ? 'Creating...' : 'Create Collection'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
