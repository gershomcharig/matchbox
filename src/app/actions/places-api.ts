'use server';

import {
  extractPlaceIdFromUrl,
  extractPlaceNameFromUrl,
  extractCoordinatesFromUrl,
  getPlaceDetails,
  searchPlace,
  type PlaceDetails,
} from '@/lib/google-places';
import { isGoogleMapsUrl, isShortenedMapsUrl } from '@/lib/maps';

/**
 * Result from extracting place data from a Google Maps URL
 */
export interface ExtractPlaceResult {
  success: boolean;
  place?: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    googleMapsUrl: string;
    placeId?: string;
    types?: string[];
    website?: string;
    phone?: string;
    rating?: number;
    openingHours?: string[];
  };
  error?: string;
  /** Whether API key is configured */
  apiKeyConfigured?: boolean;
}

/**
 * Expands a shortened Google Maps URL by following redirects
 *
 * @param shortUrl - Shortened URL (maps.app.goo.gl or goo.gl/maps)
 * @returns Expanded URL or original if expansion fails
 */
async function expandUrl(shortUrl: string): Promise<string> {
  try {
    // Use HEAD request to follow redirects without downloading body
    const response = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Matchbook/1.0)',
      },
    });

    let expandedUrl = response.url;

    // If we landed on consent page, extract the continue URL
    if (expandedUrl.includes('consent.google.com')) {
      try {
        const urlObj = new URL(expandedUrl);
        const continueUrl = urlObj.searchParams.get('continue');
        if (continueUrl) {
          console.log('[Places API] Extracted continue URL from consent page');
          expandedUrl = continueUrl;
        }
      } catch {
        // Ignore parse errors
      }
    }

    return expandedUrl;
  } catch (error) {
    console.error('[Places API] URL expansion failed:', error);
    return shortUrl;
  }
}

/**
 * Main server action to extract place data from a Google Maps URL
 *
 * This is the single source of truth for place extraction.
 *
 * Flow:
 * 1. Expand shortened URLs
 * 2. Extract Place ID from URL
 * 3. If Place ID found -> call Places API Place Details
 * 4. If no Place ID -> extract name/coords from URL, use Text Search
 * 5. Return normalized place data
 *
 * @param mapsUrl - Google Maps URL (can be shortened or full)
 * @returns Place data or error
 */
export async function extractPlaceFromUrl(mapsUrl: string): Promise<ExtractPlaceResult> {
  try {
    // Validate input
    if (!mapsUrl || typeof mapsUrl !== 'string') {
      return { success: false, error: 'Invalid URL provided' };
    }

    // Get API key from environment
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('[Places API] GOOGLE_MAPS_API_KEY not configured');
      return {
        success: false,
        error: 'Google Maps API key not configured. Please add GOOGLE_MAPS_API_KEY to your environment.',
        apiKeyConfigured: false,
      };
    }

    // Step 1: Expand shortened URLs
    let finalUrl = mapsUrl;
    if (isShortenedMapsUrl(mapsUrl)) {
      console.log('[Places API] Expanding shortened URL...');
      finalUrl = await expandUrl(mapsUrl);
      console.log('[Places API] Expanded to:', finalUrl.substring(0, 100) + '...');
    }

    // Validate it's a Google Maps URL
    if (!isGoogleMapsUrl(finalUrl)) {
      return { success: false, error: 'Not a valid Google Maps URL' };
    }

    // Step 2: Try to extract Place ID from URL
    const placeId = extractPlaceIdFromUrl(finalUrl);
    console.log('[Places API] Extracted Place ID:', placeId);

    // Also extract name and coordinates for fallback/search
    const urlPlaceName = extractPlaceNameFromUrl(finalUrl);
    const urlCoordinates = extractCoordinatesFromUrl(finalUrl);

    console.log('[Places API] URL extracted data:', {
      placeId,
      name: urlPlaceName,
      coords: urlCoordinates,
    });

    let placeDetails: PlaceDetails | null = null;

    // Step 3: If we have a valid Place ID (not CID), use Place Details API
    if (placeId && !placeId.startsWith('cid:')) {
      console.log('[Places API] Fetching place details for ID:', placeId);
      placeDetails = await getPlaceDetails(placeId, apiKey);
    }

    // Step 4: If no details yet, use Text Search
    if (!placeDetails) {
      // Build search query from available data
      let searchQuery = '';

      if (urlPlaceName) {
        searchQuery = urlPlaceName;
      } else if (urlCoordinates) {
        // If we only have coordinates, search with them
        searchQuery = `${urlCoordinates.lat},${urlCoordinates.lng}`;
      }

      if (searchQuery) {
        console.log('[Places API] Searching for:', searchQuery);
        placeDetails = await searchPlace(
          searchQuery,
          apiKey,
          urlCoordinates || undefined
        );
      }
    }

    // Step 5: Return results
    if (!placeDetails) {
      return {
        success: false,
        error: 'Could not find place information. Try a different Google Maps link.',
        apiKeyConfigured: true,
      };
    }

    console.log('[Places API] Successfully extracted place:', placeDetails.name);

    return {
      success: true,
      apiKeyConfigured: true,
      place: {
        name: placeDetails.name,
        address: placeDetails.address,
        lat: placeDetails.lat,
        lng: placeDetails.lng,
        googleMapsUrl: placeDetails.googleMapsUrl || finalUrl,
        placeId: placeDetails.placeId,
        types: placeDetails.types,
        website: placeDetails.website,
        phone: placeDetails.phone,
        rating: placeDetails.rating,
        openingHours: placeDetails.openingHours,
      },
    };
  } catch (error) {
    console.error('[Places API] Error extracting place:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract place data',
      apiKeyConfigured: true,
    };
  }
}

/**
 * Search for a place by text query (for manual place entry)
 *
 * Uses Google Maps Places API Text Search to find a place by name/address.
 * More accurate than Nominatim for finding businesses and POIs.
 *
 * @param query - Place name, address, or both
 * @returns Place data or error
 */
export async function searchPlaceByText(query: string): Promise<ExtractPlaceResult> {
  try {
    if (!query || query.trim().length < 2) {
      return { success: false, error: 'Please enter a place name or address' };
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'Google Maps API key not configured',
        apiKeyConfigured: false,
      };
    }

    console.log('[Places API] Searching for:', query);
    const placeDetails = await searchPlace(query, apiKey);

    if (!placeDetails) {
      return {
        success: false,
        error: 'Could not find a place matching your search. Try being more specific.',
        apiKeyConfigured: true,
      };
    }

    console.log('[Places API] Found place:', placeDetails.name);

    return {
      success: true,
      apiKeyConfigured: true,
      place: {
        name: placeDetails.name,
        address: placeDetails.address,
        lat: placeDetails.lat,
        lng: placeDetails.lng,
        googleMapsUrl: placeDetails.googleMapsUrl || `https://www.google.com/maps/place/?q=place_id:${placeDetails.placeId}`,
        placeId: placeDetails.placeId,
        types: placeDetails.types,
        website: placeDetails.website,
        phone: placeDetails.phone,
        rating: placeDetails.rating,
        openingHours: placeDetails.openingHours,
      },
    };
  } catch (error) {
    console.error('[Places API] Error searching place:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
      apiKeyConfigured: true,
    };
  }
}
