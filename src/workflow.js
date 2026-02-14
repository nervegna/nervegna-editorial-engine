import { scrapeAllSources } from './scrapers/index.js';
import { rankContent } from './rankers/index.js';
import { generateEditorial } from './generators/index.js';
import { sendNotification } from './notifiers/index.js';
import { logger } from './utils/logger.js';

export async function runFullWorkflow() {
  logger.info('=== Starting Nervegna Editorial Engine Workflow ===');

  const startTime = Date.now();

  try {
    logger.info('Step 1/4: Scraping content from all sources...');
    const scrapedContent = await scrapeAllSources();

    logger.info('Step 2/4: Ranking content by engagement and relevance...');
    const rankedContent = await rankContent(scrapedContent);

    if (rankedContent.length === 0) {
      logger.warn('No content passed ranking threshold. Workflow aborted.');
      return {
        success: false,
        reason: 'No content met quality thresholds',
      };
    }

    logger.info('Step 3/4: Generating editorial draft...');
    const editorial = await generateEditorial(rankedContent);

    logger.info('Step 4/4: Sending notification...');
    const notified = await sendNotification(editorial);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`=== Workflow completed successfully in ${duration}s ===`);

    return {
      success: true,
      editorial,
      notified,
      duration,
      stats: {
        scraped: scrapedContent.rss.length + scrapedContent.github.length + scrapedContent.social.length,
        ranked: rankedContent.length,
      },
    };
  } catch (error) {
    logger.error('Workflow failed:', error);

    return {
      success: false,
      error: error.message,
    };
  }
}
