/**
 * Google Maps Places API (New) Client
 *
 * This module provides functions to extract place data using the official
 * Google Maps Places API, which is the authoritative source for place information.
 *
 * API Documentation: https://developers.google.com/maps/documentation/places/web-service
 *
 * Cost considerations (within $200/month free tier):
 * - Text Search (ID only): FREE
 * - Place Details (basic fields): ~$17/1000 requests
 * - Estimated cost for 50-100 places/month: $1-3/month
 */

/**
 * Place details returned from the Places API
 */
export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** Place types from Google (e.g., "restaurant", "cafe") */
  types?: string[];
  /** Google Maps URL for navigation */
  googleMapsUrl?: string;
  /** Business website */
  website?: string;
  /** Phone number */
  phone?: string;
  /** Rating (1-5) */
  rating?: number;
  /** Number of user ratings */
  userRatingsTotal?: number;
  /** Opening hours text */
  openingHours?: string[];
  /** Current open status */
  isOpen?: boolean;
}

/**
 * Extracts Place ID from various Google Maps URL formats
 *
 * Google Maps URLs contain Place IDs in these formats:
 *
 * 1. CID format (most common in shared URLs):
 *    !1s0x487604d5fd2b78e7:0x4e23d97e70e34a16
 *
 * 2. Direct Place ID (ChI... format):
 *    place_id:ChIJN1t_tDeuEmsRUsoyG83frY4
 *    query_place_id=ChIJc2nSALkEdkgRkuoJJBfzkUI
 *    /place/?q=place_id:ChI...
 *
 * 3. Feature ID in data parameter:
 *    data=!4m...!3m...!1sChI...
 *
 * @param url - Google Maps URL
 * @returns Place ID string or null if not found
 */
export function extractPlaceIdFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Pattern 1: CID format - !1s0x...:0x...
    // This is a hex-encoded place identifier
    const cidMatch = url.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i);
    if (cidMatch) {
      // CID format needs to be converted to a Place ID via API
      // For now, return it prefixed so we know to handle it differently
      return `cid:${cidMatch[1]}`;
    }

    // Pattern 2: Direct Place ID - ChI... format (alphanumeric, typically 27 chars)
    // Can appear in various URL parameters
    const placeIdPatterns = [
      /place_id[=:]([A-Za-z0-9_-]+)/i,
      /query_place_id=([A-Za-z0-9_-]+)/i,
      /!1s(ChI[A-Za-z0-9_-]+)/i,
      /ftid=(0x[0-9a-f]+:0x[0-9a-f]+)/i,
    ];

    for (const pattern of placeIdPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        // Handle ftid format (same as CID)
        if (match[1].startsWith('0x')) {
          return `cid:${match[1]}`;
        }
        return match[1];
      }
    }

    // Pattern 3: Look for ChI... anywhere in the data parameter
    // Sometimes it's deeply nested in the encoded data
    const dataMatch = url.match(/data=[^&]+/);
    if (dataMatch) {
      const chiMatch = dataMatch[0].match(/ChI[A-Za-z0-9_-]{20,}/);
      if (chiMatch) {
        return chiMatch[0];
      }
    }

    return null;
  } catch (error) {
    console.error('[Places API] Error extracting Place ID:', error);
    return null;
  }
}

/**
 * Extracts place name from Google Maps URL path
 *
 * URLs often have format: /place/Place+Name/@lat,lng
 *
 * @param url - Google Maps URL
 * @returns Place name or null
 */
export function extractPlaceNameFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const placeMatch = url.match(/\/place\/([^/@]+)/);
    if (placeMatch && placeMatch[1]) {
      // Decode URL encoding
      const decoded = decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim();
      // Skip if it's just numbers or very short
      if (decoded.length >= 2 && !/^\d+$/.test(decoded)) {
        return decoded;
      }
    }
    return null;
  } catch (error) {
    console.error('[Places API] Error extracting place name:', error);
    return null;
  }
}

/**
 * Fetches place details from Google Maps Places API (New)
 *
 * Uses the Place Details endpoint with field masking to minimize costs.
 *
 * @param placeId - Google Place ID (ChI... format or cid:0x... format)
 * @param apiKey - Google Maps API key
 * @returns Place details or null if request fails
 */
