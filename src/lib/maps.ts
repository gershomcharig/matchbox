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
 * Handles various coordinate formats in priority order:
 * 1. !3d...!4d... (data parameter) - Most reliable for actual place location
 * 2. ?q=lat,lng (query parameter) - Direct coordinate query
 * 3. ?ll=lat,lng - Less common but direct
 * 4. /@lat,lng - Often viewport/camera center, use as fallback
 * 5. ?center= - Viewport center, lowest priority
 *
 * Note: The /@lat,lng format often represents the map VIEWPORT center, not the
 * actual place location. The !3d!4d format in the data parameter is more reliable
 * for the actual place coordinates.
 *
 * For Android-shared URLs, the URL may contain multiple !3d!4d pairs:
 * - Device/user location (where user shared from)
 * - Actual place location
 * - Viewport center
 *
 * We use heuristics to identify the place location:
 * 1. Look for place ID marker (!1s0x...) - coords following this are the place
 * 2. Prefer coords that differ from the viewport (@ coords)
 * 3. Use the LAST !3d!4d pair as fallback (typically the focused place)
 *
 * @param url - The Google Maps URL to parse
 * @returns Coordinates object with lat/lng or null if not found
 */
export function extractCoordinatesFromUrl(url: string): Coordinates | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    console.log('[Coords] Extracting from URL:', url.substring(0, 200) + (url.length > 200 ? '...' : ''));

    // Pattern 1: !3d and !4d format (HIGHEST PRIORITY - actual place location)
    // Example: !3d51.5007292!4d-0.1268141
    // Google Maps uses this format for the actual place coordinates in the data parameter
    const bangPattern = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/g;
    const bangMatches = [...url.matchAll(bangPattern)];

    console.log('[Coords] Found', bangMatches.length, '!3d!4d pairs');

    if (bangMatches.length > 0) {
      // Log all found coordinate pairs for debugging
      bangMatches.forEach((match, i) => {
        console.log(`[Coords]   Pair ${i}: lat=${match[1]}, lng=${match[2]}`);
      });

      // Get @ coordinates (viewport center) for comparison
      const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const atMatch = url.match(atPattern);
      const atCoords = atMatch
        ? { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) }
        : null;

      if (atCoords) {
        console.log('[Coords] Viewport @ coords:', atCoords);
      }

      // Strategy 1: Look for place ID marker (!1s0x...:0x...)
      // Coordinates immediately after a place ID are definitively the place location
      const placeIdPattern = /!1s0x[0-9a-f]+:0x[0-9a-f]+!.*?!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/i;
      const placeIdMatch = url.match(placeIdPattern);
      if (placeIdMatch) {
        const lat = parseFloat(placeIdMatch[1]);
        const lng = parseFloat(placeIdMatch[2]);
        if (isValidCoordinate(lat, lng)) {
          console.log('[Coords] Found coords after place ID:', { lat, lng });
          return { lat, lng };
        }
      }

      // Strategy 2: For URLs with /place/ path, look for coords in data= section
      // Pattern: /place/NAME/data=...!3d!4d
      if (url.includes('/place/')) {
        const dataMatch = url.match(/\/place\/[^/]+\/data=.*?!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
        if (dataMatch) {
          const lat = parseFloat(dataMatch[1]);
          const lng = parseFloat(dataMatch[2]);
          if (isValidCoordinate(lat, lng)) {
            console.log('[Coords] Found coords in /place/ data section:', { lat, lng });
            return { lat, lng };
          }
        }
      }

      // Strategy 3: Find coords that differ significantly from viewport
      // (these are likely the place, not the camera position)
      if (atCoords) {
        for (const bangMatch of bangMatches) {
          const lat = parseFloat(bangMatch[1]);
          const lng = parseFloat(bangMatch[2]);

          if (isValidCoordinate(lat, lng)) {
            const latDiff = Math.abs(lat - atCoords.lat);
            const lngDiff = Math.abs(lng - atCoords.lng);
            // If coords differ by more than 0.0001 (~11m), this is likely the place
            if (latDiff > 0.0001 || lngDiff > 0.0001) {
              console.log('[Coords] Using coords that differ from viewport:', { lat, lng });
              return { lat, lng };
            }
          }
        }
      }

      // Strategy 4: Use the LAST valid !3d!4d pair
      // In Android URLs, the last pair is typically the focused place
      for (let i = bangMatches.length - 1; i >= 0; i--) {
        const lat = parseFloat(bangMatches[i][1]);
        const lng = parseFloat(bangMatches[i][2]);
        if (isValidCoordinate(lat, lng)) {
          console.log('[Coords] Using last !3d!4d pair:', { lat, lng });
          return { lat, lng };
        }
      }
    }

    // Pattern 2: ?q=lat,lng format (direct coordinate query)
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

    // Pattern 3: ?ll=lat,lng format
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

    // Pattern 4: /@lat,lng format (FALLBACK - often viewport center)
    // Example: /@51.5007292,-0.1268141,17z
    // WARNING: This is often the camera/viewport center, not the place location
    const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const atMatch = url.match(atPattern);

    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);

      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // Pattern 5: center=lat,lng format (lowest priority - viewport center)
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
 * Extracts a full place string from URL that may include address
 *
 * Android-shared URLs often have format:
 * /place/Name,+Address,+City+Postcode/data=...
 *
 * This extracts the full string including address for geocoding
 *
 * @param url - The Google Maps URL to parse
 * @returns Object with name and address parts, or null
 */
export function extractPlaceInfoFromUrl(url: string): { name: string; address: string | null } | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Pattern to match /place/PlaceInfo/ in URL
    const placePattern = /\/place\/([^/@]+)/i;
    const match = url.match(placePattern);

    if (match && match[1]) {
      // Decode URL encoding
      const fullString = decodeURIComponent(match[1].replace(/\+/g, ' ')).trim();

      if (fullString.length < 2) {
        return null;
      }

      // Check if it looks like "Name, Address, City Postcode" format
      // by looking for comma followed by something that looks like an address (has numbers)
      const parts = fullString.split(',').map(p => p.trim());

      if (parts.length >= 2) {
        // Check if second part looks like an address (contains numbers)
        const secondPart = parts.slice(1).join(', ');
        if (/\d/.test(secondPart)) {
          // Likely "Name, Address" format
          return {
            name: parts[0],
            address: secondPart,
          };
        }
      }

      // Just a name, no address
      return {
        name: fullString,
        address: null,
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting place info from URL:', error);
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
