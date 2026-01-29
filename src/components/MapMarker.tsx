'use client';

import { useRef, useCallback } from 'react';
import { Marker, MarkerEvent } from 'react-map-gl/mapbox';
import { isLegacyIconName, DEFAULT_EMOJI } from '@/lib/emojis';

interface MapMarkerProps {
  /** Unique identifier for the place */
  placeId: string;
  /** Place name for accessibility */
  placeName?: string;
  /** Latitude coordinate */
  lat: number;
  /** Longitude coordinate */
  lng: number;
  /** Collection color (hex) */
  color: string;
  /** Collection icon name */
  iconName: string;
  /** Click handler */
  onClick?: (placeId: string) => void;
  /** Context menu handler (right-click or long-press) */
  onContextMenu?: (placeId: string, x: number, y: number) => void;
}

// Long press duration in milliseconds
const LONG_PRESS_DURATION = 500;

export default function MapMarker({
  placeId,
  placeName,
  lat,
  lng,
  color,
  iconName,
  onClick,
  onContextMenu,
}: MapMarkerProps) {
  // Display the emoji directly, or fallback to default for legacy icon names
  const displayEmoji = isLegacyIconName(iconName) ? DEFAULT_EMOJI.emoji : iconName;

  // Long press timer ref
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const touchStartPos = useRef({ x: 0, y: 0 });

  const handleClick = (e: MarkerEvent<MouseEvent>) => {
    e.originalEvent.stopPropagation();
    // Don't trigger click if long press was just triggered
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    onClick?.(placeId);
  };

  // Handle right-click (desktop context menu)
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu?.(placeId, e.clientX, e.clientY);
    },
    [placeId, onContextMenu]
  );

  // Handle touch start (begin long press detection)
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      longPressTriggered.current = false;

      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true;
        onContextMenu?.(placeId, touch.clientX, touch.clientY);
      }, LONG_PRESS_DURATION);
    },
    [placeId, onContextMenu]
  );

  // Handle touch move (cancel long press if moved too far)
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!longPressTimer.current) return;

    const touch = e.touches[0];
    const moveThreshold = 10; // pixels
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);

    if (dx > moveThreshold || dy > moveThreshold) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Handle touch end (cancel long press timer)
  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return (
    <Marker
      longitude={lng}
      latitude={lat}
      anchor="center"
      onClick={handleClick}
    >
      {/* Custom pin shape with drop shadow */}
      <div
        className="relative cursor-pointer transition-transform hover:scale-110 active:scale-95"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        role="button"
        tabIndex={0}
        aria-label={placeName ? `View ${placeName}` : 'View place details'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.(placeId);
          }
        }}
      >
        {/* Pin body - simple circle */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="16" cy="16" r="16" fill={color} />
        </svg>

        {/* Emoji centered in the circle */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{ width: '20px', height: '20px' }}
        >
          <span className="text-sm leading-none">{displayEmoji}</span>
        </div>
      </div>
    </Marker>
  );
}
