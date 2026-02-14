import Anthropic from '@anthropic-ai/sdk';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import { saveMarkdown } from '../utils/fileSystem.js';

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

export async function generateEditorial(rankedItems) {
  logger.info('Generating editorial content...');

  if (rankedItems.length === 0) {
    logger.warn('No ranked items to generate editorial from');
    return null;
  }

  const topItems = rankedItems.slice(0, 5);

  const editorial = await generateEditorialWithClaude(topItems);

  if (editorial) {
    const filename = await saveMarkdown(editorial);
    logger.info(`Editorial saved to: ${filename}`);

    return {
      content: editorial,
      filename,
      sources: topItems.map(item => ({
        title: item.title,
        link: item.link,
        score: item.scores.composite,
      })),
    };
  }

  return null;
}

// Standalone execution
if (process.argv[1] && process.argv[1].endsWith('generators/index.js')) {
  import('../scrapers/index.js').then(({ scrapeAllSources }) => {
    import('../rankers/index.js').then(({ rankContent }) => {
      scrapeAllSources()
        .then(scraped => rankContent(scraped))
        .then(ranked => generateEditorial(ranked))
        .then(editorial => {
          if (editorial) {
            logger.info(`Editorial generated: ${editorial.filename}`);
          } else {
            logger.warn('No editorial generated');
          }
        })
        .catch(error => {
          logger.error('Generation failed:', error);
          process.exit(1);
        });
    });
  });
}

async function generateEditorialWithClaude(topItems) {
  const targetWords = (config.content.targetReadingTimeMin + config.content.targetReadingTimeMax) / 2 * config.content.wordsPerMinute;

  const sourcesText = topItems.map((item, idx) =>
    `${idx + 1}. **${item.title}** (${item.source})
   - Link: ${item.link}
   - Engagement Score: ${item.scores.engagement.toFixed(2)}
   - Relevance Score: ${item.scores.relevance.toFixed(2)}
   - Summary: ${(item.content || item.description || '').substring(0, 300)}...
`).join('\n');

  const prompt = `You are Tommaso Nervegna, writing for nervegna.substack.com. Your editorial focus is on AI-native products, agentic AI systems, generative AI, and strategic design.

Based on these trending sources, write an original editorial piece:

${sourcesText}

Requirements:
- Length: ${targetWords} words (${config.content.targetReadingTimeMin}-${config.content.targetReadingTimeMax} min read)
- Format: Markdown with clear structure
- Style: Strategic insights, technical depth, practical implications
- POV: Focus on AI-native product design, agentic systems, real-world applications
- Include: Introduction, 3-4 main sections, conclusion with actionable insights
- Citations: Reference sources inline [like this](link)

Write an engaging editorial that synthesizes these sources into a coherent narrative with your unique perspective.`;

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const message = await anthropic.messages.create({
        model: config.anthropic.model,
        max_tokens: config.anthropic.maxTokens,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      const editorial = message.content[0].text;
      logger.info(`Generated editorial: ${editorial.length} characters`);

      return editorial;
    } catch (error) {
      if (attempt < maxRetries && error.status === 529) {
        const wait = attempt * 10;
        logger.warn(`API overloaded, retrying in ${wait}s (attempt ${attempt}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, wait * 1000));
      } else {
        logger.error('Failed to generate editorial with Claude:', error.message);
        throw error;
      }
    }
  }
}
