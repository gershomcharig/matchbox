'use client';

import { useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Map as MapGL, MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapMarker from './MapMarker';
import UserLocationMarker from './UserLocationMarker';
import { type PlaceWithCollection } from '@/app/actions/places';

// London coordinates for empty state
const LONDON_CENTER = {
  longitude: -0.1278,
  latitude: 51.5074,
};

const INITIAL_ZOOM = 11;

// Padding for fitBounds (pixels)
const FIT_BOUNDS_PADDING = { top: 80, bottom: 80, left: 40, right: 40 };

interface MapProps {
  /** Places to display as markers */
  places?: PlaceWithCollection[];
  /** User's current location */
  userLocation?: { lat: number; lng: number } | null;
  /** Callback when a marker is clicked */
  onMarkerClick?: (placeId: string) => void;
  /** Callback when a marker context menu is requested (right-click/long-press) */
  onMarkerContextMenu?: (placeId: string, x: number, y: number) => void;
}

export interface MapHandle {
  flyToUserLocation: () => void;
}

const MapComponent = forwardRef<MapHandle, MapProps>(function Map(
  { places = [], userLocation, onMarkerClick, onMarkerContextMenu },
  ref
) {
  const mapRef = useRef<MapRef>(null);

  // Expose flyToUserLocation method via ref
  useImperativeHandle(ref, () => ({
    flyToUserLocation: () => {
      if (mapRef.current && userLocation) {
        mapRef.current.flyTo({
          center: [userLocation.lng, userLocation.lat],
          zoom: 15,
          duration: 1000,
        });
      }
    },
  }), [userLocation]);

  // Handle marker click
  const handleMarkerClick = useCallback(
    (placeId: string) => {
      console.log('[Marker Clicked] Place ID:', placeId);
      onMarkerClick?.(placeId);
    },
    [onMarkerClick]
  );

  // Helper function to fit bounds to a set of places
  const fitBoundsToPlaces = useCallback((placesToFit: PlaceWithCollection[]) => {
    if (!mapRef.current) return;

    const placesWithCoords = placesToFit.filter(
      (p) => p.lat !== null && p.lng !== null
    );

    if (placesWithCoords.length === 0) {
      // No places - center on London
      mapRef.current.flyTo({
        center: [LONDON_CENTER.longitude, LONDON_CENTER.latitude],
        zoom: INITIAL_ZOOM,
        duration: 1000,
      });
      return;
    }

    if (placesWithCoords.length === 1) {
      // Single place - center on it with reasonable zoom
      const place = placesWithCoords[0];
      mapRef.current.flyTo({
        center: [place.lng!, place.lat!],
        zoom: 15,
        duration: 1000,
      });
      return;
    }

    // Multiple places - fit bounds
    const lngs = placesWithCoords.map((p) => p.lng!);
    const lats = placesWithCoords.map((p) => p.lat!);

    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];

    mapRef.current.fitBounds(bounds, {
      padding: FIT_BOUNDS_PADDING,
      duration: 1000,
      maxZoom: 16,
    });
  }, []);

  // Fit map to show all places when places change
  useEffect(() => {
    fitBoundsToPlaces(places);
  }, [places, fitBoundsToPlaces]);

  return (
    <MapGL
      ref={mapRef}
      initialViewState={{
        ...LONDON_CENTER,
        zoom: INITIAL_ZOOM,
      }}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Render markers for places with valid coordinates and collection data */}
      {places.map((place) => {
        if (place.lat === null || place.lng === null || !place.collection) {
          return null;
        }

        return (
          <MapMarker
            key={place.id}
            placeId={place.id}
            placeName={place.name}
            lat={place.lat}
            lng={place.lng}
            color={place.collection.color}
            iconName={place.collection.icon}
            onClick={handleMarkerClick}
            onContextMenu={onMarkerContextMenu}
          />
        );
      })}

      {/* User location marker - rendered last to appear on top */}
      {userLocation && (
        <UserLocationMarker lat={userLocation.lat} lng={userLocation.lng} />
      )}
    </MapGL>
  );
});

export default MapComponent;
