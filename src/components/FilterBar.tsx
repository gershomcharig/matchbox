'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  ChevronDown,
  Check,
  Filter,
  Layers,
  Tag,
} from 'lucide-react';
import { type Collection } from '@/app/actions/collections';
import { type Tag as TagType } from '@/app/actions/places';
import { findIconByName } from '@/lib/icons';

interface FilterBarProps {
  /** Available collections for filtering */
  collections: Collection[];
  /** Available tags for filtering */
  tags: TagType[];
  /** Currently selected collection IDs */
  selectedCollections: string[];
  /** Currently selected tag names */
  selectedTags: string[];
  /** Search query */
  searchQuery: string;
  /** Callback when collection selection changes */
  onCollectionChange: (collectionIds: string[]) => void;
  /** Callback when tag selection changes */
  onTagChange: (tagNames: string[]) => void;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
  /** Callback to clear all filters */
  onClearFilters: () => void;
}

export default function FilterBar({
  collections,
  tags,
  selectedCollections,
  selectedTags,
  searchQuery,
  onCollectionChange,
  onTagChange,
  onSearchChange,
  onClearFilters,
}: FilterBarProps) {
  const [isCollectionDropdownOpen, setIsCollectionDropdownOpen] = useState(false);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const collectionDropdownRef = useRef<HTMLDivElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  // Check if any filters are active
  const hasActiveFilters =
    selectedCollections.length > 0 ||
    selectedTags.length > 0 ||
    searchQuery.trim().length > 0;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        collectionDropdownRef.current &&
        !collectionDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCollectionDropdownOpen(false);
      }
      if (
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTagDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle collection selection
  const toggleCollection = useCallback(
    (collectionId: string) => {
      if (selectedCollections.includes(collectionId)) {
        onCollectionChange(selectedCollections.filter((id) => id !== collectionId));
      } else {
        onCollectionChange([...selectedCollections, collectionId]);
      }
    },
    [selectedCollections, onCollectionChange]
  );

  // Toggle tag selection
  const toggleTag = useCallback(
    (tagName: string) => {
      if (selectedTags.includes(tagName)) {
        onTagChange(selectedTags.filter((name) => name !== tagName));
      } else {
        onTagChange([...selectedTags, tagName]);
      }
    },
    [selectedTags, onTagChange]
  );

  // Get collection label for dropdown button
  const getCollectionLabel = () => {
    if (selectedCollections.length === 0) return 'All Collections';
    if (selectedCollections.length === 1) {
      const collection = collections.find((c) => c.id === selectedCollections[0]);
      return collection?.name || 'Collection';
    }
    return `${selectedCollections.length} Collections`;
  };

  // Get tag label for dropdown button
  const getTagLabel = () => {
    if (selectedTags.length === 0) return 'All Tags';
    if (selectedTags.length === 1) return selectedTags[0];
    return `${selectedTags.length} Tags`;
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
      {/* Search input */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search places..."
          className="w-[180px] sm:w-[220px] pl-9 pr-8 py-2 rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-lg shadow-zinc-900/5 dark:shadow-zinc-950/50"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Collection filter dropdown */}
      <div className="relative" ref={collectionDropdownRef}>
        <button
          onClick={() => {
            setIsCollectionDropdownOpen(!isCollectionDropdownOpen);
            setIsTagDropdownOpen(false);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-zinc-900/5 dark:shadow-zinc-950/50 ${
            selectedCollections.length > 0
              ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200'
              : 'bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900'
          }`}
        >
          <Layers size={14} />
          <span className="hidden sm:inline">{getCollectionLabel()}</span>
          <span className="sm:hidden">
            {selectedCollections.length > 0 ? selectedCollections.length : ''}
          </span>
          <ChevronDown
            size={14}
            className={`transition-transform ${isCollectionDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Collection dropdown menu */}
        {isCollectionDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 max-h-72 overflow-y-auto rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1 z-50">
            {collections.length === 0 ? (
              <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                No collections yet
              </div>
            ) : (
              collections.map((collection) => {
                const iconData = findIconByName(collection.icon);
                const Icon = iconData?.icon;
                const isSelected = selectedCollections.includes(collection.id);

                return (
                  <button
                    key={collection.id}
                    onClick={() => toggleCollection(collection.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    {/* Color/icon swatch */}
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: collection.color }}
                    >
                      {Icon && <Icon size={14} className="text-white" />}
                    </div>
                    {/* Name */}
                    <span className="flex-1 text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {collection.name}
                    </span>
                    {/* Checkmark */}
                    {isSelected && (
                      <Check size={16} className="text-amber-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Tag filter dropdown */}
      <div className="relative" ref={tagDropdownRef}>
        <button
          onClick={() => {
            setIsTagDropdownOpen(!isTagDropdownOpen);
            setIsCollectionDropdownOpen(false);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-zinc-900/5 dark:shadow-zinc-950/50 ${
            selectedTags.length > 0
              ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200'
              : 'bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900'
          }`}
        >
          <Tag size={14} />
          <span className="hidden sm:inline">{getTagLabel()}</span>
          <span className="sm:hidden">
            {selectedTags.length > 0 ? selectedTags.length : ''}
          </span>
          <ChevronDown
            size={14}
            className={`transition-transform ${isTagDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Tag dropdown menu */}
        {isTagDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-56 max-h-72 overflow-y-auto rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1 z-50">
            {tags.length === 0 ? (
              <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                No tags yet
              </div>
            ) : (
              tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.name);

                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.name)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    {/* Tag badge */}
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-medium">
                      {tag.name}
                    </span>
                    {/* Checkmark */}
                    {isSelected && (
                      <Check size={16} className="text-amber-500 ml-auto flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-lg shadow-zinc-900/5 dark:shadow-zinc-950/50"
        >
          <Filter size={14} />
          <span className="hidden sm:inline">Clear</span>
          <X size={14} />
        </button>
      )}
    </div>
  );
}
