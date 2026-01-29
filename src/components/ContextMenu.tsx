'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Pencil,
  FolderInput,
  Copy,
  Navigation,
  Trash2,
  Check,
  ChevronRight,
} from 'lucide-react';
import { type Collection } from '@/app/actions/collections';
import { isLegacyIconName, DEFAULT_EMOJI } from '@/lib/emojis';

export interface ContextMenuAction {
  type: 'edit' | 'move' | 'copy' | 'navigate' | 'delete';
  collectionId?: string;
}

interface ContextMenuProps {
  /** X position of the menu */
  x: number;
  /** Y position of the menu */
  y: number;
  /** Whether the menu is visible */
  isVisible: boolean;
  /** Place name for display */
  placeName: string;
  /** Place address for copy */
  placeAddress: string | null;
  /** Current collection ID */
  currentCollectionId: string;
  /** Available collections for move submenu */
  collections: Collection[];
  /** Callback when an action is selected */
  onAction: (action: ContextMenuAction) => void;
  /** Callback when menu should close */
  onClose: () => void;
}

export default function ContextMenu({
  x,
  y,
  isVisible,
  placeName,
  placeAddress,
  currentCollectionId,
  collections,
  onAction,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMoveSubmenu, setShowMoveSubmenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (!isVisible || !menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // Adjust horizontal position
    if (x + rect.width > viewportWidth - 16) {
      adjustedX = viewportWidth - rect.width - 16;
    }
    if (adjustedX < 16) {
      adjustedX = 16;
    }

    // Adjust vertical position
    if (y + rect.height > viewportHeight - 16) {
      adjustedY = viewportHeight - rect.height - 16;
    }
    if (adjustedY < 16) {
      adjustedY = 16;
    }

    setAdjustedPosition({ x: adjustedX, y: adjustedY });
  }, [isVisible, x, y]);

  // Close menu on click outside
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Delay to prevent immediate close from the triggering click
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

  // Reset state when menu closes
  useEffect(() => {
    if (!isVisible) {
      setShowMoveSubmenu(false);
      setCopied(false);
    }
  }, [isVisible]);

  const handleCopyAddress = async () => {
    if (!placeAddress) return;

    try {
      await navigator.clipboard.writeText(placeAddress);
      setCopied(true);
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const getCollectionEmoji = (iconName: string) => {
    return isLegacyIconName(iconName) ? DEFAULT_EMOJI.emoji : iconName;
  };

  // Filter out current collection from move targets
  const moveTargets = collections.filter((c) => c.id !== currentCollectionId);

  if (!isVisible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[200px] py-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl shadow-zinc-900/15 dark:shadow-zinc-950/50 animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {/* Place name header */}
      <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
          {placeName}
        </p>
      </div>

      {/* Menu items */}
      <div className="py-1">
        {/* Edit */}
        <button
          onClick={() => onAction({ type: 'edit' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <Pencil className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          Edit
        </button>

        {/* Move to - with submenu */}
        <div className="relative">
          <button
            onClick={() => setShowMoveSubmenu(!showMoveSubmenu)}
            onMouseEnter={() => setShowMoveSubmenu(true)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="flex items-center gap-3">
              <FolderInput className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              Move to
            </span>
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          </button>

          {/* Move submenu */}
          {showMoveSubmenu && moveTargets.length > 0 && (
            <div
              className="absolute left-full top-0 ml-1 min-w-[180px] py-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl shadow-zinc-900/15 dark:shadow-zinc-950/50 max-h-[300px] overflow-y-auto"
              onMouseLeave={() => setShowMoveSubmenu(false)}
            >
              {moveTargets.map((collection) => {
                const emoji = getCollectionEmoji(collection.icon);
                return (
                  <button
                    key={collection.id}
                    onClick={() =>
                      onAction({ type: 'move', collectionId: collection.id })
                    }
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: collection.color }}
                    >
                      <span className="text-sm leading-none">{emoji}</span>
                    </div>
                    <span className="truncate">{collection.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

        {/* Copy address */}
        <button
          onClick={handleCopyAddress}
          disabled={!placeAddress}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              Copy address
            </>
          )}
        </button>

        {/* Navigate */}
        <button
          onClick={() => onAction({ type: 'navigate' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <Navigation className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          Get directions
        </button>

        {/* Divider */}
        <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

        {/* Delete */}
        <button
          onClick={() => onAction({ type: 'delete' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
}
