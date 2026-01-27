'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Represents the different panel states in the app
 */
export type PanelView =
  | { view: 'map' }
  | { view: 'collections' }
  | { view: 'collection'; collectionId: string }
  | { view: 'place'; source: 'map' | 'collection'; collectionId?: string };

/**
 * Check if two panel states are equivalent
 */
function statesEqual(a: PanelView | null, b: PanelView | null): boolean {
  if (!a || !b) return a === b;
  if (a.view !== b.view) return false;
  if (a.view === 'collection' && b.view === 'collection') {
    return a.collectionId === b.collectionId;
  }
  if (a.view === 'place' && b.view === 'place') {
    return a.source === b.source && a.collectionId === b.collectionId;
  }
  return true;
}

interface UseHistoryNavigationOptions {
  /** Called when back button navigates to map view */
  onNavigateToMap: () => void;
  /** Called when back button navigates to collections list */
  onNavigateToCollections: () => void;
  /** Called when back button navigates to a specific collection */
  onNavigateToCollection: (collectionId: string) => void;
  /** Called when back button navigates from place panel */
  onNavigateFromPlace: (source: 'map' | 'collection', collectionId?: string) => void;
}

/**
 * Hook to manage browser history for panel navigation.
 * Enables the back button to navigate through panel states.
 */
export function useHistoryNavigation(options: UseHistoryNavigationOptions) {
  const {
    onNavigateToMap,
    onNavigateToCollections,
    onNavigateToCollection,
    onNavigateFromPlace,
  } = options;

  // Track if we're handling a programmatic navigation to avoid loops
  const isNavigating = useRef(false);
  // Track current state for debugging
  const currentState = useRef<PanelView | null>(null);

  /**
   * Push a new panel state onto the history stack
   */
  const pushState = useCallback((state: PanelView) => {
    // Don't push duplicate states
    if (statesEqual(state, currentState.current)) {
      return;
    }

    isNavigating.current = true;
    currentState.current = state;

    // Push state to history. We use the same URL to avoid URL changes.
    // Wrap our state in a known key to avoid conflicts with Next.js internal state
    window.history.pushState({ __matchbook: state }, '');

    isNavigating.current = false;
  }, []);

  /**
   * Replace the current history state (use when you want to update state without adding to stack)
   */
  const replaceState = useCallback((state: PanelView) => {
    isNavigating.current = true;
    currentState.current = state;

    // Wrap our state in a known key to avoid conflicts with Next.js internal state
    window.history.replaceState({ __matchbook: state }, '');

    isNavigating.current = false;
  }, []);

  /**
   * Clear history state (reset to map view without pushing)
   */
  const clearState = useCallback(() => {
    currentState.current = null;
    // Replace with empty state to clean up
    window.history.replaceState({ __matchbook: null }, '');
  }, []);

  // Handle popstate (back/forward button)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If we're programmatically navigating, ignore this event
      if (isNavigating.current) {
        return;
      }

      // Extract our state from the wrapper (or handle legacy/Next.js state)
      const rawState = event.state;
      const state = rawState?.__matchbook as PanelView | null | undefined;
      const previousState = currentState.current;
      currentState.current = state ?? null;

      // Determine what action to take based on where we came from and where we're going
      if (!state || state.view === 'map') {
        // Going back to map view
        onNavigateToMap();
      } else if (state.view === 'collections') {
        // Going back to collections list
        onNavigateToCollections();
      } else if (state.view === 'collection') {
        // Going back to a specific collection
        onNavigateToCollection(state.collectionId);
      } else if (state.view === 'place') {
        // This shouldn't normally happen (going forward to place via back button)
        // but handle it gracefully
        onNavigateFromPlace(state.source, state.collectionId);
      }

      // If we were on a place view and are now going somewhere else,
      // the previousState tells us where we came from
      if (previousState?.view === 'place' && state?.view !== 'place') {
        // This is handled by the specific callbacks above
      }
    };

    window.addEventListener('popstate', handlePopState);

    // On initial mount, clear any stale history state from previous sessions
    // This ensures we always start fresh at the map view on page load/refresh
    if (window.history.state?.__matchbook) {
      // Replace with clean state so refresh starts fresh
      window.history.replaceState({ __matchbook: null }, '');
      currentState.current = null;
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onNavigateToMap, onNavigateToCollections, onNavigateToCollection, onNavigateFromPlace]);

  return {
    pushState,
    replaceState,
    clearState,
    getCurrentState: () => currentState.current,
  };
}
