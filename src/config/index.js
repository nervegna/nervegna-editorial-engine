import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

function envFloat(key, fallback) {
  const val = parseFloat(process.env[key]);
  return isNaN(val) ? fallback : val;
}

function envInt(key, fallback) {
  const val = parseInt(process.env[key]);
  return isNaN(val) ? fallback : val;
}

export const config = {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 4096,
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    notificationEmail: process.env.NOTIFICATION_EMAIL,
  },

  feeds: {
    substack: (process.env.SUBSTACK_FEEDS || '').split(',').filter(Boolean),
    medium: (process.env.MEDIUM_FEEDS || '').split(',').filter(Boolean),
  },

  github: {
    token: process.env.GITHUB_TOKEN,
    topics: ['generative-ai', 'agentic-ai', 'ai-agents', 'llm', 'claude'],
    minStars: 50,
  },

  social: {
    mastodon: {
      instance: process.env.MASTODON_INSTANCE,
      token: process.env.MASTODON_TOKEN,
    },
    bluesky: {
      handle: process.env.BLUESKY_HANDLE,
      password: process.env.BLUESKY_PASSWORD,
    },
  },

  scheduler: {
    cronSchedule: process.env.CRON_SCHEDULE || '0 0 */3 * *',
    intervalHours: 72,
  },

  scoring: {
    minEngagementScore: envFloat('MIN_ENGAGEMENT_SCORE', 0.3),
    minRelevanceScore: envFloat('MIN_RELEVANCE_SCORE', 0.6),
  },

  content: {
    targetReadingTimeMin: envInt('TARGET_READING_TIME_MIN', 6),
    targetReadingTimeMax: envInt('TARGET_READING_TIME_MAX', 10),
    wordsPerMinute: envInt('WORDS_PER_MINUTE', 200),
    povKeywords: (process.env.POV_KEYWORDS || 'agentic AI,AI-native,generative AI').split(',').map(k => k.trim()),
  },

  paths: {
    output: path.join(__dirname, '../../output'),
    logs: path.join(__dirname, '../../logs'),
    data: path.join(__dirname, '../../data'),
  },
};

export default config;
