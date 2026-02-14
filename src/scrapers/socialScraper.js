import axios from 'axios';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

export async function scrapeSocialMedia() {
  logger.info('Scraping social media posts...');

  const items = [];

  // Mastodon scraping
  if (config.social.mastodon.instance && config.social.mastodon.token) {
    try {
      const mastodonPosts = await scrapeMastodon();
      items.push(...mastodonPosts);
      logger.debug(`Scraped ${mastodonPosts.length} Mastodon posts`);
    } catch (error) {
      logger.error('Failed to scrape Mastodon:', error.message);
    }
  }

  // Bluesky scraping (placeholder - requires proper API implementation)
  if (config.social.bluesky.handle && config.social.bluesky.password) {
    try {
      const blueskyPosts = await scrapeBluesky();
      items.push(...blueskyPosts);
      logger.debug(`Scraped ${blueskyPosts.length} Bluesky posts`);
    } catch (error) {
      logger.error('Failed to scrape Bluesky:', error.message);
    }
  }

  return items;
}

async function scrapeMastodon() {
  const { instance, token } = config.social.mastodon;
  const hashtags = ['AI', 'GenerativeAI', 'AgenticAI', 'LLM'];
  const items = [];

  for (const tag of hashtags) {
    try {
      const response = await axios.get(`${instance}/api/v1/timelines/tag/${tag}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { limit: 20 },
      });

      for (const post of response.data) {
        items.push({
          type: 'social',
          source: 'mastodon',
          title: post.content.substring(0, 100).replace(/<[^>]*>/g, '') + '...',
          content: post.content.replace(/<[^>]*>/g, ''),
          link: post.url,
          author: post.account.display_name || post.account.username,
          publishedDate: new Date(post.created_at),
          engagement: {
            favorites: post.favourites_count,
            reblogs: post.reblogs_count,
            replies: post.replies_count,
          },
          hashtags: post.tags.map(t => t.name),
        });
      }
    } catch (error) {
      logger.error(`Failed to scrape Mastodon tag #${tag}:`, error.message);
    }
  }

  return items;
}

async function scrapeBluesky() {
  // Placeholder for Bluesky implementation
  // Requires ATP (Authenticated Transfer Protocol) SDK
  logger.warn('Bluesky scraping not yet implemented');
  return [];
}
