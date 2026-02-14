import { scrapeRSSFeeds } from './rssScraper.js';
import { scrapeGitHubTrending } from './githubScraper.js';
import { scrapeSocialMedia } from './socialScraper.js';
import { scrapeXPosts } from './xScraper.js';
import { logger } from '../utils/logger.js';

export async function scrapeAllSources() {
  logger.info('Starting content scraping from all sources...');

  const results = {
    rss: [],
    github: [],
    social: [],
    x: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // Parallel scraping for performance
    const [rssContent, githubContent, socialContent, xContent] = await Promise.allSettled([
      scrapeRSSFeeds(),
      scrapeGitHubTrending(),
      scrapeSocialMedia(),
      scrapeXPosts(),
    ]);

    if (rssContent.status === 'fulfilled') {
      results.rss = rssContent.value;
      logger.info(`Scraped ${rssContent.value.length} RSS items`);
    } else {
      logger.error('RSS scraping failed:', rssContent.reason);
    }

    if (githubContent.status === 'fulfilled') {
      results.github = githubContent.value;
      logger.info(`Scraped ${githubContent.value.length} GitHub repos`);
    } else {
      logger.error('GitHub scraping failed:', githubContent.reason);
    }

    if (socialContent.status === 'fulfilled') {
      results.social = socialContent.value;
      logger.info(`Scraped ${socialContent.value.length} social posts`);
    } else {
      logger.error('Social scraping failed:', socialContent.reason);
    }

    if (xContent.status === 'fulfilled') {
      results.x = xContent.value;
      logger.info(`Scraped ${xContent.value.length} X posts`);
    } else {
      logger.error('X scraping failed:', xContent.reason);
    }

    const totalItems = results.rss.length + results.github.length + results.social.length + results.x.length;
    logger.info(`Total content items scraped: ${totalItems}`);

    return results;
  } catch (error) {
    logger.error('Fatal error during scraping:', error);
    throw error;
  }
}

export { scrapeRSSFeeds, scrapeGitHubTrending, scrapeSocialMedia, scrapeXPosts };

// Standalone execution
if (process.argv[1] && process.argv[1].endsWith('scrapers/index.js')) {
  scrapeAllSources()
    .then(results => {
      logger.info('Scraping complete:', JSON.stringify({
        rss: results.rss.length,
        github: results.github.length,
        social: results.social.length,
        x: results.x.length,
      }));
    })
    .catch(error => {
      logger.error('Scraping failed:', error);
      process.exit(1);
    });
}
