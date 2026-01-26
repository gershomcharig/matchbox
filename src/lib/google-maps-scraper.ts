import puppeteer, { Browser, Page } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

/**
 * Scraped data from a Google Maps place page
 */
export interface ScrapedPlaceData {
  name: string | null;
  address: string | null;
  rating?: string;
  priceLevel?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
}

// Singleton browser instance for reuse
let browserInstance: Browser | null = null;
let browserLastUsed = 0;
const BROWSER_TIMEOUT = 60000; // Close browser after 1 minute of inactivity

async function getBrowser(): Promise<Browser> {
  browserLastUsed = Date.now();

  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Vercel serverless: use @sparticuz/chromium
    browserInstance = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    // Local development: use system Chrome
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
      executablePath: process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : process.platform === 'win32'
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : '/usr/bin/google-chrome',
    });
  }

  // Auto-close browser after inactivity
  const checkAndClose = () => {
    if (Date.now() - browserLastUsed > BROWSER_TIMEOUT && browserInstance?.connected) {
      browserInstance.close().catch(() => {});
      browserInstance = null;
    } else if (browserInstance?.connected) {
      setTimeout(checkAndClose, 10000);
    }
  };
  setTimeout(checkAndClose, BROWSER_TIMEOUT);

  return browserInstance;
}

/**
 * Handle Google consent page if we land on it
 * Uses multiple strategies to bypass consent
 */
async function handleConsentPage(page: Page): Promise<boolean> {
  const url = page.url();

  // Check if we're on consent page
  const isConsentUrl = url.includes('consent.google.com');

  if (!isConsentUrl) {
    return false;
  }

  console.log('[Scraper] On consent page, attempting to bypass...');

  try {
    // Strategy 1: Click any "Accept all" or similar button
    const clicked = await page.evaluate(() => {
      // Look for buttons by various attributes
      const selectors = [
        'button[aria-label*="Accept all"]',
        'button[aria-label*="Accept"]',
        'button[aria-label*="Agree"]',
        'button[jsname]', // Google buttons often have jsname attribute
        'form button',
        'button',
      ];

      for (const selector of selectors) {
        const buttons = document.querySelectorAll(selector);
        for (const btn of buttons) {
          const text = (btn.textContent || '').toLowerCase();
          const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();

          // Look for accept/agree language
          if (text.includes('accept') || text.includes('agree') ||
              text.includes('i agree') || text.includes('continue') ||
              ariaLabel.includes('accept') || ariaLabel.includes('agree')) {
            (btn as HTMLElement).click();
            return true;
          }
        }
      }

      // Last resort: click any submit button
      const submitBtns = document.querySelectorAll('button[type="submit"], input[type="submit"]');
      if (submitBtns.length > 0) {
        (submitBtns[0] as HTMLElement).click();
        return true;
      }

      return false;
    });

    if (clicked) {
      console.log('[Scraper] Clicked consent button, waiting for navigation...');
      // Wait for navigation to complete
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
        new Promise(r => setTimeout(r, 5000)), // Fallback timeout
      ]).catch(() => {});

      // Check if we're still on consent page
      const newUrl = page.url();
      if (!newUrl.includes('consent.google.com')) {
        console.log('[Scraper] Successfully bypassed consent page');
        return true;
      }
    }

    // Strategy 2: Try to extract the continue URL and navigate directly
    console.log('[Scraper] Trying to extract continue URL from consent page...');
    const continueUrl = await page.evaluate(() => {
      // Look for the continue URL in the page
      const links = document.querySelectorAll('a[href*="continue="]');
      if (links.length > 0) {
        return (links[0] as HTMLAnchorElement).href;
      }
      return null;
    });

    if (continueUrl) {
      // Parse the continue URL from the consent URL
      const urlParams = new URL(url).searchParams;
      const continueParam = urlParams.get('continue');
      if (continueParam) {
        console.log('[Scraper] Navigating directly to continue URL');
        await page.goto(continueParam, { waitUntil: 'networkidle2', timeout: 30000 });
        return true;
      }
    }

    console.log('[Scraper] Could not bypass consent page');
    return false;
  } catch (error) {
    console.log('[Scraper] Consent handling error:', error);
    return false;
  }
}

/**
 * Scrape place data from a Google Maps URL using Puppeteer
 *
 * @param mapsUrl - A Google Maps URL (can be shortened or full)
 * @returns Scraped place data including exact name and address
 */
