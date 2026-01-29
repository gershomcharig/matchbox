'use client';

import { useState } from 'react';
import { Check, Search } from 'lucide-react';
import {
  PRESET_EMOJIS,
  getEmojiCategories,
  getEmojisByCategory,
  type PresetEmoji,
} from '@/lib/emojis';

interface EmojiPickerProps {
  /** Currently selected emoji character */
  value?: string;
  /** Callback when an emoji is selected */
  onSelect: (emoji: PresetEmoji) => void;
  /** Optional label */
  label?: string;
  /** Optional accent color for selection ring (hex) */
  accentColor?: string;
}

export default function EmojiPicker({
  value,
  onSelect,
  label,
  accentColor,
}: EmojiPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = getEmojiCategories();

  // Filter emojis based on search and category
  const filteredEmojis = PRESET_EMOJIS.filter((emoji) => {
    const matchesSearch =
      searchQuery === '' ||
      emoji.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emoji.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === null || emoji.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group emojis by category for display
  const groupedEmojis = selectedCategory
    ? { [selectedCategory]: getEmojisByCategory(selectedCategory) }
    : categories.reduce(
        (acc, category) => {
          const categoryEmojis = filteredEmojis.filter(
            (emoji) => emoji.category === category
          );
          if (categoryEmojis.length > 0) {
            acc[category] = categoryEmojis;
          }
          return acc;
        },
        {} as Record<string, PresetEmoji[]>
      );

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search emojis..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
            selectedCategory === null
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
              selectedCategory === category
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Scrollable emoji grid */}
      <div className="max-h-32 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30">
        {Object.entries(groupedEmojis).map(([category, emojis]) => (
          <div key={category} className="p-3">
            {/* Category header (only show when viewing all) */}
            {selectedCategory === null && (
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                {category}
              </p>
            )}

            {/* Emoji grid */}
            <div className="grid grid-cols-8 gap-1.5">
              {emojis.map((emojiData) => {
                const isSelected = value === emojiData.emoji;

                return (
                  <button
                    key={emojiData.emoji}
                    type="button"
                    onClick={() => onSelect(emojiData)}
                    title={emojiData.name}
                    className={`
                      relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 ease-out
                      hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:scale-110
                      focus:outline-none focus:ring-2 focus:ring-amber-500/50
                      ${
                        isSelected
                          ? 'bg-zinc-200 dark:bg-zinc-700 ring-2 ring-offset-1 ring-offset-zinc-50 dark:ring-offset-zinc-800'
                          : ''
                      }
                    `}
                    style={
                      isSelected && accentColor
                        ? ({ '--tw-ring-color': accentColor } as React.CSSProperties)
                        : undefined
                    }
                    aria-label={`Select ${emojiData.name}`}
                    aria-pressed={isSelected}
                  >
                    <span className="text-lg leading-none">{emojiData.emoji}</span>

                    {/* Checkmark badge for selected */}
                    {isSelected && (
                      <span
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: accentColor || '#f59e0b' }}
                      >
                        <Check className="w-2 h-2 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {filteredEmojis.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No emojis found for &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Selected emoji indicator */}
      {value && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Selected:{' '}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {value}
          </span>
        </p>
      )}
    </div>
  );
}
