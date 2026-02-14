# Nervegna Editorial Engine

**AI-native content intelligence engine** for [nervegna.substack.com](https://nervegna.substack.com) — automated editorial drafts on Design Strategico, Agentic AI, Generative AI, and AI-native Products.

---

## 🎯 Overview

The Nervegna Editorial Engine scrapes, ranks, and synthesizes trending AI content into original editorial pieces. It runs autonomously every 72 hours, delivering 6-10 minute read drafts directly to your inbox.

### Core Features

- **Multi-source scraping**: RSS feeds (Substack, Medium), GitHub trending, social media (Mastodon, Bluesky)
- **Intelligent ranking**: Dual scoring system (engagement + semantic relevance)
- **AI-powered generation**: Claude Sonnet 4.5 generates contextual editorials matching your POV
- **Automated notifications**: Email delivery with Markdown + HTML formatting
- **Flexible scheduling**: Cron-based (72h default) or on-demand execution

---

## 🏗️ Architecture

```
┌─────────────────┐
│  SCRAPING LAYER │  → RSS, GitHub, Mastodon/Bluesky
└────────┬────────┘
         ↓
┌─────────────────┐
│ ENGAGEMENT RANK │  → Likes, stars, shares, comments
└────────┬────────┘
         ↓
┌─────────────────┐
│ RELEVANCE SCORE │  → Keyword + Claude semantic analysis
└────────┬────────┘
         ↓
┌─────────────────┐
│  EDITORIAL GEN  │  → Claude-powered Markdown drafts
└────────┬────────┘
         ↓
┌─────────────────┐
│  NOTIFICATION   │  → Email (nervegna.tommaso@gmail.com)
└─────────────────┘
```

**Flow:**
1. **Scrape** → Aggregate content from configured sources
2. **Rank** → Calculate engagement (40%) + relevance (60%) scores
3. **Filter** → Keep items above thresholds (default: engagement≥0.3, relevance≥0.6)
4. **Generate** → Claude synthesizes top 5 items into cohesive editorial
5. **Notify** → Send draft via email with source citations

---

## 📂 Project Structure

```
nervegna-editorial-engine/
├── src/
│   ├── scrapers/
│   │   ├── index.js           # Orchestrates all scrapers
│   │   ├── rssScraper.js      # Substack/Medium RSS feeds
│   │   ├── githubScraper.js   # GitHub trending repos
│   │   └── socialScraper.js   # Mastodon/Bluesky posts
│   ├── rankers/
│   │   ├── index.js           # Composite scoring logic
│   │   ├── engagementRanker.js # Engagement metrics
│   │   └── relevanceRanker.js # Keyword + Claude semantic scoring
│   ├── generators/
│   │   └── index.js           # Claude-powered editorial generation
│   ├── notifiers/
│   │   └── index.js           # Email delivery (Nodemailer)
│   ├── utils/
│   │   ├── logger.js          # File + console logging
│   │   └── fileSystem.js      # Markdown save/load
│   ├── config/
│   │   └── index.js           # Centralized configuration
│   ├── workflow.js            # Full pipeline orchestration
│   └── index.js               # Scheduler entry point
├── workflows/
│   └── n8n-workflow.json      # n8n automation template
├── docs/                      # Documentation (future)
├── tests/                     # Unit tests (future)
├── output/                    # Generated editorials (Markdown)
├── logs/                      # Daily log files
├── package.json
├── .env.example               # Environment template
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### 1. Installation

```bash
# Clone repository (or use existing directory)
cd /Users/nervo/Desktop/Nervo-Projects/nervegna-editorial-engine

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys and credentials
```

### 2. Configuration

Edit `.env` with your credentials:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-xxx                     # Claude API key
SMTP_USER=nervegna.tommaso@gmail.com
SMTP_PASS=your_gmail_app_password

# Optional (defaults provided)
SUBSTACK_FEEDS=https://feed1.substack.com,https://feed2.substack.com
MEDIUM_FEEDS=https://medium.com/feed/@ai-user
GITHUB_TOKEN=ghp_xxx                             # Higher rate limits
MASTODON_TOKEN=xxx                               # For Mastodon scraping
```

**Key configuration options** (see `.env.example` for all):
- `CRON_SCHEDULE`: Default `0 */72 * * *` (every 72 hours)
- `MIN_ENGAGEMENT_SCORE`: Default `0.3`
- `MIN_RELEVANCE_SCORE`: Default `0.6`
- `TARGET_READING_TIME_MIN/MAX`: Default `6-10` minutes
- `POV_KEYWORDS`: Comma-separated editorial focus topics

### 3. Run

```bash
# Run immediately (one-time)
npm start -- --now

# Start scheduler (runs every 72h)
npm start

# Development mode (auto-restart on file changes)
npm run dev
```

---

## 📖 Usage Examples

### Manual Workflow Steps

```bash
# 1. Scrape only
npm run scrape

# 2. Rank content
npm run rank

# 3. Generate editorial
npm run generate

# 4. Send notification
npm run notify

# Full workflow (all steps)
npm run workflow
```

### Programmatic Usage

```javascript
import { runFullWorkflow } from './src/workflow.js';

const result = await runFullWorkflow();

if (result.success) {
  console.log('Editorial generated:', result.editorial.filename);
  console.log('Sources:', result.editorial.sources);
}
```

---

## 🔧 n8n Integration

**Template**: `workflows/n8n-workflow.json`

**Setup:**
1. Import workflow into n8n
2. Update `executeCommand` node path to your installation directory
3. Configure Gmail OAuth2 credentials
4. Activate workflow

**Flow:**
- **Trigger**: Schedule (72h interval)
- **Execute**: Run `npm start -- --now`
- **Notify**: Send completion email

---

## 🧪 Testing

```bash
# Run test suite (when implemented)
npm test

# Test individual components
node src/scrapers/index.js
node src/rankers/index.js
node src/generators/index.js
```

---

## 🎨 Customization

### Add New Content Sources

1. Create scraper in `src/scrapers/yourSource.js`
2. Implement `async function scrapeYourSource()` returning standard item format
3. Add to `src/scrapers/index.js`:
   ```javascript
   const yourContent = await scrapeYourSource();
   results.yourSource = yourContent;
   ```

### Adjust Scoring Logic

**Engagement weights** (`src/rankers/engagementRanker.js`):
```javascript
const total = (likes * 1) + (shares * 3) + (comments * 2);
```

**Relevance weights** (`src/rankers/index.js`):
```javascript
const compositeScore = (engagementScore * 0.4) + (relevanceScore * 0.6);
```

### Modify Editorial Style

Edit prompt in `src/generators/index.js`:
```javascript
const prompt = `You are Tommaso Nervegna...`;
```

---

## 📊 Output Format

### Generated Editorials

**Location**: `output/editorial-YYYY-MM-DD-XXXXXX.md`

**Structure**:
```markdown
# [Title Generated by Claude]

[Introduction paragraph]

## [Section 1]
[Content with inline citations]

## [Section 2]
[Content]

## [Section 3]
[Content]

## Conclusion
[Actionable insights]

---
Sources:
1. [Title](url) - Score: 0.85
2. [Title](url) - Score: 0.78
...
```

### Email Notification

- **Subject**: `New Editorial Draft: [Title]`
- **Format**: HTML (styled) + plain text (Markdown)
- **Includes**: Rendered content, source links, scores, generation metadata

---

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+
- **AI**: Claude Sonnet 4.5 (Anthropic SDK)
- **Scraping**: RSS Parser, Axios, Cheerio, Octokit
- **Scheduling**: node-cron
- **Notifications**: Nodemailer
- **Markdown**: marked

---

## 🔐 Security Notes

- **Never commit** `.env` or credentials
- Use **Gmail App Passwords** (not account password) for SMTP
- GitHub tokens need `public_repo` scope only
- Claude API keys should be restricted in Anthropic Console

---

## 📝 Logging

- **Location**: `logs/engine-YYYY-MM-DD.log`
- **Levels**: DEBUG, INFO, WARN, ERROR
- **Set level**: `LOG_LEVEL=DEBUG` in `.env`

---

## 🗺️ Roadmap

- [ ] Add Bluesky ATP SDK integration
- [ ] Implement caching layer for scraped content
- [ ] Add unit/integration tests
- [ ] Support multiple output formats (HTML, JSON)
- [ ] Web dashboard for editorial review
- [ ] A/B testing for different prompt strategies
- [ ] Automated Substack publishing (via API)
- [ ] Semantic search across historical editorials

---

## 🤝 Contributing

This is a personal tool, but suggestions welcome:
1. Open an issue describing the improvement
2. Fork and create a feature branch
3. Submit PR with clear description

---

## 📄 License

MIT License - see LICENSE file

---

## 👤 Author

**Tommaso Nervegna**
- Substack: [nervegna.substack.com](https://nervegna.substack.com)
- Email: nervegna.tommaso@gmail.com

---

## 🙏 Acknowledgments

- **Anthropic** for Claude Sonnet 4.5 API
- **n8n** community for workflow automation patterns
- Open source maintainers of RSS Parser, Nodemailer, Octokit

---

**Built with Claude Code** 🤖
