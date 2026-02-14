#!/usr/bin/env node

import cron from 'node-cron';
import { runFullWorkflow } from './workflow.js';
import config from './config/index.js';
import { logger } from './utils/logger.js';

const IMMEDIATE_RUN = process.argv.includes('--now');

async function main() {
  logger.info('Nervegna Editorial Engine starting...');
  logger.info(`Scheduler: ${config.scheduler.cronSchedule} (every ${config.scheduler.intervalHours} hours)`);

  if (IMMEDIATE_RUN) {
    logger.info('Running workflow immediately (--now flag)...');
    await runFullWorkflow();
    process.exit(0);
  }

  cron.schedule(config.scheduler.cronSchedule, async () => {
    logger.info('Cron job triggered');
    await runFullWorkflow();
  });

  logger.info('Scheduler is running. Press Ctrl+C to stop.');
  logger.info('To run immediately, use: npm start -- --now');
}

main().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
