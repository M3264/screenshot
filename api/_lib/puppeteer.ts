// api/_lib/puppeteer.ts
import { Browser, Page } from 'puppeteer-core';

let _page: Page | null = null;
let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser) {
    return _browser;
  }

  const isVercel = !!process.env.VERCEL_ENV;
  let puppeteer: any, launchOptions: any = {
    headless: true,
  };

  if (isVercel) {
    // Use chromium and puppeteer-core for Vercel
    const chromium = (await import('@sparticuz/chromium')).default;
    puppeteer = await import('puppeteer-core');
    launchOptions = {
      ...launchOptions,
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      executablePath: await chromium.executablePath(),
    };
  } else {
    // Use full puppeteer for local development
    puppeteer = await import('puppeteer');
    launchOptions = {
      ...launchOptions,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };
  }

  _browser = await puppeteer.launch(launchOptions);
  return _browser;
}

async function getPage(): Promise<Page> {
  if (_page && !_page.isClosed()) {
    return _page;
  }

  const browser = await getBrowser();
  _page = await browser.newPage();
  
  // Set a user agent to avoid bot detection
  await _page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  return _page;
}

export async function getScreenshot(
  url: string,
  width?: number,
  height?: number
): Promise<Buffer> {
  let browser: Browser | null = null;

  try {
    // Get a fresh browser instance for each screenshot to avoid issues
    const isVercel = !!process.env.VERCEL_ENV;
    let puppeteer: any, launchOptions: any = {
      headless: true,
    };

    if (isVercel) {
      const chromium = (await import('@sparticuz/chromium')).default;
      puppeteer = await import('puppeteer-core');
      launchOptions = {
        ...launchOptions,
        args: chromium.args,
        executablePath: await chromium.executablePath(),
      };
    } else {
      puppeteer = await import('puppeteer');
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.setViewport({
      width: width ?? 1280,
      height: height ?? 720,
      deviceScaleFactor: 2,
    });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    const buffer = await page.screenshot({
      type: 'png',
      fullPage: false,
    });

    return buffer as Buffer;
  } catch (error) {
    console.error('Screenshot error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Clean up function (optional, for serverless optimization)
export async function cleanup(): Promise<void> {
  if (_page && !_page.isClosed()) {
    await _page.close();
    _page = null;
  }
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}