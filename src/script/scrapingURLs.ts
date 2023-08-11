import { launch, Page } from 'puppeteer';

export const scrapingURL = async (
  URL: string,
  waitSec: number = 3,
): Promise<string[]> => {
  const browser = await launch({ headless: true });
  const page = await browser.newPage();

  console.info('Start Scraping: ' + URL);

  const allPageURLs = await getAllPageURLs(page, URL, waitSec);
  await browser.close();
  return allPageURLs;
};

const getAllPageURLs = async (
  page: Page,
  URL: string,
  waitSec: number,
): Promise<string[]> => {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(waitSec * 1000);
  const currentPageURLs = await getCurrentPageURLs(page);
  const currentURLs = currentPageURLs.map((path) => {
    return /^(https|http):\/\//.test(path) ? path : (URL.endsWith('/') ? URL.slice(0, -1) : URL) + path;
  });
  const uniqueURLs = new Set<string>(currentURLs);


  console.info('Found URLs: ' + uniqueURLs.toString());

  return await getCurrentPageURLsRecursive(
    page,
    URL,
    uniqueURLs,
    waitSec,
    [],
  );
};

const getCurrentPageURLsRecursive = async (
  page: Page,
  URL: string,
  obtainedURLs: Set<string>,
  waitSec: number,
  scrapedURLs: Set<string> = new Set(),
  allPageURLs: Set<string> = new Set(),
): Promise<string[]> => {
  const currentURL = Array.from(obtainedURLs)[scrapedURLs.size];
  if (!currentURL) {
    return Array.from(allPageURLs);
  }

  console.info('Scraping: ' + currentURL);

  await page.goto(currentURL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(waitSec * 1000);

  scrapedURLs.add(currentURL);

  const currentPageURLs = await getCurrentPageURLs(page);
  const currentURLs = currentPageURLs.map((path) => {
    return /^(https|http):\/\//.test(path) ? path : (URL.endsWith('/') ? URL.slice(0, -1) : URL) + path;
  });

  currentURLs.forEach((url) => {
    allPageURLs.add(url);
    if (!scrapedURLs.has(url)) {
      obtainedURLs.add(url);
    }
  });

  return await getCurrentPageURLsRecursive(
    page,
    URL,
    obtainedURLs,
    waitSec,
    scrapedURLs,
    allPageURLs,
  );
};


const getCurrentPageURLs = async (page: Page): Promise<string[]> => {
  return (await page.$$eval('a', anchors => {
    return anchors.map(anchor => anchor.getAttribute('href'));
  })).filter((url): url is string => url !== null);
};

