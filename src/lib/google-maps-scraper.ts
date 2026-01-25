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
 */
async function handleConsentPage(page: Page): Promise<void> {
  if (!page.url().includes('consent.google.com')) {
    return;
  }

  console.log('[Scraper] Handling consent page...');

  try {
    // Find and click the accept button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const btn of buttons) {
        const text = btn.textContent?.toLowerCase() || '';
        if (text.includes('accept') || text.includes('agree') || text.includes('i agree')) {
          btn.click();
          return;
        }
      }
      // Try form submit
      const forms = Array.from(document.querySelectorAll('form'));
      for (const form of forms) {
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn instanceof HTMLElement) {
          submitBtn.click();
          return;
        }
      }
    });

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
  } catch (error) {
    console.log('[Scraper] Consent handling error:', error);
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
    await handleConsentPage(page);

    // Wait for content to load
    await page.waitForSelector('h1', { timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500)); // Extra time for dynamic content

    // Extract place data
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

      // Get address from the address button
      const addressBtn = document.querySelector('button[data-item-id="address"]');
      if (addressBtn) {
        result.address = addressBtn.textContent?.trim() || null;
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

      // Handle consent if needed
      await handleConsentPage(page);

      // Get the final URL after redirects
      const expandedUrl = page.url();
      console.log('[Scraper] Expanded URL:', expandedUrl);

      // Verify it's a Google Maps URL
      if (!expandedUrl.includes('google.com/maps') && !expandedUrl.includes('maps.google')) {
        return {
          success: false,
          error: 'Redirect did not lead to Google Maps'
        };
      }

      // Wait for content
      await page.waitForSelector('h1', { timeout: 10000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 1500));

      // Extract data
      const data = await page.evaluate((): ScrapedPlaceData => {
        const result: ScrapedPlaceData = {
          name: null,
          address: null,
        };

        const h1 = document.querySelector('h1');
        if (h1) {
          result.name = h1.textContent?.trim() || null;
        }

        const addressBtn = document.querySelector('button[data-item-id="address"]');
        if (addressBtn) {
          result.address = addressBtn.textContent?.trim() || null;
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
