'use client';

import { useState, useCallback, useEffect } from 'react';
import CollectionsList from './CollectionsList';
import CollectionPlacesList from './CollectionPlacesList';
import TrashPlacesList from './TrashPlacesList';
import { type Collection } from '@/app/actions/collections';
import { type PlaceWithCollection, getDeletedPlaces } from '@/app/actions/places';

interface SidePanelProps {
  places: PlaceWithCollection[];
  onNewCollection: () => void;
  onEditCollection: (collection: Collection) => void;
  onFocusCollection: (collection: Collection) => void;
  onPlaceClick: (placeId: string) => void;
  onCollectionFilterChange: (collectionId: string | null) => void;
  selectedPlaceId?: string | null;
  collectionsRefreshTrigger?: number;
}

export default function SidePanel({
  places,
  onNewCollection,
  onEditCollection,
  onFocusCollection,
  onPlaceClick,
  onCollectionFilterChange,
  selectedPlaceId,
  collectionsRefreshTrigger,
}: SidePanelProps) {
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [trashPlaces, setTrashPlaces] = useState<PlaceWithCollection[]>([]);

  // Fetch trash places
  const fetchTrashPlaces = useCallback(async () => {
    const result = await getDeletedPlaces();
    if (result.success && result.places) {
      setTrashPlaces(result.places);
    }
  }, []);

  // When a collection is selected, filter map to that collection
  const handleSelectCollection = useCallback(
    (collection: Collection) => {
      setSelectedCollection(collection);
      setShowTrash(false);
      onCollectionFilterChange(collection.id);
    },
    [onCollectionFilterChange]
  );

  // When trash is selected
  const handleSelectTrash = useCallback(async () => {
    setSelectedCollection(null);
    setShowTrash(true);
    onCollectionFilterChange(null);
    await fetchTrashPlaces();
  }, [onCollectionFilterChange, fetchTrashPlaces]);

  // When going back, clear the collection filter
  const handleBack = useCallback(() => {
    setSelectedCollection(null);
    setShowTrash(false);
    onCollectionFilterChange(null);
  }, [onCollectionFilterChange]);

  // Handle trash places changed (restore/delete)
  const handleTrashPlacesChanged = useCallback(async () => {
    await fetchTrashPlaces();
  }, [fetchTrashPlaces]);

  // Get places for selected collection
  const collectionPlaces = selectedCollection
    ? places.filter((p) => p.collection_id === selectedCollection.id)
    : [];

  // If selected collection is deleted (refresh trigger), go back
  useEffect(() => {
    if (selectedCollection) {
      // Check if collection still exists in the places data
      const stillExists = places.some(
        (p) => p.collection?.id === selectedCollection.id
      );
      // Collection might be empty but still exist, so also check if any places reference it
      // For now we keep the collection view even if empty - user can go back manually
    }
  }, [collectionsRefreshTrigger, selectedCollection, places]);

  if (showTrash) {
    return (
      <TrashPlacesList
        places={trashPlaces}
        onBack={handleBack}
        onPlacesChanged={handleTrashPlacesChanged}
      />
    );
  }

  if (selectedCollection) {
    return (
      <CollectionPlacesList
        collection={selectedCollection}
        places={collectionPlaces}
        onBack={handleBack}
        onPlaceClick={onPlaceClick}
        onEditCollection={onEditCollection}
        selectedPlaceId={selectedPlaceId}
      />
    );
  }

  return (
    <CollectionsList
      onNewCollection={onNewCollection}
      onSelectCollection={handleSelectCollection}
      onEditCollection={onEditCollection}
      onFocusCollection={onFocusCollection}
      onSelectTrash={handleSelectTrash}
      refreshTrigger={collectionsRefreshTrigger}
    />
  );
}
