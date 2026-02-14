# Architecture Documentation

## System Design

### Overview

The Nervegna Editorial Engine follows a **pipeline architecture** with distinct, modular stages:

```
Sources → Scraping → Ranking → Filtering → Generation → Notification
```

Each stage is:
- **Autonomous**: Can run independently for testing
- **Pluggable**: New sources/rankers can be added without modifying core logic
- **Observable**: Logs every step with detailed metrics

---

## Module Breakdown

### 1. Scrapers (`src/scrapers/`)

**Purpose**: Aggregate content from heterogeneous sources into standardized format.

**Standard Item Schema**:
```javascript
{
  type: 'rss' | 'github' | 'social',
  source: string,              // 'substack', 'medium', 'mastodon', etc.
  title: string,
  link: string,
  content: string,             // Full text or summary
  author: string,
  publishedDate: Date,
  engagement: {
    likes/stars/favorites: number,
    shares/reblogs/forks: number,
    comments/replies: number,
  },
  // Optional fields
  categories: string[],
  topics: string[],
  language: string,
}
```

**Scrapers**:
- `rssScraper.js`: Uses `rss-parser` for Substack/Medium feeds
- `githubScraper.js`: Octokit search API for trending repos
- `socialScraper.js`: Mastodon public API, Bluesky (planned)

**Error Handling**: Per-source failures don't stop the workflow. Failed scrapers log errors and return empty arrays.

---

### 2. Rankers (`src/rankers/`)

**Purpose**: Score and filter content based on engagement + editorial relevance.

#### Engagement Scoring (`engagementRanker.js`)

**Formula** (per type):
- **RSS**: `(likes × 1 + shares × 3 + comments × 2) / 1000`
- **GitHub**: `(stars × 1 + forks × 5 + watchers × 2) / 5000`
- **Social**: `(favorites × 1 + reblogs × 3 + replies × 2) / 500`

**Recency Bonus**:
- 0-1 day: +0.20
- 1-3 days: +0.15
- 3-7 days: +0.10
- 7-14 days: +0.05
- 14+ days: 0

**Max score**: Capped at 0.8 + recency bonus (≤1.0 total)

#### Relevance Scoring (`relevanceRanker.js`)

**Two-stage approach**:
1. **Keyword matching** (30% weight):
   - Count POV keywords in title + content
   - Normalize by keyword count
   - Max: 0.8

2. **Semantic analysis** (70% weight):
   - Claude Sonnet 4.5 rates relevance (0.0-1.0)
   - Considers topical alignment, depth, actionability
   - Fallback to keyword-only if API unavailable

**Composite Score**:
```javascript
composite = (engagement × 0.4) + (relevance × 0.6)
```

**Filtering**:
- Keep if: `engagement ≥ MIN_ENGAGEMENT_SCORE` AND `relevance ≥ MIN_RELEVANCE_SCORE`
- Sort by composite score descending

---

### 3. Generator (`src/generators/`)

**Purpose**: Synthesize top-ranked items into cohesive editorial.

**Process**:
1. Select top 5 ranked items
2. Construct Claude prompt with:
   - Source summaries (title, link, scores, excerpt)
   - Target word count
   - Editorial POV constraints
   - Style guidelines
3. Send to Claude Sonnet 4.5 (4K max tokens)
4. Save Markdown output to `output/` directory

**Prompt Engineering**:
- **Persona**: "You are Tommaso Nervegna..."
- **Requirements**: Word count, structure, citation format
- **Style**: Strategic insights, technical depth, practical implications

**Output Format**: Markdown with H1 title, H2 sections, inline citations.

---

### 4. Notifier (`src/notifiers/`)

**Purpose**: Deliver editorial draft via email.

**Features**:
- **Dual format**: Plain text (Markdown) + HTML (rendered)
- **Styling**: Custom CSS for readability
- **Metadata**: Source links, scores, generation timestamp
- **Transport**: Nodemailer (SMTP)

**HTML Generation**:
- Uses `marked` to parse Markdown
- Injects into responsive HTML template
- Adds footer with sources and metadata

---

### 5. Workflow Orchestrator (`workflow.js`)

**Purpose**: Sequential execution of all stages with error handling.

**Flow**:
```javascript
scrape() → rank() → generate() → notify() → return result
```

**Error Recovery**:
- Stage failures logged but don't crash workflow
- Returns success/failure status + metadata
- Empty results at any stage abort gracefully

**Metrics Collected**:
- Total items scraped (by source)
- Items passing ranking threshold
- Generation success/failure
- Notification delivery status
- Total execution time

---

### 6. Scheduler (`index.js`)

