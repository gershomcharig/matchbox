/**
 * Google Maps URL Detection and Parsing Utilities
 *
 * Handles various Google Maps URL formats:
 * - https://www.google.com/maps/place/...
 * - https://maps.google.com/...
 * - https://goo.gl/maps/...
 * - https://maps.app.goo.gl/...
 * - Shortened URLs and various regional domains
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
 * Type definition for geographic coordinates
 */
export interface Coordinates {
  lat: number;
  lng: number;
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
 * Extracts coordinates from a Google Maps URL
 *
 * Handles various coordinate formats:
 * - /@lat,lng,zoom (e.g., /@51.5007292,-0.1268141,17z)
 * - /place/Name/@lat,lng (e.g., /place/Big+Ben/@51.5007292,-0.1268141)
 * - ?q=lat,lng (e.g., ?q=51.5007,-0.1268)
 * - !3d for latitude and !4d for longitude (e.g., !3d51.5007!4d-0.1268)
 * - ?ll=lat,lng (e.g., ?ll=51.5007,-0.1268)
 *
 * @param url - The Google Maps URL to parse
 * @returns Coordinates object with lat/lng or null if not found
 */
export function extractCoordinatesFromUrl(url: string): Coordinates | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Pattern 1: /@lat,lng format (most common)
    // Example: /@51.5007292,-0.1268141,17z
    const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const atMatch = url.match(atPattern);

    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);

      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // Pattern 2: !3d and !4d format
    // Example: !3d51.5007292!4d-0.1268141
    const bangPattern = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/;
    const bangMatch = url.match(bangPattern);

    if (bangMatch) {
      const lat = parseFloat(bangMatch[1]);
      const lng = parseFloat(bangMatch[2]);

      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // Pattern 3: ?q=lat,lng format
    // Example: ?q=51.5007,-0.1268
    const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const qMatch = url.match(qPattern);

    if (qMatch) {
      const lat = parseFloat(qMatch[1]);
      const lng = parseFloat(qMatch[2]);

      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // Pattern 4: ?ll=lat,lng format (less common)
    // Example: ?ll=51.5007,-0.1268
    const llPattern = /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const llMatch = url.match(llPattern);

    if (llMatch) {
      const lat = parseFloat(llMatch[1]);
      const lng = parseFloat(llMatch[2]);

      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // Pattern 5: center=lat,lng format
    // Example: ?center=51.5007,-0.1268
    const centerPattern = /[?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const centerMatch = url.match(centerPattern);

    if (centerMatch) {
      const lat = parseFloat(centerMatch[1]);
      const lng = parseFloat(centerMatch[2]);

      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // No coordinates found
    return null;
  } catch (error) {
    console.error('Error extracting coordinates from URL:', error);
    return null;
  }
}

/**
 * Validates if coordinates are within valid geographic ranges
 * @param lat - Latitude value
 * @param lng - Longitude value
 * @returns true if coordinates are valid, false otherwise
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
 * Expands a shortened Google Maps URL by following redirects
 * This needs to be called from the server side due to CORS restrictions
 * @param shortUrl - The shortened URL to expand
 * @returns The expanded URL or null if expansion failed
 */
export async function expandShortenedUrl(shortUrl: string): Promise<string | null> {
  try {
    // Make a HEAD request to follow redirects
    const response = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'follow',
    });

    // The final URL after redirects
    const expandedUrl = response.url;

    // Verify it's a Google Maps URL
    if (isGoogleMapsUrl(expandedUrl)) {
      return expandedUrl;
    }

    return null;
  } catch (error) {
    console.error('Error expanding shortened URL:', error);
    return null;
  }
}

/**
 * Extracts the place name from a Google Maps URL
 *
 * Google Maps URLs often contain the place name in the path:
 * - /place/Big+Ben/@51.5007,-0.1268
 * - /place/Eiffel+Tower,+Paris/@48.8584,2.2945
 * - /place/The+Coffee+House/@...
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

      // Clean up the name:
      // - Remove trailing location info after comma if it looks like an address
      // - e.g., "Big Ben, Westminster" keeps "Big Ben, Westminster"
      // - but "123 Main St, New York, NY 10001" would be kept as-is

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

/**
 * Cleans a place name for better geocoding results
 * 
 * Removes address components, categories, and other noise that might
 * prevent Nominatim from finding a match.
 * 
 * Example:
 * "Lina Stores Soho - Italian Restaurant, 51 Greek St..." -> "Lina Stores Soho"
 * "Noble Rot Soho, 2 Greek St..." -> "Noble Rot Soho"
 * 
 * @param name - The raw place name
 * @returns The cleaned name
 */
export function cleanPlaceNameForGeocoding(name: string): string | null {
  if (!name || typeof name !== 'string') {
    return null;
  }

  let clean = name;

  // 1. Split by comma and take first part (often separates Name from Address)
  if (clean.includes(',')) {
    clean = clean.split(',')[0];
  }

  // 2. Split by " - " (often used for categories like " - Italian Restaurant")
  // carefully to not split hyphenated names
  if (clean.includes(' - ')) {
    clean = clean.split(' - ')[0];
  }

  // 3. Remove trailing " - " or similar if any
  clean = clean.replace(/ - .+$/, '');

  clean = clean.trim();

  return clean.length > 0 ? clean : null;
}
