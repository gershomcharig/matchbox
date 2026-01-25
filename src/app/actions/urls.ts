'use server';

import { expandAndScrapeGoogleMapsUrl } from '@/lib/google-maps-scraper';

/**
 * Result from expanding a shortened Google Maps URL
 */
export interface ExpandedUrlResult {
  success: boolean;
  expandedUrl?: string;
  /** Place name scraped from Google Maps page */
  scrapedName?: string;
  /** Address scraped from Google Maps page (exact as shown on Google) */
  scrapedAddress?: string;
  /** Phone number if available */
  scrapedPhone?: string;
  /** Website URL if available */
  scrapedWebsite?: string;
  /** Opening hours if available */
  scrapedHours?: string;
  error?: string;
}

/**
 * Fallback: expand URL using fetch (fast, but can't get address)
 */
async function expandUrlWithFetch(shortUrl: string): Promise<ExpandedUrlResult> {
  const response = await fetch(shortUrl, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  const expandedUrl = response.url;
  const isGoogleMaps = /google\..*\/maps|maps\.google\./i.test(expandedUrl);

  if (!isGoogleMaps) {
    return { success: false, error: 'Redirect did not lead to Google Maps' };
  }

  const html = await response.text();

  // Extract name from embedded JS data
  let scrapedName: string | undefined;
  const placeDataMatch = html.match(/\["0x[0-9a-f]+:0x[0-9a-f]+","([^"]+)",null,null/);
  if (placeDataMatch?.[1]) {
    scrapedName = placeDataMatch[1];
  }

  return {
    success: true,
    expandedUrl,
    scrapedName,
  };
}

/**
 * Server action to expand shortened Google Maps URLs and scrape place data
 *
 * Uses Puppeteer to render the page and extract the EXACT address as shown on Google Maps.
 * Falls back to fetch-based extraction if Puppeteer fails.
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

    console.log('[URL Expansion] Expanding with Puppeteer:', shortUrl);

    // Try Puppeteer-based scraping first (gets exact address)
    try {
      const result = await expandAndScrapeGoogleMapsUrl(shortUrl);

      if (result.success && result.expandedUrl) {
        console.log('[URL Expansion] Puppeteer success:', {
          name: result.data?.name,
          address: result.data?.address
        });

        return {
          success: true,
          expandedUrl: result.expandedUrl,
          scrapedName: result.data?.name || undefined,
          scrapedAddress: result.data?.address || undefined,
          scrapedPhone: result.data?.phone,
          scrapedWebsite: result.data?.website,
          scrapedHours: result.data?.openingHours,
        };
      }
    } catch (puppeteerError) {
      console.warn('[URL Expansion] Puppeteer failed, falling back to fetch:', puppeteerError);
    }

    // Fallback to fetch-based approach (faster, but no address)
    console.log('[URL Expansion] Using fetch fallback');
    return await expandUrlWithFetch(shortUrl);

  } catch (error) {
    console.error('[URL Expansion] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to expand URL',
    };
  }
}

/**
 * Scrape place data from a full Google Maps URL
 * Use this for non-shortened URLs when you want exact address data
 */
export async function scrapeGoogleMapsUrl(mapsUrl: string): Promise<ExpandedUrlResult> {
  try {
    if (!mapsUrl || typeof mapsUrl !== 'string') {
      return { success: false, error: 'Invalid URL' };
    }

    console.log('[Scraper] Scraping full URL:', mapsUrl);

    const result = await expandAndScrapeGoogleMapsUrl(mapsUrl);

    if (result.success) {
      return {
        success: true,
        expandedUrl: result.expandedUrl,
        scrapedName: result.data?.name || undefined,
        scrapedAddress: result.data?.address || undefined,
        scrapedPhone: result.data?.phone,
        scrapedWebsite: result.data?.website,
        scrapedHours: result.data?.openingHours,
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to scrape page',
    };

  } catch (error) {
    console.error('[Scraper] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scrape URL',
    };
  }
}
