import { scrapingURL } from './scrapingURLs';
import { urlsToSitemap } from './urlsToSitemap';

const URL = 'https://example.com'; // Replace with your desired URL
const waitSec = 3; // Replace with your desired wait time

(async () => {
  try {
    const allURLs = await scrapeURLs(URL, waitSec);
    console.log('All URLs:', allURLs);
  } catch (error) {
    console.error('An error occurred:', error);
  }
})();
