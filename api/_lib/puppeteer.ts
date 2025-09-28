// puppeteer.ts
import chromium from '@sparticuz/chromium';
import puppeteer, { Page, Browser } from 'puppeteer-core';

let _page: Page | null = null;
let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser) {
    return _browser;
  }

  // For local development
  if (process.env.NODE_ENV === 'development') {
    _browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } else {
    // For production on Vercel
    _browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--disable-features=VizDisplayCompositor',
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }

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
  const page = await getPage();

  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await page.setViewport({
      width: width ?? 1280,
      height: height ?? 720,
      deviceScaleFactor: 2,
    });

    const buffer = await page.screenshot({
      type: 'png',
      fullPage: false,
    });

    return buffer as Buffer;
  } catch (error) {
    console.error('Screenshot error:', error);
    throw error;
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