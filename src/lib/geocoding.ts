/**
 * Geocoding utilities using OpenStreetMap Nominatim API
 *
 * This module provides:
 * - forwardGeocode(): Convert address string to coordinates (for manual place entry)
 * - smartGeocode(): Smart geocoding that prefers scraped Google Maps data
 *
 * Note: Reverse geocoding is no longer needed as Puppeteer scrapes exact addresses
 * from Google Maps pages.
 *
 * Nominatim is a free geocoding service provided by OpenStreetMap.
 * Usage Policy: https://operations.osmfoundation.org/policies/nominatim/
 * - Maximum 1 request per second
 * - Must include valid User-Agent header
 */

import type { Coordinates } from './maps';
import { cleanPlaceNameForGeocoding } from './maps';

/**
 * Place information returned from geocoding
 *
 * Extended fields (rating, openingHours, website, phone) are optional
 * and will typically be added manually by users in Phase 7.
 * These cannot be reliably extracted from free APIs.
 */
export interface PlaceInfo {
  name: string;
  address: string;
  displayName: string;
  lat: number;
  lng: number;
  placeType?: string;
  city?: string;
  country?: string;
  // Extended fields - user-provided in Phase 7 (Edit Place)
  // These cannot be reliably extracted without paid APIs (Google Places)
  rating?: number; // 1-5 scale
  openingHours?: string; // Free-form text for hours
  website?: string;
  phone?: string;
  // Source tracking
  googleMapsUrl?: string; // Original URL if pasted from Google Maps
  urlExtractedName?: string; // Name extracted from Google Maps URL (may differ from geocoded name)
}

/**
 * Nominatim API response structure (simplified)
 */
interface NominatimResponse {
  display_name: string;
  name?: string;
  address?: {
    amenity?: string;
    building?: string;
    shop?: string;
    tourism?: string;
    restaurant?: string;
    cafe?: string;
    pub?: string;
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  type?: string;
  lat: string;
  lon: string;
}

/**
 * Forward geocodes an address string to get coordinates
 *
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 * Rate limit: 1 request per second
 *
 * @param address - The address string to geocode
 * @returns Coordinates and place info or null if geocoding fails
 */
export async function forwardGeocode(
  address: string
): Promise<PlaceInfo | null> {
  try {
    // Nominatim search endpoint
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', address);
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '1'); // Only get the best result

    // Make request with proper headers
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Matchbook/1.0 (Personal place organizer)',
      },
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status, response.statusText);
      return null;
    }

    const data: NominatimResponse[] = await response.json();

    if (!data || data.length === 0) {
      console.warn('No geocoding results found for address:', address);
      return null;
    }

    const result = data[0];

    // Extract place name
    const name =
      result.name ||
      result.address?.amenity ||
      result.address?.building ||
      address.split(',')[0].trim();

    // Build formatted address
    const addressParts: string[] = [];

    if (result.address) {
      const addr = result.address;

      if (addr.house_number && addr.road) {
        addressParts.push(`${addr.house_number} ${addr.road}`);
      } else if (addr.road) {
        addressParts.push(addr.road);
      }

      if (addr.suburb) {
        addressParts.push(addr.suburb);
      }

      const locality = addr.city || addr.town || addr.village;
      if (locality) {
        addressParts.push(locality);
      }

      if (addr.postcode) {
        addressParts.push(addr.postcode);
      }

      if (addr.country) {
        addressParts.push(addr.country);
      }
    }

    const formattedAddress =
      addressParts.length > 0 ? addressParts.join(', ') : result.display_name;

    return {
      name,
      address: formattedAddress,
      displayName: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      placeType: result.type,
      city: result.address?.city || result.address?.town || result.address?.village,
      country: result.address?.country,
    };
  } catch (error) {
    console.error('Error forward geocoding:', error);
    return null;
  }
}

/**
 * Result from smart geocoding
 */
export interface SmartGeocodeResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  source: 'url_coords' | 'forward_geocode';
  /** Additional place info from geocoding */
  placeInfo?: PlaceInfo;
}

/**
 * Options for smart geocoding
 */
export interface SmartGeocodeOptions {
  /** Place name extracted from the URL (e.g., from /place/...) */
  urlPlaceName: string | null;
  /** Coordinates extracted from the URL */
  extractedCoordinates: Coordinates | null;
  /** The original Google Maps URL */
  googleMapsUrl: string;
  /** Place name scraped from Google Maps HTML (more accurate than URL path) */
  scrapedName?: string;
  /** Address scraped from Google Maps HTML (more accurate than Nominatim) */
  scrapedAddress?: string;
}

/**
 * Smart geocoding that uses URL coordinates when available
 *
 * Strategy (simplified - always trust Google Maps URL coordinates):
 * 1. If we have coordinates from URL: Use them (they're accurate from Google Maps)
 *    - Reverse geocode to get the address
 *    - Use URL place name if available (more accurate than geocoded name)
 * 2. If we have ONLY place name: Forward geocode it
 * 3. If neither: Return null
 *
 * Key insight: Google Maps URLs always contain accurate coordinates for the
 * specific place. Forward geocoding a place name can find the wrong location
 * (e.g., "Artusi" in Seattle instead of London).
 *
 * @param options - Geocoding options including place name and coordinates
 * @returns Geocoding result with coordinates, or null if failed
 */
export async function smartGeocode(
  options: SmartGeocodeOptions
): Promise<SmartGeocodeResult | null> {
  const { urlPlaceName, extractedCoordinates, scrapedName, scrapedAddress } = options;

  // Case 1: We have coordinates - always use them (they're from Google Maps, so accurate)
  if (extractedCoordinates) {
    console.log('[smartGeocode] Have coords from URL, using them directly');

    const placeName = scrapedName || urlPlaceName || 'Unknown Place';
    const address = scrapedAddress || 'Address not available';

    if (scrapedAddress) {
      console.log('[smartGeocode] Using scraped address from Google Maps:', scrapedAddress);
    } else {
      console.log('[smartGeocode] No scraped address available');
    }

    return {
      name: placeName,
      address: address,
      lat: extractedCoordinates.lat,
      lng: extractedCoordinates.lng,
      source: 'url_coords',
      placeInfo: {
        name: placeName,
        address: address,
        displayName: `${placeName}, ${address}`,
        lat: extractedCoordinates.lat,
        lng: extractedCoordinates.lng,
      },
    };
  }

  // Case 2: No coordinates, only place name - forward geocode
  if (urlPlaceName) {
    console.log('[smartGeocode] Have only name, forward geocoding...');

    let forwardResult = await forwardGeocode(urlPlaceName);

    // If fails, try cleaned name
    if (!forwardResult) {
      const cleanedName = cleanPlaceNameForGeocoding(urlPlaceName);
      if (cleanedName && cleanedName !== urlPlaceName) {
        console.log('[smartGeocode] Trying cleaned name:', cleanedName);
        forwardResult = await forwardGeocode(cleanedName);
      }
    }

    if (forwardResult) {
      return {
        name: urlPlaceName,
        address: forwardResult.address,
        lat: forwardResult.lat,
        lng: forwardResult.lng,
        source: 'forward_geocode',
        placeInfo: forwardResult,
      };
    }

    // Forward geocode failed
    return null;
  }

  // Case 3: Neither name nor coordinates - return null
  console.log('[smartGeocode] No name or coords available');
  return null;
}
