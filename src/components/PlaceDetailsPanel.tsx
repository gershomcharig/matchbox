'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Copy,
  Check,
  Navigation,
  ExternalLink,
  Star,
  Clock,
  Globe,
  Phone,
  MapPin,
  Pencil,
  Tag,
  ChevronDown,
} from 'lucide-react';
import { type PlaceWithCollection, type Tag as TagType } from '@/app/actions/places';
import { isLegacyIconName, DEFAULT_EMOJI } from '@/lib/emojis';

/**
 * Format a place type string for display
 * e.g., "italian_restaurant" -> "Italian Restaurant"
 */
function formatPlaceType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get the current day's opening hours and status
 */
function getOpeningStatus(openingHours: Record<string, unknown> | null): {
  isOpen: boolean | null;
  todayHours: string | null;
  allHours: string[];
} {
  if (!openingHours || typeof openingHours !== 'object') {
    return { isOpen: null, todayHours: null, allHours: [] };
  }

  const weekdays = (openingHours as { weekdays?: string[] }).weekdays;
  if (!Array.isArray(weekdays) || weekdays.length === 0) {
    return { isOpen: null, todayHours: null, allHours: [] };
  }

  // Get current day (0 = Sunday in JS, but Google uses Monday = 0)
  const jsDay = new Date().getDay();
  const googleDay = jsDay === 0 ? 6 : jsDay - 1; // Convert to Mon=0 format
  const todayHours = weekdays[googleDay] || null;

  // Simple heuristic to check if currently open (not always accurate)
  // A more accurate approach would require parsing the times
  const isOpen = todayHours && !todayHours.toLowerCase().includes('closed') ? true : null;

  return { isOpen, todayHours, allHours: weekdays };
}

interface PlaceDetailsPanelProps {
  /** The place to display */
  place: PlaceWithCollection | null;
  /** Tags for this place */
  tags?: TagType[];
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback when panel should close */
  onClose: () => void;
  /** Callback when collection name is clicked */
  onCollectionClick?: (collectionId: string) => void;
  /** Callback when tag is clicked */
  onTagClick?: (tagName: string) => void;
  /** Callback when edit button is clicked */
  onEdit?: () => void;
}

