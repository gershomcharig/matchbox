'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Map from '@/components/Map';
import EmptyState from '@/components/EmptyState';
import PlaceDetailsPanel from '@/components/PlaceDetailsPanel';
import EditPlaceModal from '@/components/EditPlaceModal';
import FilterBar from '@/components/FilterBar';
import ViewToggle, { type ViewMode } from '@/components/ViewToggle';
import ListView from '@/components/ListView';
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

function HomeContent() {
  // Data state
  const [places, setPlaces] = useState<PlaceWithCollection[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected place state
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithCollection | null>(null);
  const [selectedPlaceTags, setSelectedPlaceTags] = useState<Tag[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter state
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('map');

  // Focus state for map
  const [focusCollectionId, setFocusCollectionId] = useState<string | null>(null);
  const [focusTrigger, setFocusTrigger] = useState(0);

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

      // Filter by tags (AND logic - place must have ALL selected tags)
      if (selectedTags.length > 0) {
        const placeTags = placeTagsMap[place.id] || [];
        const hasAllTags = selectedTags.every((tag) =>
          placeTags.some((pt) => pt.toLowerCase() === tag.toLowerCase())
        );
        if (!hasAllTags) {
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
    (placeId: string) => {
      console.log('[Place Selected]', placeId);
      const place = places.find((p) => p.id === placeId);
      if (place) {
        setSelectedPlace(place);
        setIsPanelOpen(true);
        fetchTagsForPlace(placeId);
      }
    },
    [places, fetchTagsForPlace]
  );

  // Handle place click from list view
  const handlePlaceClick = useCallback(
    (placeId: string) => {
      handleMarkerClick(placeId);
    },
    [handleMarkerClick]
  );

  // Handle closing the panel
  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
    // Keep selectedPlace for animation, clear after transition
    setTimeout(() => {
      setSelectedPlace(null);
      setSelectedPlaceTags([]);
    }, 300);
  }, []);

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

  // Handle edit button click
  const handleEditClick = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  // Handle edit save - refresh places and update selected place
  const handleEditSave = useCallback(async () => {
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
  }, [fetchData, selectedPlace, fetchTagsForPlace]);

  // Handle delete - refresh places and close panel
  const handleDelete = useCallback(async () => {
    await fetchData();
    handleClosePanel();
  }, [fetchData, handleClosePanel]);

  // Handle focus on collection (zoom map to its places)
  const handleFocusCollection = useCallback((collectionId: string) => {
    setFocusCollectionId(collectionId);
    setFocusTrigger((prev) => prev + 1);
    // Switch to map view if in list view
    setViewMode('map');
  }, []);

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
            const result = await updatePlace({
              id: contextMenuPlace.id,
              collectionId: action.collectionId,
            });
            if (result.success) {
              await fetchData();
            }
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
          const deleteResult = await softDeletePlace(contextMenuPlace.id);
          if (deleteResult.success) {
            await fetchData();
          }
          break;
      }
    },
    [contextMenuPlace, handleCloseContextMenu, fetchTagsForPlace, fetchData]
  );

  const hasPlaces = places.length > 0;

  return (
    <Layout onPlaceAdded={fetchData} onFocusCollection={handleFocusCollection} sharedPlace={sharedPlace} onSharedPlaceHandled={handleSharedPlaceHandled}>
      {/* Filter bar and view toggle */}
      <FilterBar
        collections={collections}
        tags={allTags}
        selectedCollections={selectedCollections}
        selectedTags={selectedTags}
        searchQuery={searchQuery}
        onCollectionChange={setSelectedCollections}
        onTagChange={setSelectedTags}
        onSearchChange={setSearchQuery}
        onClearFilters={handleClearFilters}
      />

      {/* View toggle - positioned bottom-left on mobile, top-right on the filter bar area on desktop */}
      <div className="absolute bottom-6 left-4 z-10 lg:top-4 lg:bottom-auto lg:left-auto lg:right-[340px]">
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <>
          <Map
            places={filteredPlaces}
            onMarkerClick={handleMarkerClick}
            onMarkerContextMenu={handleMarkerContextMenu}
            focusCollectionId={focusCollectionId}
            focusTrigger={focusTrigger}
          />
          {!isLoading && !hasPlaces && <EmptyState />}
        </>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <ListView
          places={filteredPlaces}
          collections={collections}
          onPlaceClick={handlePlaceClick}
          selectedPlaceId={selectedPlace?.id}
        />
      )}

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
