import { execSync } from 'child_process';
import { scrapeAllSources } from './scrapers/index.js';
import { rankContent } from './rankers/index.js';
import { generateEditorial } from './generators/index.js';
import { sendNotification } from './notifiers/index.js';
import { logger } from './utils/logger.js';

function autoCommitAndPush(filename) {
  try {
    execSync('git add content/editorials/', { stdio: 'pipe' });
    const message = `Add editorial: ${filename}`;
    execSync(`git commit -m "${message}"`, { stdio: 'pipe' });
    const pushResult = execSync('git push', { stdio: 'pipe' }).toString();
    logger.info(`Auto-push completed: ${pushResult.trim() || 'ok'}`);
    return true;
  } catch (error) {
    logger.error('Auto-commit/push failed:', error.message);
    return false;
  }
}

export async function runFullWorkflow() {
  logger.info('=== Starting Nervegna Editorial Engine Workflow ===');

  const startTime = Date.now();

  try {
    logger.info('Step 1/5: Scraping content from all sources...');
    const scrapedContent = await scrapeAllSources();

    logger.info('Step 2/5: Ranking content by engagement and relevance...');
    const rankedContent = await rankContent(scrapedContent);

    if (rankedContent.length === 0) {
      logger.warn('No content passed ranking threshold. Workflow aborted.');
      return {
        success: false,
        reason: 'No content met quality thresholds',
      };
    }

    logger.info('Step 3/5: Generating editorial draft...');
    const editorial = await generateEditorial(rankedContent);

    logger.info('Step 4/5: Sending notification...');
    const notified = await sendNotification(editorial);

    logger.info('Step 5/5: Committing and pushing to GitHub...');
    const pushed = editorial ? autoCommitAndPush(editorial.filename) : false;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`=== Workflow completed successfully in ${duration}s ===`);

    return {
      success: true,
      editorial,
      notified,
      pushed,
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
