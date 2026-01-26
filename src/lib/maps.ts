/**
 * Google Maps URL Detection Utilities
 *
 * Handles detection and extraction of Google Maps URLs from text.
 * Place data extraction is now handled by the Places API (see google-places.ts).
 *
 * Supported URL formats:
 * - https://www.google.com/maps/place/...
 * - https://maps.google.com/...
 * - https://goo.gl/maps/...
 * - https://maps.app.goo.gl/...
 * - Various regional domains
 */

/**
 * Detects if a given text contains a Google Maps URL
 * @param text - The text to check
 * @returns true if text contains a Google Maps URL, false otherwise
 */
export function isGoogleMapsUrl(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // Trim whitespace
  const trimmedText = text.trim();

  // Patterns to match various Google Maps URL formats
  const patterns = [
    // Standard Google Maps URLs
    /(?:https?:\/\/)?(?:www\.)?google\.(?:com|[a-z]{2,3}(?:\.[a-z]{2})?)\/maps/i,

    // maps.google.com domain
    /(?:https?:\/\/)?maps\.google\.(?:com|[a-z]{2,3}(?:\.[a-z]{2})?)/i,

    // Shortened goo.gl/maps URLs
    /(?:https?:\/\/)?goo\.gl\/maps\//i,

    // New maps.app.goo.gl format
    /(?:https?:\/\/)?maps\.app\.goo\.gl\//i,
  ];

  // Check if any pattern matches
  return patterns.some((pattern) => pattern.test(trimmedText));
}

/**
 * Extracts the first Google Maps URL from text
 * @param text - The text to extract from
 * @returns The extracted URL or null if not found
 */
export function extractGoogleMapsUrl(text: string): string | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // More comprehensive URL extraction pattern
  const urlPattern = /(?:https?:\/\/)?(?:(?:www\.)?google\.(?:com|[a-z]{2,3}(?:\.[a-z]{2})?)\/maps[^\s]*|maps\.google\.(?:com|[a-z]{2,3}(?:\.[a-z]{2})?)[^\s]*|goo\.gl\/maps\/[^\s]*|maps\.app\.goo\.gl\/[^\s]*)/i;

  const match = text.match(urlPattern);

  if (match) {
    let url = match[0];

    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    return url;
  }

  return null;
}

/**
 * Type definition for Maps URL detection result
 */
export interface MapsUrlDetectionResult {
  isValid: boolean;
  url: string | null;
  originalText: string;
}

/**
 * Analyzes text and returns detailed Maps URL detection result
 * @param text - The text to analyze
 * @returns Detection result with validation status and extracted URL
 */
export function detectMapsUrl(text: string): MapsUrlDetectionResult {
  const isValid = isGoogleMapsUrl(text);
  const url = isValid ? extractGoogleMapsUrl(text) : null;

  return {
    isValid,
    url,
    originalText: text,
  };
}

/**
 * Checks if a URL is a shortened Google Maps URL that needs expansion
 * @param url - The URL to check
 * @returns true if URL needs expansion, false otherwise
 */
export function isShortenedMapsUrl(url: string): boolean {
  if (!url) return false;
  return /^https?:\/\/(goo\.gl\/maps\/|maps\.app\.goo\.gl\/)/i.test(url);
}

/**
 * Extracts the place name from a Google Maps URL
 *
 * Google Maps URLs often contain the place name in the path:
 * - /place/Big+Ben/@51.5007,-0.1268
 * - /place/Eiffel+Tower,+Paris/@48.8584,2.2945
 * - /place/The+Coffee+House/@...
 *
 * Note: This is used for display purposes. For accurate place data,
 * use the Places API functions in google-places.ts.
 *
 * @param url - The Google Maps URL to parse
 * @returns The extracted place name or null if not found
 */
export function extractPlaceNameFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Pattern to match /place/PlaceName/ in URL
    // The place name is URL-encoded and ends at /@ or the next /
    const placePattern = /\/place\/([^/@]+)/i;
    const match = url.match(placePattern);

    if (match && match[1]) {
      // Decode URL encoding (+ becomes space, %20 becomes space, etc.)
      let placeName = decodeURIComponent(match[1].replace(/\+/g, ' '));

      // Trim whitespace
      placeName = placeName.trim();

      // If the name is just numbers or very short, it's probably not a real name
      if (placeName.length < 2 || /^\d+$/.test(placeName)) {
        return null;
      }

      return placeName;
    }

    return null;
  } catch (error) {
    console.error('Error extracting place name from URL:', error);
    return null;
  }
}