export async function scrapeGoogleMapsPlace(mapsUrl: string): Promise<ScrapedPlaceData> {
  console.log('[Scraper] Scraping:', mapsUrl);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set consent cookie to try to bypass consent page
    await page.setCookie({
      name: 'CONSENT',
      value: 'YES+cb.20210720-07-p0.en+FX+410',
      domain: '.google.com',
    });

    // Set realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate to the URL
    await page.goto(mapsUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Handle consent page if needed
    const wasConsentPage = await handleConsentPage(page);
    if (wasConsentPage) {
      // Give the page time to load after consent
      await new Promise(r => setTimeout(r, 2000));
    }

    // Wait for content to load
    await page.waitForSelector('h1', { timeout: 10000 }).catch(() => {});

    // Increased wait time from 1.5s to 2.5s for more dynamic content to load
    await new Promise(r => setTimeout(r, 2500));

    // Try to wait specifically for address element (with timeout)
    await page.waitForSelector('button[data-item-id="address"], [data-item-id="address"], div[data-section-id="ad"] button', {
      timeout: 3000
    }).catch(() => {
      console.log('[Scraper] Address selector not found within timeout, continuing...');
    });

    // Log the final URL for debugging
    const finalUrl = page.url();
    console.log('[Scraper] Final URL after load:', finalUrl);

    // Extract place data with fallback selectors
    const data = await page.evaluate((): ScrapedPlaceData => {
      const result: ScrapedPlaceData = {
        name: null,
        address: null,
      };

      // Get place name from h1
      const h1 = document.querySelector('h1');
      if (h1) {
        result.name = h1.textContent?.trim() || null;
      }

      // Get address using multiple fallback selectors
      const addressSelectors = [
        'button[data-item-id="address"]',         // Primary selector
        '[data-item-id="address"]',               // Any element with this data attribute
        'div[data-section-id="ad"] button',       // Address section button
        'button[aria-label*="Address"]',          // Button with Address in aria-label
        'button[aria-label*="address"]',          // Lowercase variant
        '[data-tooltip*="address" i]',            // Element with address tooltip
      ];

      for (const selector of addressSelectors) {
        try {
          const addressEl = document.querySelector(selector);
          if (addressEl) {
            const text = addressEl.textContent?.trim();
            // Validate it looks like an address (has numbers or common address words)
            if (text && (
              /\d/.test(text) ||                    // Contains numbers
              /street|road|lane|ave|blvd/i.test(text) ||  // Common road words
              /,/.test(text)                        // Contains comma (city, state)
            )) {
              result.address = text;
              console.log('[Scraper] Address found via:', selector);
              break;
            }
          }
        } catch {
          // Selector syntax error, skip
        }
      }

      // Fallback: Extract address from aria-label on the address section
      if (!result.address) {
        const allButtons = document.querySelectorAll('button[aria-label]');
        for (const btn of allButtons) {
          const label = btn.getAttribute('aria-label') || '';
          // Look for labels that contain "Address:" prefix
          if (label.toLowerCase().includes('address:')) {
            const addressPart = label.replace(/^address:\s*/i, '').trim();
            if (addressPart) {
              result.address = addressPart;
              console.log('[Scraper] Address found via aria-label');
              break;
            }
          }
        }
      }

      // Get rating
      const ratingSpan = document.querySelector('span[aria-hidden="true"]');
      if (ratingSpan && /^\d\.\d$/.test(ratingSpan.textContent?.trim() || '')) {
        result.rating = ratingSpan.textContent?.trim();
      }

      // Get phone
      const phoneBtn = document.querySelector('button[data-item-id^="phone"]');
      if (phoneBtn) {
        result.phone = phoneBtn.textContent?.trim() || undefined;
      }

      // Get website
      const websiteLink = document.querySelector('a[data-item-id="authority"]');
      if (websiteLink) {
        result.website = websiteLink.getAttribute('href') || undefined;
      }

      // Get opening hours from the hours button
      const hoursBtn = document.querySelector('button[data-item-id^="oh"]');
      if (hoursBtn) {
        const hoursText = hoursBtn.textContent?.trim();
        if (hoursText) {
          result.openingHours = hoursText;
        }
      }

      return result;
    });

    // If address is still null, try to extract from URL path as final fallback
    if (!data.address && finalUrl.includes('/place/')) {
      const placeMatch = finalUrl.match(/\/place\/([^/@]+)/);
      if (placeMatch) {
        try {
          const urlAddress = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
          // Only use if it looks like an address (has number or comma)
          if (/\d/.test(urlAddress) || urlAddress.includes(',')) {
            data.address = urlAddress;
            console.log('[Scraper] Address extracted from URL path:', urlAddress);
          }
        } catch {
          // Decode error, ignore
        }
      }
    }

    console.log('[Scraper] Extracted:', data);
    return data;

  } finally {
    await page.close();
  }
}

/**
 * Expand a shortened Google Maps URL and scrape place data
 *
 * @param shortUrl - A shortened Google Maps URL (maps.app.goo.gl or goo.gl/maps)
 * @returns Object containing expanded URL and scraped place data
 */
