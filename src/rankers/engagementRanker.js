import { logger } from '../utils/logger.js';

export function calculateEngagementScore(item) {
  let score = 0;

  switch (item.type) {
    case 'rss':
      score = normalizeRSSEngagement(item.engagement);
      break;
    case 'github':
      score = normalizeGitHubEngagement(item.engagement);
      break;
    case 'social':
      score = normalizeSocialEngagement(item.engagement);
      break;
    case 'x':
      score = normalizeXEngagement(item.engagement);
      break;
    default:
      score = 0;
  }

  const recencyBonus = calculateRecencyBonus(item.publishedDate);
  const finalScore = Math.min(score + recencyBonus, 1.0);

  logger.debug(`Engagement score for "${item.title}": ${finalScore.toFixed(3)}`);

  return finalScore;
}

function normalizeRSSEngagement(engagement) {
  const { likes = 0, shares = 0, comments = 0 } = engagement;
  const total = (likes * 1) + (shares * 3) + (comments * 2);

  return Math.min(total / 1000, 0.8);
}

function normalizeGitHubEngagement(engagement) {
  const { stars = 0, forks = 0, watchers = 0 } = engagement;
  const total = (stars * 1) + (forks * 5) + (watchers * 2);

  return Math.min(total / 5000, 0.8);
}

function normalizeSocialEngagement(engagement) {
  const { favorites = 0, reblogs = 0, replies = 0 } = engagement;
  const total = (favorites * 1) + (reblogs * 3) + (replies * 2);

  return Math.min(total / 500, 0.8);
}

function normalizeXEngagement(engagement) {
  const { likes = 0, retweets = 0, replies = 0 } = engagement;
  const total = (likes * 1) + (retweets * 4) + (replies * 2);

  return Math.min(total / 2000, 0.8);
}

function calculateRecencyBonus(publishedDate) {
  const now = new Date();
  const ageInDays = (now - publishedDate) / (1000 * 60 * 60 * 24);

  if (ageInDays < 1) return 0.2;
  if (ageInDays < 3) return 0.15;
  if (ageInDays < 7) return 0.1;
  if (ageInDays < 14) return 0.05;
  return 0;
}