export default function PlaceDetailsPanel({
  place,
  tags = [],
  isOpen,
  onClose,
  onCollectionClick,
  onTagClick,
  onEdit,
}: PlaceDetailsPanelProps) {
  const [copied, setCopied] = useState(false);
  const [hoursExpanded, setHoursExpanded] = useState(false);

  // Reset state when place changes
  useEffect(() => {
    setCopied(false);
    setHoursExpanded(false);
  }, [place?.id]);

  // Handle copy address
  const handleCopyAddress = useCallback(async () => {
    if (!place?.address) return;
    try {
      await navigator.clipboard.writeText(place.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  }, [place?.address]);

  // Handle navigate (open Google Maps directions)
  const handleNavigate = useCallback(() => {
    if (!place?.lat || !place?.lng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [place?.lat, place?.lng]);

  // Handle view on Google Maps
  const handleViewOnMaps = useCallback(() => {
    if (place?.google_maps_url) {
      window.open(place.google_maps_url, '_blank', 'noopener,noreferrer');
    } else if (place?.lat && place?.lng) {
      const url = `https://www.google.com/maps?q=${place.lat},${place.lng}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [place?.google_maps_url, place?.lat, place?.lng]);

  // Handle collection click
  const handleCollectionClick = useCallback(() => {
    if (place?.collection?.id && onCollectionClick) {
      onCollectionClick(place.collection.id);
    }
  }, [place?.collection?.id, onCollectionClick]);

  if (!place) return null;

  // Get collection emoji (handle legacy icon names)
  const collectionEmoji = place.collection
    ? isLegacyIconName(place.collection.icon)
      ? DEFAULT_EMOJI.emoji
      : place.collection.icon
    : null;

  // Panel content (shared between mobile and desktop)
  const panelContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex-1 min-w-0 pr-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {place.name}
          </h2>
          {/* Place types - shown as inline text */}
          {place.types && place.types.length > 0 && (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {place.types.slice(0, 3).map(formatPlaceType).join(' · ')}
            </p>
          )}
          {/* Collection badge */}
          {place.collection && (
            <button
              onClick={handleCollectionClick}
              className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: `${place.collection.color}20`,
                color: place.collection.color,
              }}
            >
              {collectionEmoji && <span className="text-xs">{collectionEmoji}</span>}
              {place.collection.name}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Edit place"
              data-testid="edit-place-button"
            >
              <Pencil size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close panel"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Address with copy button */}
        {place.address && (
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-zinc-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-600 dark:text-zinc-300 break-words">
                {place.address}
              </p>
              <button
                onClick={handleCopyAddress}
                className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-green-500" />
                    <span className="text-green-600 dark:text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy address</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Rating with count */}
        {place.rating !== null && place.rating !== undefined && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Show filled and empty stars */}
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  className={
                    star <= Math.round(place.rating!)
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-zinc-300 dark:text-zinc-600'
                  }
                />
              ))}
            </div>
            <span className="text-sm text-zinc-600 dark:text-zinc-300">
              {place.rating.toFixed(1)}
              {place.user_ratings_total && (
                <span className="text-zinc-400 dark:text-zinc-500">
                  {' '}({place.user_ratings_total.toLocaleString()} reviews)
                </span>
              )}
            </span>
          </div>
        )}

        {/* Opening hours - expandable */}
        {(() => {
          const { isOpen, todayHours, allHours } = getOpeningStatus(place.opening_hours);
          if (allHours.length === 0) return null;

          return (
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-zinc-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                {/* Header with status and toggle */}
                <button
                  onClick={() => setHoursExpanded(!hoursExpanded)}
                  className="flex items-center gap-2 text-sm w-full text-left"
                >
                  {isOpen !== null && (
                    <span
                      className={`font-medium ${
                        isOpen
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isOpen ? 'Open' : 'Closed'}
                    </span>
                  )}
                  {todayHours && (
                    <span className="text-zinc-600 dark:text-zinc-300 truncate">
                      {todayHours}
                    </span>
                  )}
                  <ChevronDown
                    size={16}
                    className={`text-zinc-400 transition-transform flex-shrink-0 ml-auto ${
                      hoursExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Expanded hours list */}
                {hoursExpanded && (
                  <div className="mt-2 space-y-1">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                      (day, index) => {
                        const jsDay = new Date().getDay();
                        const googleToday = jsDay === 0 ? 6 : jsDay - 1;
                        const isToday = index === googleToday;

                        return (
                          <div
                            key={day}
                            className={`flex justify-between text-xs ${
                              isToday
                                ? 'text-amber-600 dark:text-amber-400 font-medium'
                                : 'text-zinc-500 dark:text-zinc-400'
                            }`}
                          >
                            <span>{day}</span>
                            <span>{allHours[index] || 'N/A'}</span>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Website */}
        {place.website && (
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-zinc-400 flex-shrink-0" />
            <a
              href={place.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline truncate"
            >
              {new URL(place.website).hostname.replace('www.', '')}
            </a>
          </div>
        )}

        {/* Phone */}
        {place.phone && (
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-zinc-400 flex-shrink-0" />
            <a
              href={`tel:${place.phone}`}
              className="text-sm text-zinc-600 hover:text-zinc-800 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              {place.phone}
            </a>
          </div>
        )}

        {/* Tags */}
        <div className="flex items-start gap-3">
          <Tag size={18} className="text-zinc-400 mt-0.5 flex-shrink-0" />
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => onTagClick?.(tag.name)}
                  className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-sm text-zinc-400 dark:text-zinc-500 italic">No tags</span>
          )}
        </div>

        {/* Notes */}
        {place.notes && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
              {place.notes}
            </p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
        {/* Navigate button */}
        <button
          onClick={handleNavigate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:from-amber-400 hover:to-orange-400 transition-all"
        >
          <Navigation size={18} />
          <span>Get Directions</span>
        </button>

        {/* View on Google Maps link */}
        <button
          onClick={handleViewOnMaps}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
        >
          <ExternalLink size={16} />
          <span>View on Google Maps</span>
        </button>
      </div>
    </div>
  );

  // Slide-up panel
  return (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop (transparent, just for click-to-close) */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white dark:bg-zinc-900 rounded-t-2xl shadow-xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        data-testid="place-details-panel"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>

        {panelContent}
      </div>
    </div>
  );
}
