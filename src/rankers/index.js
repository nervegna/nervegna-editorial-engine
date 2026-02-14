import { calculateEngagementScore } from './engagementRanker.js';
import { calculateRelevanceScore } from './relevanceRanker.js';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

export async function rankContent(scrapedContent) {
  logger.info('Ranking content by engagement and relevance...');

  const allItems = [
    ...scrapedContent.rss,
    ...scrapedContent.github,
    ...scrapedContent.social,
  ];

  const rankedItems = [];

  for (const item of allItems) {
    const engagementScore = calculateEngagementScore(item);
    const relevanceScore = await calculateRelevanceScore(item);

    const compositeScore = (engagementScore * 0.4) + (relevanceScore * 0.6);

    if (
      engagementScore >= config.scoring.minEngagementScore &&
      relevanceScore >= config.scoring.minRelevanceScore
    ) {
      rankedItems.push({
        ...item,
        scores: {
          engagement: engagementScore,
          relevance: relevanceScore,
          composite: compositeScore,
        },
      });
    }
  }

  rankedItems.sort((a, b) => b.scores.composite - a.scores.composite);

  logger.info(`Ranked ${rankedItems.length}/${allItems.length} items passed threshold`);

  return rankedItems;
}

export { calculateEngagementScore, calculateRelevanceScore };
