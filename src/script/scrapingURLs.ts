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
  const uniqueURLs = Array.from(new Set(currentURLs));

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
  obtainedURLs: string[],
  waitSec: number,
  allPageURLs: string[] = [],
  count: number = 0,
): Promise<string[]> => {
  if (obtainedURLs.length === count) {
    return allPageURLs;
  }

  console.info('Scraping: ' + obtainedURLs[count]);

  await page.goto(obtainedURLs[count], { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(waitSec * 1000);
  const currentPageURLs = await getCurrentPageURLs(page);
  const currentURLs = currentPageURLs.map((path) => {
    return /^(https|http):\/\//.test(path) ? path : (URL.endsWith('/') ? URL.slice(0, -1) : URL) + path;
  });
  const uniqueURLs = Array.from(new Set(currentURLs));
  allPageURLs = [...allPageURLs, ...uniqueURLs];

  // Here, we merge the obtainedURLs with the newly found URLs, while also removing duplicates.
  const nextURLsToScrape = Array.from(new Set([...obtainedURLs, ...uniqueURLs]));

  return await getCurrentPageURLsRecursive(
    page,
    URL,
    nextURLsToScrape,
    waitSec,
    allPageURLs,
    count + 1,
  );
};


const getCurrentPageURLs = async (page: Page): Promise<string[]> => {
  return (await page.$$eval('a', anchors => {
    return anchors.map(anchor => anchor.getAttribute('href'));
  })).filter((url): url is string => url !== null);
};

