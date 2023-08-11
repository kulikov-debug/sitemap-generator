import { scrapingURL } from './scrapingURLs';
import { urlsToSitemap } from './urlsToSitemap';

(async () => {
  try {
    const allURLs = await scrapeURLs(URL, waitSec);
    console.log('All URLs:', allURLs);
  } catch (error) {
    console.error('An error occurred:', error);
  }
})();