export async function getPlaceDetails(
  placeId: string,
  apiKey: string
): Promise<PlaceDetails | null> {
  try {
    // Handle CID format - need to use a different approach
    if (placeId.startsWith('cid:')) {
      console.log('[Places API] CID format detected, using search fallback');
      // CID format can't be used directly with Place Details API
      // We'll need to search for it instead
      return null;
    }

    // Field mask to request only what we need (controls billing)
    // Basic fields: id, displayName, formattedAddress, location
    // Contact fields: websiteUri, nationalPhoneNumber
    // Atmosphere fields: rating, userRatingCount
    const fieldMask = [
      'id',
      'displayName',
      'formattedAddress',
      'location',
      'types',
      'websiteUri',
      'nationalPhoneNumber',
      'rating',
      'userRatingCount',
      'regularOpeningHours',
      'currentOpeningHours',
      'googleMapsUri',
    ].join(',');

    const url = `https://places.googleapis.com/v1/places/${placeId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Places API] Place Details error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    return parseGooglePlaceResponse(data, placeId);
  } catch (error) {
    console.error('[Places API] Error fetching place details:', error);
    return null;
  }
}

/**
 * Searches for a place using Google Maps Places API Text Search
 *
 * Use this when:
 * 1. No Place ID is available in the URL
 * 2. CID format Place ID can't be resolved
 *
 * @param query - Search query (place name, address, or both)
 * @param apiKey - Google Maps API key
 * @param locationBias - Optional coordinates to bias results
 * @returns Place details or null if not found
 */
export async function searchPlace(
  query: string,
  apiKey: string,
  locationBias?: { lat: number; lng: number }
): Promise<PlaceDetails | null> {
  try {
    if (!query || query.trim().length < 2) {
      return null;
    }

    const url = 'https://places.googleapis.com/v1/places:searchText';

    // Field mask for search results
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.location',
      'places.types',
      'places.websiteUri',
      'places.nationalPhoneNumber',
      'places.rating',
      'places.userRatingCount',
      'places.regularOpeningHours',
      'places.googleMapsUri',
    ].join(',');

    const requestBody: {
      textQuery: string;
      maxResultCount: number;
      locationBias?: {
        circle: {
          center: { latitude: number; longitude: number };
          radius: number;
        };
      };
    } = {
      textQuery: query,
      maxResultCount: 1, // We only need the best match
    };

    // Add location bias if provided
    if (locationBias) {
      requestBody.locationBias = {
        circle: {
          center: {
            latitude: locationBias.lat,
            longitude: locationBias.lng,
          },
          radius: 5000, // 5km radius
        },
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Places API] Text Search error:', response.status, errorText);
      return null;
    }

    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      console.log('[Places API] No results found for query:', query);
      return null;
    }

    // Return the first (best) result
    const place = data.places[0];
    return parseGooglePlaceResponse(place, place.id);
  } catch (error) {
    console.error('[Places API] Error searching for place:', error);
    return null;
  }
}

/**
 * Parses Google Places API response into our PlaceDetails format
 */
function parseGooglePlaceResponse(data: Record<string, unknown>, placeId: string): PlaceDetails | null {
  try {
    const location = data.location as { latitude?: number; longitude?: number } | undefined;
    const displayName = data.displayName as { text?: string } | undefined;

    if (!location?.latitude || !location?.longitude) {
      console.error('[Places API] Missing location data in response');
      return null;
    }

    const result: PlaceDetails = {
      placeId: placeId,
      name: displayName?.text || 'Unknown Place',
      address: (data.formattedAddress as string) || 'Address not available',
      lat: location.latitude,
      lng: location.longitude,
    };

    // Optional fields
    if (data.types) {
      result.types = data.types as string[];
    }

    if (data.googleMapsUri) {
      result.googleMapsUrl = data.googleMapsUri as string;
    }

    if (data.websiteUri) {
      result.website = data.websiteUri as string;
    }

    if (data.nationalPhoneNumber) {
      result.phone = data.nationalPhoneNumber as string;
    }

    if (typeof data.rating === 'number') {
      result.rating = data.rating;
    }

    if (typeof data.userRatingCount === 'number') {
      result.userRatingsTotal = data.userRatingCount;
    }

    // Parse opening hours
    const regularOpeningHours = data.regularOpeningHours as {
      weekdayDescriptions?: string[];
      openNow?: boolean;
    } | undefined;
    const currentOpeningHours = data.currentOpeningHours as {
      openNow?: boolean;
    } | undefined;

    if (regularOpeningHours?.weekdayDescriptions) {
      result.openingHours = regularOpeningHours.weekdayDescriptions;
    }

    if (currentOpeningHours?.openNow !== undefined) {
      result.isOpen = currentOpeningHours.openNow;
    } else if (regularOpeningHours?.openNow !== undefined) {
      result.isOpen = regularOpeningHours.openNow;
    }

    return result;
  } catch (error) {
    console.error('[Places API] Error parsing response:', error);
    return null;
  }
}

/**
 * Extracts approximate coordinates from Google Maps URL
 *
 * Used as a location bias for text search when Place ID isn't available.
 * These may be viewport coordinates, not exact place coordinates.
 *
 * @param url - Google Maps URL
 * @returns Coordinates or null
 */
export function extractCoordinatesFromUrl(url: string): { lat: number; lng: number } | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Try multiple patterns
    const patterns = [
      // /@lat,lng pattern (most common)
      /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      // !3d!4d pattern in data parameter
      /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
      // ?q=lat,lng pattern
      /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      // center=lat,lng pattern
      /[?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (isValidCoordinate(lat, lng)) {
          return { lat, lng };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('[Places API] Error extracting coordinates:', error);
    return null;
  }
}

/**
 * Validates if coordinates are within valid geographic ranges
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
