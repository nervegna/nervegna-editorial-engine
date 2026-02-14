import { Octokit } from 'octokit';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

const octokit = config.github.token
  ? new Octokit({ auth: config.github.token })
  : new Octokit();

export async function scrapeGitHubTrending() {
  logger.info('Scraping GitHub trending repositories...');

  const items = [];
  const today = new Date();
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const topic of config.github.topics) {
    try {
      const { data } = await octokit.rest.search.repos({
        q: `topic:${topic} created:>${lastWeek.toISOString().split('T')[0]} stars:>${config.github.minStars}`,
        sort: 'stars',
        order: 'desc',
        per_page: 10,
      });

      for (const repo of data.items) {
        items.push({
          type: 'github',
          source: 'github',
          title: repo.full_name,
          description: repo.description || '',
          link: repo.html_url,
          author: repo.owner.login,
          publishedDate: new Date(repo.created_at),
          topics: repo.topics || [],
          engagement: {
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            watchers: repo.watchers_count,
            issues: repo.open_issues_count,
          },
          language: repo.language,
          license: repo.license?.name || null,
        });
      }

      logger.debug(`Scraped ${data.items.length} repos for topic: ${topic}`);
    } catch (error) {
      logger.error(`Failed to scrape GitHub topic ${topic}:`, error.message);
    }
  }

  return items;
}