export async function expandAndScrapeGoogleMapsUrl(shortUrl: string): Promise<{
  success: boolean;
  expandedUrl?: string;
  data?: ScrapedPlaceData;
  error?: string;
}> {
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      // Set consent cookie
      await page.setCookie({
        name: 'CONSENT',
        value: 'YES+cb.20210720-07-p0.en+FX+410',
        domain: '.google.com',
      });

      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Navigate - this will follow redirects
      await page.goto(shortUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Get the URL (might be consent page)
      let expandedUrl = page.url();
      console.log('[Scraper] Initial URL after redirect:', expandedUrl);

      // If we landed on consent page, extract the actual maps URL from the continue parameter
      if (expandedUrl.includes('consent.google.com')) {
        try {
          const urlObj = new URL(expandedUrl);
          const continueUrl = urlObj.searchParams.get('continue');
          if (continueUrl) {
            console.log('[Scraper] Extracted continue URL from consent page');
            // Try to navigate directly to the continue URL
            await page.goto(continueUrl, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {
              console.log('[Scraper] Direct navigation failed, will use consent page URL');
            });
            expandedUrl = page.url();

            // If still on consent, at least use the continue URL for parsing
            if (expandedUrl.includes('consent.google.com')) {
              expandedUrl = continueUrl;
            }
          }
        } catch (e) {
          console.log('[Scraper] Failed to parse consent URL:', e);
        }
      }

      // Handle consent if we're still on it
      if (expandedUrl.includes('consent.google.com')) {
        await handleConsentPage(page);
        expandedUrl = page.url();
      }

      console.log('[Scraper] Final expanded URL:', expandedUrl);

      // Verify it's a Google Maps URL
      if (!expandedUrl.includes('google.com/maps') && !expandedUrl.includes('maps.google')) {
        return {
          success: false,
          error: 'Redirect did not lead to Google Maps'
        };
      }

      // Wait for content
      await page.waitForSelector('h1', { timeout: 10000 }).catch(() => {});

      // Increased wait time from 1.5s to 2.5s for more dynamic content to load
      await new Promise(r => setTimeout(r, 2500));

      // Try to wait specifically for address element (with timeout)
      await page.waitForSelector('button[data-item-id="address"], [data-item-id="address"], div[data-section-id="ad"] button', {
        timeout: 3000
      }).catch(() => {
        console.log('[Scraper] Address selector not found within timeout, continuing...');
      });

      // Extract data with fallback selectors
      const data = await page.evaluate((): ScrapedPlaceData => {
        const result: ScrapedPlaceData = {
          name: null,
          address: null,
        };

        const h1 = document.querySelector('h1');
        if (h1) {
          result.name = h1.textContent?.trim() || null;
        }

        // Get address using multiple fallback selectors
        const addressSelectors = [
          'button[data-item-id="address"]',         // Primary selector
          '[data-item-id="address"]',               // Any element with this data attribute
          'div[data-section-id="ad"] button',       // Address section button
          'button[aria-label*="Address"]',          // Button with Address in aria-label
          'button[aria-label*="address"]',          // Lowercase variant
        ];

        for (const selector of addressSelectors) {
          try {
            const addressEl = document.querySelector(selector);
            if (addressEl) {
              const text = addressEl.textContent?.trim();
              // Validate it looks like an address (has numbers or common address words)
              if (text && (
                /\d/.test(text) ||                    // Contains numbers
                /street|road|lane|ave|blvd/i.test(text) ||  // Common road words
                /,/.test(text)                        // Contains comma (city, state)
              )) {
                result.address = text;
                break;
              }
            }
          } catch {
            // Selector syntax error, skip
          }
        }

        // Fallback: Extract address from aria-label on buttons
        if (!result.address) {
          const allButtons = document.querySelectorAll('button[aria-label]');
          for (const btn of allButtons) {
            const label = btn.getAttribute('aria-label') || '';
            if (label.toLowerCase().includes('address:')) {
              const addressPart = label.replace(/^address:\s*/i, '').trim();
              if (addressPart) {
                result.address = addressPart;
                break;
              }
            }
          }
        }

        // Get phone
        const phoneBtn = document.querySelector('button[data-item-id^="phone"]');
        if (phoneBtn) {
          result.phone = phoneBtn.textContent?.trim() || undefined;
        }

        // Get website
        const websiteLink = document.querySelector('a[data-item-id="authority"]');
        if (websiteLink) {
          result.website = websiteLink.getAttribute('href') || undefined;
        }

        // Get opening hours
        const hoursBtn = document.querySelector('button[data-item-id^="oh"]');
        if (hoursBtn) {
          result.openingHours = hoursBtn.textContent?.trim() || undefined;
        }

        return result;
      });

      // If address is still null, try to extract from URL path as final fallback
      if (!data.address && expandedUrl.includes('/place/')) {
        const placeMatch = expandedUrl.match(/\/place\/([^/@]+)/);
        if (placeMatch) {
          try {
            const urlAddress = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
            // Only use if it looks like an address (has number or comma)
            if (/\d/.test(urlAddress) || urlAddress.includes(',')) {
              data.address = urlAddress;
              console.log('[Scraper] Address extracted from URL path:', urlAddress);
            }
          } catch {
            // Decode error, ignore
          }
        }
      }

      return {
        success: true,
        expandedUrl,
        data,
      };

    } finally {
      await page.close();
    }

  } catch (error) {
    console.error('[Scraper] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Scraping failed',
    };
  }
}
