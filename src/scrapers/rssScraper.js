import Parser from 'rss-parser';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

const parser = new Parser({
  customFields: {
    item: [
      ['media:thumbnail', 'thumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

export async function scrapeRSSFeeds() {
  const allFeeds = [...config.feeds.substack, ...config.feeds.medium];
  logger.info(`Scraping ${allFeeds.length} RSS feeds...`);

  const items = [];

  for (const feedUrl of allFeeds) {
    try {
      const feed = await parser.parseURL(feedUrl);

      for (const item of feed.items) {
        items.push({
          type: 'rss',
          source: feedUrl.includes('substack') ? 'substack' : 'medium',
          title: item.title,
          link: item.link,
          content: item.contentSnippet || item.content || item.contentEncoded || '',
          author: item.creator || item.author || 'Unknown',
          publishedDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          thumbnail: item.thumbnail?.url || null,
          categories: item.categories || [],
          engagement: {
            likes: 0,
            shares: 0,
            comments: 0,
          },
        });
      }

      logger.debug(`Scraped ${feed.items.length} items from ${feedUrl}`);
    } catch (error) {
      logger.error(`Failed to scrape RSS feed ${feedUrl}:`, error.message);
    }
  }

  return items;
}
