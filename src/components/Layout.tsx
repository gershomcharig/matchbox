'use client';

import { ReactNode, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Layers, MapPinPlus, ClipboardPaste } from 'lucide-react';
import { clearSessionToken } from '@/lib/auth';
import { detectMapsUrl, extractCoordinatesFromUrl, extractPlaceNameFromUrl } from '@/lib/maps';
import { reverseGeocode } from '@/lib/geocoding';
import NewCollectionModal from './NewCollectionModal';
import EditCollectionModal from './EditCollectionModal';
import AddPlaceModal, { type ExtractedPlace } from './AddPlaceModal';
import ManualPlaceModal from './ManualPlaceModal';
import DuplicateWarningModal from './DuplicateWarningModal';
import { InstallPrompt } from './InstallPrompt';
import CollectionsList from './CollectionsList';
import CollectionPlacesList from './CollectionPlacesList';
import SidePanel from './SidePanel';
import { createCollection, updateCollection, deleteCollection, getCollectionPlaceCounts, type Collection } from '@/app/actions/collections';
import { createPlace, updatePlaceTags, checkForDuplicates, type PlaceWithCollection } from '@/app/actions/places';
import { forwardGeocode } from '@/lib/geocoding';
import { ToastContainer, generateToastId, type ToastData } from './Toast';

interface LayoutProps {
  children: ReactNode;
  sidePanel?: ReactNode;
  onCollectionSelected?: (collection: Collection) => void;
  /** Callback when a place is added */
  onPlaceAdded?: () => void;
  /** Callback when focus on collection is requested */
  onFocusCollection?: (collectionId: string) => void;
  /** Shared place data from PWA share target */
  sharedPlace?: ExtractedPlace | null;
  /** Callback to clear shared place after handling */
  onSharedPlaceHandled?: () => void;
  /** All places data for the side panel */
  places?: PlaceWithCollection[];
  /** Callback when a place is clicked in the side panel */
  onPlaceClick?: (placeId: string) => void;
  /** Callback when collection filter changes from side panel drill-down */
  onSidePanelCollectionFilter?: (collectionId: string | null) => void;
  /** Currently selected place ID */
  selectedPlaceId?: string | null;
}

