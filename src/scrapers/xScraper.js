import OpenAI from 'openai';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

const client = config.xai?.apiKey
  ? new OpenAI({ apiKey: config.xai.apiKey, baseURL: 'https://api.x.ai/v1' })
  : null;

export async function scrapeXPosts() {
  if (!client) {
    logger.warn('No XAI_API_KEY configured, skipping X/Twitter scraping');
    return [];
  }

  const topics = config.xai.searchTopics;
  logger.info(`Scraping X posts via Grok for topics: ${topics.join(', ')}...`);

  try {
    const response = await client.chat.completions.create({
      model: 'grok-3',
      messages: [
        {
          role: 'system',
          content: `You search X/Twitter for trending posts and return structured JSON. Always respond with valid JSON only, no extra text.`,
        },
        {
          role: 'user',
          content: `Find the most discussed and insightful posts on X from the last 3 days about these topics: ${topics.join(', ')}.

Return a JSON array of up to 10 posts. Each post must have this exact structure:
{
  "author": "display name (@handle)",
  "text": "full post text",
  "url": "https://x.com/...",
  "likes": number,
  "retweets": number,
  "replies": number,
  "date": "YYYY-MM-DD"
}

Return ONLY the JSON array, nothing else.`,
        },
      ],
      search_mode: 'auto',
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      logger.warn('Empty response from Grok');
      return [];
    }

    // Extract JSON from response (handle possible markdown wrapping)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      logger.warn('Could not parse JSON from Grok response');
      return [];
    }

    const posts = JSON.parse(jsonMatch[0]);

    const items = posts.map(post => ({
      type: 'x',
      source: 'x',
      title: post.text.substring(0, 120) + (post.text.length > 120 ? '...' : ''),
      content: post.text,
      link: post.url || '',
      author: post.author || 'Unknown',
      publishedDate: post.date ? new Date(post.date) : new Date(),
      engagement: {
        likes: post.likes || 0,
        retweets: post.retweets || 0,
        replies: post.replies || 0,
      },
    }));

    logger.info(`Scraped ${items.length} posts from X via Grok`);
    return items;
  } catch (error) {
    logger.error('Grok/X scraping failed:', error.message);
    return [];
  }
}
