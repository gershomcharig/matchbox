'use server';

/**
 * URL Expansion Utilities
 *
 * Simple URL expansion by following HTTP redirects.
 * No more Puppeteer scraping - place data is now handled by Places API.
 */

/**
 * Result from expanding a shortened URL
 */
export interface ExpandedUrlResult {
  success: boolean;
  expandedUrl?: string;
  error?: string;
}

/**
 * Server action to expand shortened Google Maps URLs
 *
 * Simply follows HTTP redirects to get the full URL.
 * Place data extraction is now handled separately by the Places API.
 *
 * @param shortUrl - Shortened URL (maps.app.goo.gl or goo.gl/maps)
 * @returns Expanded URL or error
 */
export async function expandShortenedMapsUrl(
  shortUrl: string
): Promise<ExpandedUrlResult> {
  try {
    // Validate input
    if (!shortUrl || typeof shortUrl !== 'string') {
      return { success: false, error: 'Invalid URL' };
    }

    // Check if it's a shortened URL pattern we handle
    const isShortenedUrl = /^https?:\/\/(goo\.gl\/maps\/|maps\.app\.goo\.gl\/)/i.test(shortUrl);
    if (!isShortenedUrl) {
      // Not a shortened URL, return as-is
      return { success: true, expandedUrl: shortUrl };
    }

    console.log('[URL Expansion] Expanding:', shortUrl);

    // Use HEAD request to follow redirects without downloading body
    const response = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Matchbook/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    let expandedUrl = response.url;

    // If we landed on consent page, extract the continue URL
    if (expandedUrl.includes('consent.google.com')) {
      try {
        const urlObj = new URL(expandedUrl);
        const continueUrl = urlObj.searchParams.get('continue');
        if (continueUrl) {
          console.log('[URL Expansion] Extracted continue URL from consent page');
          expandedUrl = continueUrl;
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Verify it's a Google Maps URL
    const isGoogleMaps = /google\..*\/maps|maps\.google\./i.test(expandedUrl);
    if (!isGoogleMaps) {
      return {
        success: false,
        error: 'Redirect did not lead to Google Maps',
      };
    }

    console.log('[URL Expansion] Expanded to:', expandedUrl.substring(0, 100) + '...');

    return {
      success: true,
      expandedUrl,
    };

  } catch (error) {
    console.error('[URL Expansion] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to expand URL',
    };
  }
}
