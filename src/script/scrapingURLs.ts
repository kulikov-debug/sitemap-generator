import { launch, Page } from 'puppeteer';

export const scrapeURLs = async (
  initialURL: string,
  waitSec?: number,
): Promise<string[]> => {
  const browser = await launch({ headless: true }); // You can adjust the 'headless' option here
  const page = await browser.newPage();

  console.info('Start Scraping: ' + initialURL);

  const allPageURLs = await getAllPageURLs(page, initialURL, waitSec ? waitSec : 3);
  await browser.close();
  return allPageURLs;
};

const getAllPageURLs = async (
  page: Page,
  initialURL: string,
  waitSec: number,
): Promise<string[]> => {
  await page.goto(initialURL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(waitSec * 1000);
  const currentPageURLs = await getCurrentPageURLs(page, initialURL);
  const uniqueURLs = Array.from(new Set(currentPageURLs));

  console.info('Found URLs: ' + uniqueURLs.toString());

  const allPageURLs = await getCurrentPageURLsRecursive(
    page,
    initialURL,
    uniqueURLs,
    waitSec,
    [],
  );
  return Array.from(new Set(allPageURLs));
};

const getCurrentPageURLsRecursive = async (
  page: Page,
  initialURL: string,
  obtainedURLs: string[],
  waitSec: number,
  allPageURLs: string[],
  count?: number,
): Promise<string[]> => {
  const currentCount = count ? count : 0;
  if (obtainedURLs.length === currentCount) {
    return allPageURLs?.length ? allPageURLs : obtainedURLs;
  }

  console.info('Scraping: ' + obtainedURLs[currentCount]);

  await page.goto(obtainedURLs[currentCount], {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(waitSec * 1000);
  const currentPageURLs = await getCurrentPageURLs(page, initialURL);
  const uniqueURLs = Array.from(new Set(currentPageURLs));
  allPageURLs.concat(uniqueURLs);
  return await getCurrentPageURLsRecursive(
    page,
    initialURL,
    obtainedURLs,
    waitSec,
    allPageURLs,
    currentCount + 1,
  );
};

const getCurrentPageURLs = async (page: Page, baseURL: string): Promise<string[]> => {
  const bodyHandle = await page.$('body');
  return await page.evaluate((body, baseURL) => {
    if (!body) {
      return [];
    }
    const elements = Array.from(body.querySelectorAll('a'));
    return elements
      .map((element: Element) => {
        let url = element?.getAttribute('href');
        if (!url) {
          return '';
        }
        if (/^(https|http):\/\//.test(url)) {
          return url;
        } else if (url.startsWith('/')) {
          return baseURL + url;
        } else {
          return baseURL + '/' + url;
        }
      })
      .filter((url) => url) as string[];
  }, bodyHandle, baseURL);
};