**Purpose**: Automated workflow execution.

**Modes**:
1. **Cron mode** (default): Runs on schedule (e.g., every 72h)
2. **Immediate mode** (`--now` flag): One-time execution

**Implementation**: Uses `node-cron` with configurable schedule.

---

## Data Flow Example

**Input** (Scraped):
```javascript
{
  type: 'github',
  title: 'anthropics/claude-code',
  description: 'Official CLI for Claude...',
  link: 'https://github.com/anthropics/claude-code',
  engagement: { stars: 1250, forks: 45, watchers: 89 },
  publishedDate: '2024-02-10T00:00:00Z',
  topics: ['ai', 'cli', 'claude'],
}
```

**After Ranking**:
```javascript
{
  // ...original fields
  scores: {
    engagement: 0.73,  // (1250 + 45×5 + 89×2) / 5000 + recency
    relevance: 0.85,   // Claude semantic score
    composite: 0.80,   // (0.73×0.4) + (0.85×0.6)
  },
}
```

**Output** (Generated Editorial excerpt):
```markdown
# The Rise of AI-Native CLI Tools

Recent developments in agentic AI have spawned a new category of developer tools...

[Claude Code](https://github.com/anthropics/claude-code) exemplifies this shift...
```

---

## Scaling Considerations

### Current Limits
- ~50-100 items per scrape cycle
- ~5-10 items pass ranking threshold
- 1 editorial per 72h cycle

### Future Optimizations
- **Caching**: Store scraped content in SQLite/Redis
- **Batching**: Process rankings in parallel
- **Rate limiting**: Respect API quotas (GitHub, Anthropic)
- **Deduplication**: Hash-based content fingerprinting

---

## Configuration Strategy

**Hierarchy**:
1. `.env` file (secrets, user-specific settings)
2. `config/index.js` (defaults, derived values)
3. Runtime overrides (CLI args)

**Hot-swappable**:
- POV keywords
- Scoring thresholds
- Cron schedule
- Target word count

**Immutable**:
- Item schema
- Pipeline stage order
- Composite scoring formula (without code changes)

---

## Error Handling Philosophy

**Fail gracefully**:
- Individual scraper failures don't stop workflow
- Missing API keys disable optional features (e.g., semantic scoring)
- Empty results trigger warnings, not errors

**Observability**:
- Every stage logs inputs/outputs
- Errors include context (source URL, item title)
- Structured logging for parsing/alerting

**Recovery**:
- No persistent state → safe to retry immediately
- Idempotent scrapers (same input → same output)
- Email failures don't lose editorial (saved to disk)

---

## Testing Strategy (Planned)

### Unit Tests
- Engagement scoring formulas
- Keyword matching logic
- Date parsing/normalization

### Integration Tests
- Mock scrapers with fixture data
- End-to-end workflow with fake API responses
- Email delivery (test mode)

### Manual Tests
- `npm run scrape` → inspect logs
- `npm run rank` → verify scores
- `npm start -- --now` → full workflow

---

## Security

**API Keys**:
- Never logged or exposed in errors
- Loaded from `.env` only (not committed)
- Validated at startup

**Content Handling**:
- No user-generated input (sources are pre-configured)
- Sanitized HTML output (XSS-safe)
- No code execution from scraped content

**Email**:
- SMTP over TLS (port 587)
- App passwords preferred over account passwords
- No CC/BCC to prevent leaks

---

## Performance

**Typical Execution Time**:
- Scraping: 5-15s (depends on sources)
- Ranking: 2-5s (with Claude semantic scoring)
- Generation: 10-20s (Claude API call)
- Notification: 1-2s
- **Total**: ~20-40s per workflow

**Bottlenecks**:
- Claude API latency (semantic scoring + generation)
- RSS feed response times
- Network I/O (sequential scraping)

**Optimizations**:
- Parallel scraping (`Promise.allSettled`)
- Optional semantic scoring (fallback to keywords)
- In-memory processing (no database I/O)

---

## Extension Points

**Add New Scraper**:
1. Create `src/scrapers/yourScraper.js`
2. Export `async function scrapeYourSource()`
3. Return array of standard item schema
4. Import in `src/scrapers/index.js`

**Custom Ranker**:
1. Create `src/rankers/yourRanker.js`
2. Export `function calculateYourScore(item)`
3. Modify composite formula in `src/rankers/index.js`

**Alternative Generator**:
1. Create `src/generators/yourGenerator.js`
2. Implement same interface as `generateEditorial(rankedItems)`
3. Swap in `workflow.js`

---

**Last Updated**: 2024-02-13
**Version**: 1.0.0
