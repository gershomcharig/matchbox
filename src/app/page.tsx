'use client';

import { useEffect, useState, useCallback, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Map, { type MapHandle } from '@/components/Map';
import EmptyState from '@/components/EmptyState';
import PlaceDetailsPanel from '@/components/PlaceDetailsPanel';
import EditPlaceModal from '@/components/EditPlaceModal';
import FilterBar from '@/components/FilterBar';
import {
  getPlacesWithCollections,
  getTagsForPlace,
  getTags,
  updatePlace,
  softDeletePlace,
  type PlaceWithCollection,
  type Tag,
} from '@/app/actions/places';
import ContextMenu, { type ContextMenuAction } from '@/components/ContextMenu';
import { getCollections, type Collection } from '@/app/actions/collections';
import { type ExtractedPlace } from '@/components/AddPlaceModal';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useHistoryNavigation, type PanelView } from '@/hooks/useHistoryNavigation';
import { AlertTriangle, X } from 'lucide-react';

function HomeContent() {
  // Map ref for programmatic control
  const mapRef = useRef<MapHandle>(null);

  // Geolocation
  const { location: userLocation, permissionDenied: locationPermissionDenied } = useGeolocation();

  // Handle fly to user location
  const handleFlyToUserLocation = useCallback(() => {
    mapRef.current?.flyToUserLocation();
  }, []);

  // Data state
  const [places, setPlaces] = useState<PlaceWithCollection[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSoftLimitWarning, setShowSoftLimitWarning] = useState(false);
  const [softLimitDismissed, setSoftLimitDismissed] = useState(false);

  // Soft limit threshold
  const SOFT_LIMIT_THRESHOLD = 500;

  // Selected place state
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithCollection | null>(null);
  const [selectedPlaceTags, setSelectedPlaceTags] = useState<Tag[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Track where place was opened from (for back button navigation)
  const [placeOpenedFrom, setPlaceOpenedFrom] = useState<{
    source: 'map' | 'collection';
    collectionId?: string;
  } | null>(null);

  // Collections panel control (for back button navigation)
  const [collectionsOpen, setCollectionsOpen] = useState<boolean | undefined>(undefined);
  const [drilledCollectionId, setDrilledCollectionId] = useState<string | null | undefined>(undefined);

  // History navigation for back button support
  const historyNav = useHistoryNavigation({
    onNavigateToMap: useCallback(() => {
      // Close all panels
      setIsPanelOpen(false);
      setSelectedPlace(null);
      setSelectedPlaceTags([]);
      setPlaceOpenedFrom(null);
      setCollectionsOpen(false);
      setDrilledCollectionId(undefined);
    }, []),
    onNavigateToCollections: useCallback(() => {
      // Close place panel if open, show collections list
      setIsPanelOpen(false);
      setSelectedPlace(null);
      setSelectedPlaceTags([]);
      setPlaceOpenedFrom(null);
      setCollectionsOpen(true);
      setDrilledCollectionId(null); // null = show collections list, not drilled
    }, []),
    onNavigateToCollection: useCallback((collectionId: string) => {
      // Close place panel if open, show specific collection
      setIsPanelOpen(false);
      setSelectedPlace(null);
      setSelectedPlaceTags([]);
      setPlaceOpenedFrom(null);
      setCollectionsOpen(true);
      setDrilledCollectionId(collectionId);
    }, []),
    onNavigateFromPlace: useCallback((source: 'map' | 'collection', collectionId?: string) => {
      // This is called when navigating back from a place panel
      // The actual navigation is handled by the other callbacks
    }, []),
  });

  // Filter state
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isVisible: boolean;
    x: number;
    y: number;
    placeId: string | null;
  }>({
    isVisible: false,
    x: 0,
    y: 0,
    placeId: null,
  });

  // Shared place from PWA share target
  const [sharedPlace, setSharedPlace] = useState<ExtractedPlace | null>(null);
  const searchParams = useSearchParams();

  // Fetch initial data on mount
  const fetchData = useCallback(async () => {
    const [placesResult, collectionsResult, tagsResult] = await Promise.all([
      getPlacesWithCollections(),
      getCollections(),
      getTags(),
    ]);

    if (placesResult.success && placesResult.places) {
      console.log('[Places Loaded]', placesResult.places.length, 'places with collections');
      setPlaces(placesResult.places);
      // Check soft limit
      if (placesResult.places.length >= SOFT_LIMIT_THRESHOLD && !softLimitDismissed) {
        setShowSoftLimitWarning(true);
      }
    } else {
      console.error('[Failed to load places]', placesResult.error);
    }

    if (collectionsResult.success && collectionsResult.collections) {
      setCollections(collectionsResult.collections);
    }

    if (tagsResult.success && tagsResult.tags) {
      setAllTags(tagsResult.tags);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check for shared place from PWA share target
  useEffect(() => {
    const fromShare = searchParams.get('fromShare');
    if (fromShare === 'true') {
      // Check sessionStorage for pending shared place
      const pendingPlace = sessionStorage.getItem('pendingSharedPlace');
      if (pendingPlace) {
        try {
          const placeData = JSON.parse(pendingPlace) as ExtractedPlace;
          console.log('[Shared Place from PWA]', placeData);
          setSharedPlace(placeData);
          // Clear the pending place
          sessionStorage.removeItem('pendingSharedPlace');
          // Clean up the URL
          window.history.replaceState({}, '', '/');
        } catch (error) {
          console.error('[Failed to parse shared place]', error);
          sessionStorage.removeItem('pendingSharedPlace');
        }
      }
    }
  }, [searchParams]);

  // Handle shared place processed
  const handleSharedPlaceHandled = useCallback(() => {
    setSharedPlace(null);
  }, []);

  // Fetch tags when a place is selected
  const fetchTagsForPlace = useCallback(async (placeId: string) => {
    const result = await getTagsForPlace(placeId);
    if (result.success && result.tags) {
      setSelectedPlaceTags(result.tags);
    } else {
      setSelectedPlaceTags([]);
    }
  }, []);

  // Build a map of place IDs to their tags for filtering
  const [placeTagsMap, setPlaceTagsMap] = useState<Record<string, string[]>>({});

  // Fetch tags for all places (for tag filtering)
  useEffect(() => {
    const fetchAllPlaceTags = async () => {
      if (places.length === 0) return;

      const tagsRecord: Record<string, string[]> = {};
      await Promise.all(
        places.map(async (place) => {
          const result = await getTagsForPlace(place.id);
          if (result.success && result.tags) {
            tagsRecord[place.id] = result.tags.map((t) => t.name);
          } else {
            tagsRecord[place.id] = [];
          }
        })
      );
      setPlaceTagsMap(tagsRecord);
    };

    fetchAllPlaceTags();
  }, [places]);

  // Filter places based on selected filters and search query
  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      // Filter by collection
      if (selectedCollections.length > 0) {
        if (!place.collection || !selectedCollections.includes(place.collection.id)) {
          return false;
        }
      }

      // Filter by tags (OR logic - place must have ANY of the selected tags)
      if (selectedTags.length > 0) {
        const placeTags = placeTagsMap[place.id] || [];
        const hasAnyTag = selectedTags.some((tag) =>
          placeTags.some((pt) => pt.toLowerCase() === tag.toLowerCase())
        );
        if (!hasAnyTag) {
          return false;
        }
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const placeTags = placeTagsMap[place.id] || [];

        const matchesName = place.name.toLowerCase().includes(query);
        const matchesAddress = place.address?.toLowerCase().includes(query) || false;
        const matchesNotes = place.notes?.toLowerCase().includes(query) || false;
        const matchesTags = placeTags.some((tag) => tag.toLowerCase().includes(query));
        const matchesCollection = place.collection?.name.toLowerCase().includes(query) || false;

        if (!matchesName && !matchesAddress && !matchesNotes && !matchesTags && !matchesCollection) {
          return false;
        }
      }

      return true;
    });
  }, [places, selectedCollections, selectedTags, searchQuery, placeTagsMap]);

  // Handle marker click - open place details panel
  const handleMarkerClick = useCallback(
    (placeId: string, fromCollectionId?: string) => {
      console.log('[Place Selected]', placeId, 'from collection:', fromCollectionId);
      const place = places.find((p) => p.id === placeId);
      if (place) {
        setSelectedPlace(place);
        setIsPanelOpen(true);
        fetchTagsForPlace(placeId);

        // Track where the place was opened from
        if (fromCollectionId) {
          setPlaceOpenedFrom({ source: 'collection', collectionId: fromCollectionId });
          historyNav.pushState({ view: 'place', source: 'collection', collectionId: fromCollectionId });
        } else {
          setPlaceOpenedFrom({ source: 'map' });
          historyNav.pushState({ view: 'place', source: 'map' });
        }
      }
    },
    [places, fetchTagsForPlace, historyNav]
  );

  // Handle place click from list view (with optional collection source)
  const handlePlaceClick = useCallback(
    (placeId: string, fromCollectionId?: string) => {
      handleMarkerClick(placeId, fromCollectionId);
    },
    [handleMarkerClick]
  );

  // Handle closing the panel (manual close, not via back button)
  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
    // Keep selectedPlace for animation, clear after transition
    setTimeout(() => {
      setSelectedPlace(null);
      setSelectedPlaceTags([]);
    }, 300);

    // If closed manually (not via back button), we need to update history
    // Go back to the appropriate state based on where we came from
    if (placeOpenedFrom?.source === 'collection' && placeOpenedFrom.collectionId) {
      // Replace history state with the collection view
      historyNav.replaceState({ view: 'collection', collectionId: placeOpenedFrom.collectionId });
    } else {
      // Clear history state entirely
      historyNav.clearState();
    }
    setPlaceOpenedFrom(null);
  }, [placeOpenedFrom, historyNav]);

  // Handle collection click from panel - filter by this collection
  const handleCollectionClick = useCallback(
    (collectionId: string) => {
      console.log('[Collection Clicked from Panel]', collectionId);
      // Set filter to this collection only
      setSelectedCollections([collectionId]);
      handleClosePanel();
    },
    [handleClosePanel]
  );

  // Handle tag click from panel - filter by this tag
  const handleTagClick = useCallback(
    (tagName: string) => {
      console.log('[Tag Clicked from Panel]', tagName);
      // Add this tag to filters (or set as only tag filter)
      if (!selectedTags.includes(tagName)) {
        setSelectedTags([...selectedTags, tagName]);
      }
      handleClosePanel();
    },
    [handleClosePanel, selectedTags]
  );

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setSelectedCollections([]);
    setSelectedTags([]);
    setSearchQuery('');
  }, []);

  // Handle collection filter change (from drilling into a collection)
  const handleCollectionFilterChange = useCallback(
    (collectionId: string | null) => {
      if (collectionId) {
        // Filter to this collection only
        setSelectedCollections([collectionId]);
      } else {
        // Clear collection filter when going back
        setSelectedCollections([]);
      }
    },
    []
  );

  // Handle edit button click
  const handleEditClick = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  // Handle edit save - refresh places and update selected place
  const handleEditSave = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    // Refresh the selected place with updated data
    if (selectedPlace) {
      const result = await getPlacesWithCollections();
      if (result.success && result.places) {
        const updated = result.places.find((p) => p.id === selectedPlace.id);
        if (updated) {
          setSelectedPlace(updated);
          fetchTagsForPlace(updated.id);
        }
      }
    }
    setIsRefreshing(false);
  }, [fetchData, selectedPlace, fetchTagsForPlace]);

  // Handle delete - refresh places and close panel
  const handleDelete = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    handleClosePanel();
    setIsRefreshing(false);
  }, [fetchData, handleClosePanel]);

  // Handle context menu open (right-click or long-press on marker)
  const handleMarkerContextMenu = useCallback(
    (placeId: string, x: number, y: number) => {
      console.log('[Context Menu Requested]', placeId, x, y);
      setContextMenu({
        isVisible: true,
        x,
        y,
        placeId,
      });
    },
    []
  );

  // Handle context menu close
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu((prev) => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  // Get the place for context menu
  const contextMenuPlace = contextMenu.placeId
    ? places.find((p) => p.id === contextMenu.placeId)
    : null;

  // Handle context menu actions
  const handleContextMenuAction = useCallback(
    async (action: ContextMenuAction) => {
      if (!contextMenuPlace) return;

      handleCloseContextMenu();

      switch (action.type) {
        case 'edit':
          // Open edit modal for this place
          setSelectedPlace(contextMenuPlace);
          fetchTagsForPlace(contextMenuPlace.id);
          setIsEditModalOpen(true);
          break;

        case 'move':
          if (action.collectionId) {
            // Move place to new collection
            setIsRefreshing(true);
            const result = await updatePlace({
              id: contextMenuPlace.id,
              collectionId: action.collectionId,
            });
            if (result.success) {
              await fetchData();
            }
            setIsRefreshing(false);
          }
          break;

        case 'copy':
          // Copy address to clipboard (handled in ContextMenu component)
          break;

        case 'navigate':
          // Open Google Maps directions
          if (contextMenuPlace.lat && contextMenuPlace.lng) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${contextMenuPlace.lat},${contextMenuPlace.lng}`;
            window.open(url, '_blank');
          }
          break;

        case 'delete':
          // Soft delete the place
          setIsRefreshing(true);
          const deleteResult = await softDeletePlace(contextMenuPlace.id);
          if (deleteResult.success) {
            await fetchData();
          }
          setIsRefreshing(false);
          break;
      }
    },
    [contextMenuPlace, handleCloseContextMenu, fetchTagsForPlace, fetchData]
  );

  const hasPlaces = places.length > 0;

  return (
    <Layout
      onPlaceAdded={fetchData}
      sharedPlace={sharedPlace}
      onSharedPlaceHandled={handleSharedPlaceHandled}
      places={places}
      onPlaceClick={handlePlaceClick}
      onCollectionFilterChange={handleCollectionFilterChange}
      selectedPlaceId={selectedPlace?.id}
      userLocation={userLocation}
      locationPermissionDenied={locationPermissionDenied}
      onFlyToUserLocation={handleFlyToUserLocation}
      historyNav={historyNav}
      collectionsOpen={collectionsOpen}
      drilledCollectionId={drilledCollectionId}
    >
      {/* Filter bar and view toggle */}
      <FilterBar
        tags={allTags}
        selectedTags={selectedTags}
        searchQuery={searchQuery}
        onTagChange={setSelectedTags}
        onSearchChange={setSearchQuery}
        onClearFilters={handleClearFilters}
      />

      {/* Refreshing indicator */}
      {isRefreshing && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 shadow-lg">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Updating...</span>
          </div>
        </div>
      )}

      {/* Soft limit warning banner */}
      {showSoftLimitWarning && (
        <div className="absolute bottom-20 left-4 right-4 z-20 max-w-md mx-auto">
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50/95 dark:bg-amber-950/95 backdrop-blur-sm border border-amber-200 dark:border-amber-800 shadow-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Large collection detected
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                You have {places.length} places. Performance may slow down with many places. Consider exporting and archiving old places.
              </p>
            </div>
            <button
              onClick={() => {
                setShowSoftLimitWarning(false);
                setSoftLimitDismissed(true);
              }}
              className="p-1 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors flex-shrink-0"
              aria-label="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Map View */}
      <Map
        ref={mapRef}
        places={filteredPlaces}
        userLocation={userLocation}
        onMarkerClick={handleMarkerClick}
        onMarkerContextMenu={handleMarkerContextMenu}
      />
      {!isLoading && !hasPlaces && <EmptyState />}

      {/* Place Details Panel */}
      <PlaceDetailsPanel
        place={selectedPlace}
        tags={selectedPlaceTags}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        onCollectionClick={handleCollectionClick}
        onTagClick={handleTagClick}
        onEdit={handleEditClick}
      />

      {/* Edit Place Modal */}
      <EditPlaceModal
        place={selectedPlace}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
        onDelete={handleDelete}
      />

      {/* Context Menu */}
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isVisible={contextMenu.isVisible}
        placeName={contextMenuPlace?.name || ''}
        placeAddress={contextMenuPlace?.address || null}
        currentCollectionId={contextMenuPlace?.collection_id || ''}
        collections={collections}
        onAction={handleContextMenuAction}
        onClose={handleCloseContextMenu}
      />
    </Layout>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
