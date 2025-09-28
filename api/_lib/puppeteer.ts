// puppeteer.ts (or whatever filename)

import chrome from "chrome-aws-lambda";
import puppeteer, { Page } from "puppeteer-core";

let _page: Page | null = null;

async function getPage(): Promise<Page> {
  if (_page) {
    return _page;
  }

  const browser = await puppeteer.launch({
    args: chrome.args,
    executablePath: await chrome.executablePath,
    headless: chrome.headless,
  });

  _page = await browser.newPage();
  return _page;
}

export async function getScreenshot(
  url: string,
  width?: number,
  height?: number
): Promise<Buffer> {
  const page = await getPage();

  await page.goto(url, {
    waitUntil: "networkidle2",
  });

  await page.setViewport({
    width: width ?? 1280,
    height: height ?? 720,
    deviceScaleFactor: 2,
  });

  const buffer = await page.screenshot();
  return buffer as Buffer;
}