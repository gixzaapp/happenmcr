import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { chromium, type Browser } from "playwright";

export type FetchHtmlOptions = {
  mode?: "cheerio" | "playwright";
  waitForSelector?: string;
  timeoutMs?: number;
  userAgent?: string;
};

const DEFAULT_USER_AGENT =
  "happenMCRBot/0.1 (+https://github.com/happenMCR; venue-event-aggregator)";

let sharedBrowser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!sharedBrowser || !sharedBrowser.isConnected()) {
    sharedBrowser = await chromium.launch({ headless: true });
  }
  return sharedBrowser;
}

export async function closeBrowser(): Promise<void> {
  if (sharedBrowser) {
    await sharedBrowser.close();
    sharedBrowser = null;
  }
}

/** Fetch static HTML with the built-in fetch API. */
export async function fetchStaticHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": DEFAULT_USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }

  return response.text();
}

/** Render a page with Playwright and return the final HTML. */
export async function fetchRenderedHtml(
  url: string,
  options: Pick<FetchHtmlOptions, "waitForSelector" | "timeoutMs" | "userAgent"> = {},
): Promise<string> {
  const browser = await getBrowser();
  const page = await browser.newPage({
    userAgent: options.userAgent ?? DEFAULT_USER_AGENT,
  });

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: options.timeoutMs ?? 30_000,
    });

    if (options.waitForSelector) {
      await page.waitForSelector(options.waitForSelector, {
        timeout: options.timeoutMs ?? 30_000,
      });
    }

    return await page.content();
  } finally {
    await page.close();
  }
}

export async function fetchHtml(
  url: string,
  options: FetchHtmlOptions = {},
): Promise<string> {
  const mode = options.mode ?? "cheerio";
  if (mode === "playwright") {
    return fetchRenderedHtml(url, options);
  }
  return fetchStaticHtml(url);
}

export function loadDocument(html: string): CheerioAPI {
  return cheerio.load(html);
}