export default function Layout({
  children,
  sidePanel,
  onCollectionSelected,
  onPlaceAdded,
  onFocusCollection,
  sharedPlace,
  onSharedPlaceHandled,
  places = [],
  onPlaceClick,
  onSidePanelCollectionFilter,
  selectedPlaceId,
}: LayoutProps) {
  const router = useRouter();
  const [isNewCollectionOpen, setIsNewCollectionOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileCollectionsOpen, setIsMobileCollectionsOpen] = useState(false);
  const [collectionsRefreshTrigger, setCollectionsRefreshTrigger] = useState(0);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | undefined>();

  // Mobile panel drill-down state
  const [mobileSelectedCollection, setMobileSelectedCollection] = useState<Collection | null>(null);

  // Edit Collection modal state
  const [isEditCollectionOpen, setIsEditCollectionOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [editingCollectionPlaceCount, setEditingCollectionPlaceCount] = useState(0);
  const [isSavingCollection, setIsSavingCollection] = useState(false);
  const [isDeletingCollection, setIsDeletingCollection] = useState(false);

  // Add Place modal state (paste)
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [extractedPlace, setExtractedPlace] = useState<ExtractedPlace | null>(null);
  const [isAddingPlace, setIsAddingPlace] = useState(false);

  // Manual Place modal state
  const [isManualPlaceOpen, setIsManualPlaceOpen] = useState(false);
  const [isAddingManualPlace, setIsAddingManualPlace] = useState(false);
  const [manualPlaceError, setManualPlaceError] = useState<string | null>(null);

  // Duplicate warning modal state
  const [isDuplicateWarningOpen, setIsDuplicateWarningOpen] = useState(false);
  const [duplicateExistingPlace, setDuplicateExistingPlace] = useState<PlaceWithCollection | null>(null);
  const [duplicateMatchType, setDuplicateMatchType] = useState<'coordinates' | 'url' | null>(null);
  const [pendingPlaceData, setPendingPlaceData] = useState<{
    type: 'paste' | 'manual';
    place?: ExtractedPlace;
    collectionId: string;
    manualData?: {
      name: string;
      address: string;
      notes: string;
      tags: string[];
      lat: number;
      lng: number;
    };
  } | null>(null);
  const [isAddingDuplicate, setIsAddingDuplicate] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((type: ToastData['type'], message: string) => {
    const newToast: ToastData = {
      id: generateToastId(),
      type,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleLogout = () => {
    clearSessionToken();
    router.push('/login');
  };

  const handleCreateCollection = async (data: {
    name: string;
    color: string;
    icon: string;
  }) => {
    setIsSubmitting(true);
    const result = await createCollection(data);
    setIsSubmitting(false);

    if (result.success) {
      setIsNewCollectionOpen(false);
      // Trigger refresh of collections list
      setCollectionsRefreshTrigger((prev) => prev + 1);
    } else {
      console.error('Failed to create collection:', result.error);
    }
  };

  const handleSelectCollection = useCallback(
    (collection: Collection) => {
      setSelectedCollectionId(collection.id);
      // For mobile: drill down into collection places list
      setMobileSelectedCollection(collection);
      // Filter the map to this collection
      onSidePanelCollectionFilter?.(collection.id);
      onCollectionSelected?.(collection);
    },
    [onCollectionSelected, onSidePanelCollectionFilter]
  );

  // Handle going back from collection places list in mobile
  const handleMobileBack = useCallback(() => {
    setMobileSelectedCollection(null);
    onSidePanelCollectionFilter?.(null);
  }, [onSidePanelCollectionFilter]);

  // Handle place click in mobile collection places list
  const handleMobilePlaceClick = useCallback(
    (placeId: string) => {
      setIsMobileCollectionsOpen(false);
      onPlaceClick?.(placeId);
    },
    [onPlaceClick]
  );

  const handleOpenNewCollection = () => {
    setIsMobileCollectionsOpen(false);
    setIsNewCollectionOpen(true);
  };

  // Handle opening edit collection modal
  const handleEditCollection = useCallback(async (collection: Collection) => {
    setEditingCollection(collection);
    setIsMobileCollectionsOpen(false);

    // Fetch place count for this collection
    const result = await getCollectionPlaceCounts();
    if (result.success && result.counts) {
      setEditingCollectionPlaceCount(result.counts[collection.id] || 0);
    } else {
      setEditingCollectionPlaceCount(0);
    }

    setIsEditCollectionOpen(true);
  }, []);

  // Handle saving collection edits
  const handleSaveCollection = async (data: { id: string; name: string; color: string; icon: string }) => {
    setIsSavingCollection(true);
    const result = await updateCollection(data);
    setIsSavingCollection(false);

    if (result.success) {
      setIsEditCollectionOpen(false);
      setEditingCollection(null);
      setCollectionsRefreshTrigger((prev) => prev + 1);
      showToast('success', `"${data.name}" updated successfully!`);
      // Also refresh places since collection color/icon may have changed
      onPlaceAdded?.();
    } else {
      showToast('error', result.error || 'Failed to update collection');
    }
  };

  // Handle deleting a collection
  const handleDeleteCollection = async (id: string) => {
    setIsDeletingCollection(true);
    const result = await deleteCollection(id);
    setIsDeletingCollection(false);

    if (result.success) {
      setIsEditCollectionOpen(false);
      setEditingCollection(null);
      setCollectionsRefreshTrigger((prev) => prev + 1);
      showToast('success', 'Collection deleted successfully');
      // Refresh places since they may have moved to another collection
      onPlaceAdded?.();
    } else {
      showToast('error', result.error || 'Failed to delete collection');
    }
  };

  // Handle focus on collection (zoom map to its places)
  const handleFocusCollection = useCallback((collection: Collection) => {
    setIsMobileCollectionsOpen(false);
    onFocusCollection?.(collection.id);
  }, [onFocusCollection]);

  // Handle saving a place from the Add Place modal
  const handleSavePlace = async (data: { place: ExtractedPlace; collectionId: string }) => {
    setIsAddingPlace(true);
    console.log('[Saving Place]', data);

    // Check for duplicates first
    const duplicateCheck = await checkForDuplicates(
      data.place.lat,
      data.place.lng,
      data.place.googleMapsUrl
    );

    if (duplicateCheck.success && duplicateCheck.isDuplicate && duplicateCheck.existingPlace) {
      // Show duplicate warning modal
      setIsAddingPlace(false);
      setDuplicateExistingPlace(duplicateCheck.existingPlace);
      setDuplicateMatchType(duplicateCheck.matchType || null);
      setPendingPlaceData({
        type: 'paste',
        place: data.place,
        collectionId: data.collectionId,
      });
      setIsAddPlaceOpen(false);
      setIsDuplicateWarningOpen(true);
      return;
    }

    // No duplicate found, proceed with saving
    await savePlaceFromPaste(data);
  };

  // Actually save a pasted place (called after duplicate check or when adding anyway)
  const savePlaceFromPaste = async (data: { place: ExtractedPlace; collectionId: string }) => {
    setIsAddingPlace(true);

    const result = await createPlace({
      name: data.place.name,
      address: data.place.address,
      lat: data.place.lat,
      lng: data.place.lng,
      googleMapsUrl: data.place.googleMapsUrl,
      collectionId: data.collectionId,
    });

    setIsAddingPlace(false);

    if (result.success) {
      console.log('[Place Saved Successfully]', result.place);
      setIsAddPlaceOpen(false);
      setExtractedPlace(null);
      showToast('success', `"${data.place.name}" added to your collection!`);
      // Notify parent to refresh places
      onPlaceAdded?.();
    } else {
      console.error('[Failed to Save Place]', result.error);
      showToast('error', result.error || 'Failed to save place. Please try again.');
    }
  };

  const handleCloseAddPlace = () => {
    setIsAddPlaceOpen(false);
    setExtractedPlace(null);
  };

  // Handle saving a manually entered place
  const handleSaveManualPlace = async (data: {
    name: string;
    address: string;
    notes: string;
    tags: string[];
    collectionId: string;
  }) => {
    setIsAddingManualPlace(true);
    setManualPlaceError(null);
    console.log('[Saving Manual Place]', data);

    // Geocode the address to get coordinates
    const geocodeResult = await forwardGeocode(data.address);

    if (!geocodeResult) {
      setManualPlaceError('Could not find location for this address. Please try a different address.');
      setIsAddingManualPlace(false);
      return;
    }

    console.log('[Geocoded Address]', geocodeResult);

    // Check for duplicates
    const duplicateCheck = await checkForDuplicates(
      geocodeResult.lat,
      geocodeResult.lng,
      null
    );

    if (duplicateCheck.success && duplicateCheck.isDuplicate && duplicateCheck.existingPlace) {
      // Show duplicate warning modal
      setIsAddingManualPlace(false);
      setDuplicateExistingPlace(duplicateCheck.existingPlace);
      setDuplicateMatchType(duplicateCheck.matchType || null);
      setPendingPlaceData({
        type: 'manual',
        collectionId: data.collectionId,
        manualData: {
          name: data.name,
          address: geocodeResult.address || data.address,
          notes: data.notes,
          tags: data.tags,
          lat: geocodeResult.lat,
          lng: geocodeResult.lng,
        },
      });
      setIsManualPlaceOpen(false);
      setIsDuplicateWarningOpen(true);
      return;
    }

    // No duplicate found, proceed with saving
    await saveManualPlaceWithData({
      name: data.name,
      address: geocodeResult.address || data.address,
      notes: data.notes,
      tags: data.tags,
      lat: geocodeResult.lat,
      lng: geocodeResult.lng,
      collectionId: data.collectionId,
    });
  };

  // Actually save a manual place (called after duplicate check or when adding anyway)
  const saveManualPlaceWithData = async (data: {
    name: string;
    address: string;
    notes: string;
    tags: string[];
    lat: number;
    lng: number;
    collectionId: string;
  }) => {
    setIsAddingManualPlace(true);

    // Create the place
    const result = await createPlace({
      name: data.name,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      collectionId: data.collectionId,
      notes: data.notes || undefined,
    });

    if (!result.success || !result.place) {
      setManualPlaceError(result.error || 'Failed to save place. Please try again.');
      setIsAddingManualPlace(false);
      return;
    }

    // Add tags if provided
    if (data.tags.length > 0) {
      await updatePlaceTags(result.place.id, data.tags);
    }

    console.log('[Manual Place Saved Successfully]', result.place);
    setIsAddingManualPlace(false);
    setIsManualPlaceOpen(false);
    showToast('success', `"${data.name}" added to your collection!`);
    onPlaceAdded?.();
  };

  const handleCloseManualPlace = () => {
    setIsManualPlaceOpen(false);
    setManualPlaceError(null);
  };

  // Handle closing duplicate warning modal
  const handleCloseDuplicateWarning = () => {
    setIsDuplicateWarningOpen(false);
    setDuplicateExistingPlace(null);
    setDuplicateMatchType(null);
    setPendingPlaceData(null);
  };

  // Handle adding place anyway despite duplicate warning
  const handleAddDuplicateAnyway = async () => {
    if (!pendingPlaceData) return;

    setIsAddingDuplicate(true);

    if (pendingPlaceData.type === 'paste' && pendingPlaceData.place) {
      await savePlaceFromPaste({
        place: pendingPlaceData.place,
        collectionId: pendingPlaceData.collectionId,
      });
    } else if (pendingPlaceData.type === 'manual' && pendingPlaceData.manualData) {
      await saveManualPlaceWithData({
        ...pendingPlaceData.manualData,
        collectionId: pendingPlaceData.collectionId,
      });
    }

    setIsAddingDuplicate(false);
    handleCloseDuplicateWarning();
  };

  // Handle shared place from PWA share target
  useEffect(() => {
    if (sharedPlace) {
      console.log('[Shared Place Received]', sharedPlace);
      setExtractedPlace(sharedPlace);
      setIsAddPlaceOpen(true);
      onSharedPlaceHandled?.();
    }
  }, [sharedPlace, onSharedPlaceHandled]);

  // Handle paste button click (for mobile)
  const handlePasteButtonClick = async () => {
    try {
      // Request clipboard permission and read text
      const text = await navigator.clipboard.readText();
      console.log('[Paste Button Clicked]', text);

      if (text) {
        // Check if it's a Google Maps URL
        const detection = detectMapsUrl(text);

        if (detection.isValid && detection.url) {
          console.log('[Google Maps URL Detected]', detection.url);

          // Extract place name from URL (if available)
          const urlPlaceName = extractPlaceNameFromUrl(detection.url);

          // Extract coordinates from URL
          const coordinates = extractCoordinatesFromUrl(detection.url);

          if (coordinates) {
            console.log('[Coordinates Extracted]', coordinates);

            // Reverse geocode to get place information
            const placeInfo = await reverseGeocode(coordinates);

            if (placeInfo) {
              const finalName = urlPlaceName || placeInfo.name;

              const extractedPlaceData: ExtractedPlace = {
                name: finalName,
                address: placeInfo.address,
                lat: placeInfo.lat,
                lng: placeInfo.lng,
                googleMapsUrl: detection.url,
                urlExtractedName: urlPlaceName || null,
                geocodedName: placeInfo.name,
                displayName: placeInfo.displayName,
                placeType: placeInfo.placeType || null,
                city: placeInfo.city || null,
                country: placeInfo.country || null,
              };

              setExtractedPlace(extractedPlaceData);
              setIsAddPlaceOpen(true);
            } else if (urlPlaceName) {
              // Partial data fallback
              const partialPlaceData: ExtractedPlace = {
                name: urlPlaceName,
                address: 'Address not available',
                lat: coordinates.lat,
                lng: coordinates.lng,
                googleMapsUrl: detection.url,
                urlExtractedName: urlPlaceName,
                geocodedName: undefined,
                displayName: undefined,
                placeType: null,
                city: null,
                country: null,
              };
              setExtractedPlace(partialPlaceData);
              setIsAddPlaceOpen(true);
              showToast('error', 'Could not get full address info. You can still save the place.');
            } else {
              showToast('error', 'Could not get place information. Please try again or add manually.');
            }
          } else {
            showToast('error', 'Could not find location in URL. Try a different Google Maps link.');
          }
        } else {
          showToast('error', 'No Google Maps link found in clipboard. Copy a link first!');
        }
      } else {
        showToast('error', 'Clipboard is empty. Copy a Google Maps link first!');
      }
    } catch (error) {
      console.error('[Paste Button Error]', error);
      showToast('error', 'Could not read clipboard. Please paste manually (Ctrl+V or Cmd+V).');
    }
  };

  // Global paste event listener
  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      // Get pasted text
      const pastedText = event.clipboardData?.getData('text');

      if (pastedText) {
        console.log('[Paste Detected]', pastedText);

        // Check if it's a Google Maps URL
        const detection = detectMapsUrl(pastedText);

        if (detection.isValid && detection.url) {
          console.log('[Google Maps URL Detected]', detection.url);

          // Extract place name from URL (if available)
          const urlPlaceName = extractPlaceNameFromUrl(detection.url);
          if (urlPlaceName) {
            console.log('[Place Name from URL]', urlPlaceName);
          }

          // Extract coordinates from URL
          const coordinates = extractCoordinatesFromUrl(detection.url);

          if (coordinates) {
            console.log('[Coordinates Extracted]', coordinates);

            // Reverse geocode to get place information
            console.log('[Fetching place info from geocoding...]');
            const placeInfo = await reverseGeocode(coordinates);

            if (placeInfo) {
              // Prefer URL-extracted name if available (more accurate for named places)
              const finalName = urlPlaceName || placeInfo.name;

              // Build extracted place data
              const extractedPlaceData: ExtractedPlace = {
                name: finalName,
                address: placeInfo.address,
                lat: placeInfo.lat,
                lng: placeInfo.lng,
                googleMapsUrl: detection.url,
                urlExtractedName: urlPlaceName || null,
                geocodedName: placeInfo.name,
                displayName: placeInfo.displayName,
                placeType: placeInfo.placeType || null,
                city: placeInfo.city || null,
                country: placeInfo.country || null,
              };

              console.log('[All Extracted Place Data]', extractedPlaceData);

              // Open the Add Place modal (Phase 4.6)
              setExtractedPlace(extractedPlaceData);
              setIsAddPlaceOpen(true);
            } else {
              console.error('[Failed to get place info] Geocoding failed');
              // If we have URL name and coordinates, still allow adding with partial data
              if (urlPlaceName && coordinates) {
                const partialPlaceData: ExtractedPlace = {
                  name: urlPlaceName,
                  address: 'Address not available',
                  lat: coordinates.lat,
                  lng: coordinates.lng,
                  googleMapsUrl: detection.url,
                  urlExtractedName: urlPlaceName,
                  geocodedName: undefined,
                  displayName: undefined,
                  placeType: null,
                  city: null,
                  country: null,
                };
                setExtractedPlace(partialPlaceData);
                setIsAddPlaceOpen(true);
                showToast('error', 'Could not get full address info. You can still save the place.');
              } else {
                showToast('error', 'Could not get place information. Please try again or add manually.');
              }
            }
          } else {
            console.log('[No coordinates found in URL] Cannot extract place info');
            showToast('error', 'Could not find location in URL. Try a different Google Maps link.');
          }
        }
        // Note: We intentionally don't show error for non-Maps URLs to avoid spamming
        // when users paste normal text
      }
    };

    // Add event listener to window
    window.addEventListener('paste', handlePaste);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [showToast]);

  return (
    <div className="h-screen w-screen overflow-hidden flex">
      {/* Map area - fills available space */}
      <div className="flex-1 relative">
        {/* Top bar buttons */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {/* Mobile: Collections toggle button */}
          <button
            onClick={() => setIsMobileCollectionsOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-lg shadow-zinc-900/5 dark:shadow-zinc-950/50"
            title="Collections"
          >
            <Layers className="w-4 h-4" />
            <span className="text-sm font-medium">Collections</span>
          </button>

          {/* Add Place button (primary) */}
          <button
            onClick={() => setIsManualPlaceOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:from-amber-400 hover:to-orange-400 transition-all"
            title="Add place"
          >
            <MapPinPlus className="w-4 h-4" />
            <span className="text-sm">Add Place</span>
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-lg shadow-zinc-900/5 dark:shadow-zinc-950/50"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>

        {children}
      </div>

      {/* New Collection Modal */}
      <NewCollectionModal
        isOpen={isNewCollectionOpen}
        onClose={() => setIsNewCollectionOpen(false)}
        onSubmit={handleCreateCollection}
        isSubmitting={isSubmitting}
      />

      {/* Add Place Modal (from paste) */}
      <AddPlaceModal
        isOpen={isAddPlaceOpen}
        onClose={handleCloseAddPlace}
        place={extractedPlace}
        onSave={handleSavePlace}
        isSubmitting={isAddingPlace}
      />

      {/* Manual Place Modal */}
      <ManualPlaceModal
        isOpen={isManualPlaceOpen}
        onClose={handleCloseManualPlace}
        onSave={handleSaveManualPlace}
        isSubmitting={isAddingManualPlace}
        error={manualPlaceError}
      />

      {/* Duplicate Warning Modal */}
      <DuplicateWarningModal
        isOpen={isDuplicateWarningOpen}
        onClose={handleCloseDuplicateWarning}
        newPlaceName={pendingPlaceData?.type === 'paste' ? pendingPlaceData.place?.name || '' : pendingPlaceData?.manualData?.name || ''}
        existingPlace={duplicateExistingPlace}
        matchType={duplicateMatchType}
        onAddAnyway={handleAddDuplicateAnyway}
        isSubmitting={isAddingDuplicate}
      />

      {/* Edit Collection Modal */}
      <EditCollectionModal
        collection={editingCollection}
        isOpen={isEditCollectionOpen}
        onClose={() => {
          setIsEditCollectionOpen(false);
          setEditingCollection(null);
        }}
        onSave={handleSaveCollection}
        onDelete={handleDeleteCollection}
        isSaving={isSavingCollection}
        isDeleting={isDeletingCollection}
        placeCount={editingCollectionPlaceCount}
      />

      {/* Mobile Collections Panel (slide-up) */}
      {isMobileCollectionsOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setIsMobileCollectionsOpen(false);
              // Reset drill-down state when closing
              if (mobileSelectedCollection) {
                setMobileSelectedCollection(null);
                onSidePanelCollectionFilter?.(null);
              }
            }}
          />
          {/* Panel */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-white dark:bg-zinc-900 rounded-t-3xl shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(70vh-48px)]">
              {mobileSelectedCollection ? (
                <CollectionPlacesList
                  collection={mobileSelectedCollection}
                  places={places.filter((p) => p.collection_id === mobileSelectedCollection.id)}
                  onBack={handleMobileBack}
                  onPlaceClick={handleMobilePlaceClick}
                  onEditCollection={handleEditCollection}
                  selectedPlaceId={selectedPlaceId}
                />
              ) : (
                <CollectionsList
                  onNewCollection={handleOpenNewCollection}
                  onSelectCollection={handleSelectCollection}
                  onEditCollection={handleEditCollection}
                  onFocusCollection={handleFocusCollection}
                  selectedId={selectedCollectionId}
                  refreshTrigger={collectionsRefreshTrigger}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Side Panel */}
      <div className="hidden lg:block w-[320px] border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-y-auto">
        {sidePanel || (
          <SidePanel
            places={places}
            onNewCollection={() => setIsNewCollectionOpen(true)}
            onEditCollection={handleEditCollection}
            onFocusCollection={handleFocusCollection}
            onPlaceClick={onPlaceClick || (() => {})}
            onCollectionFilterChange={onSidePanelCollectionFilter || (() => {})}
            selectedPlaceId={selectedPlaceId}
            collectionsRefreshTrigger={collectionsRefreshTrigger}
          />
        )}
      </div>

      {/* Install Prompt */}
      <InstallPrompt />

      {/* Mobile Paste Button - floating at bottom center */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={handlePasteButtonClick}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:from-amber-400 hover:to-orange-400 active:scale-95 transition-all"
          title="Paste Google Maps link"
        >
          <ClipboardPaste className="w-5 h-5" />
          <span>Paste Link</span>
        </button>
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
