import Anthropic from '@anthropic-ai/sdk';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

const anthropic = config.anthropic.apiKey
  ? new Anthropic({ apiKey: config.anthropic.apiKey })
  : null;

let warnedNoApiKey = false;

export async function calculateRelevanceScore(item) {
  const povKeywords = config.content.povKeywords;

  const keywordScore = calculateKeywordMatch(item, povKeywords);

  if (!anthropic) {
    if (!warnedNoApiKey) {
      logger.warn('No Anthropic API key, using keyword-only relevance scoring');
      warnedNoApiKey = true;
    }
    return keywordScore;
  }

  try {
    const semanticScore = await calculateSemanticRelevance(item, povKeywords);
    return (keywordScore * 0.3) + (semanticScore * 0.7);
  } catch (error) {
    logger.error('Semantic scoring failed, falling back to keyword match:', error.message);
    return keywordScore;
  }
}

function calculateKeywordMatch(item, keywords) {
  const text = `${item.title} ${item.content || item.description || ''}`.toLowerCase();

  let matchCount = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword.toLowerCase())) {
      matchCount++;
    }
  }

  return Math.min(matchCount / keywords.length, 0.8);
}

async function calculateSemanticRelevance(item, povKeywords) {
  const prompt = `Analyze the following content and rate its relevance to these topics: ${povKeywords.join(', ')}.

Title: ${item.title}
Content: ${(item.content || item.description || '').substring(0, 1000)}

Rate the relevance on a scale of 0.0 to 1.0:
- 0.0-0.3: Not relevant or tangentially related
- 0.4-0.6: Somewhat relevant, mentions topics but not central
- 0.7-0.9: Highly relevant, core focus on these topics
- 0.9-1.0: Extremely relevant, perfect match for editorial POV

Respond with ONLY a number between 0.0 and 1.0, nothing else.`;

  const message = await anthropic.messages.create({
    model: config.anthropic.model,
    max_tokens: 50,
    messages: [{
      role: 'user',
      content: prompt,
    }],
  });

  const scoreText = message.content[0].text.trim();
  const score = parseFloat(scoreText);

  if (isNaN(score) || score < 0 || score > 1) {
    logger.warn(`Invalid semantic score "${scoreText}", defaulting to 0.5`);
    return 0.5;
  }

  logger.debug(`Semantic relevance for "${item.title}": ${score.toFixed(3)}`);

  return score;
}
