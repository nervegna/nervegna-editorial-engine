# Setup Guide

Complete step-by-step setup instructions for the Nervegna Editorial Engine.

---

## Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org))
- **npm** or **yarn** package manager
- **Anthropic API key** ([get one](https://console.anthropic.com))
- **Gmail account** with App Password configured

---

## Installation Steps

### 1. Clone/Download Repository

```bash
cd /Users/nervo/Desktop/Nervo-Projects/nervegna-editorial-engine
```

### 2. Install Dependencies

```bash
npm install
```

Expected output:
```
added 150 packages in 12s
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# REQUIRED - Get from https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# REQUIRED - Gmail settings
SMTP_USER=nervegna.tommaso@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # App Password, not account password

# OPTIONAL - Add your RSS feeds
SUBSTACK_FEEDS=https://aitidbits.substack.com/feed,https://simonwillison.net/atom/everything/
MEDIUM_FEEDS=https://medium.com/feed/@yoheinakajima

# OPTIONAL - GitHub (increases rate limits)
GITHUB_TOKEN=ghp_xxxxx

# OPTIONAL - Social media
MASTODON_TOKEN=xxxxx
```

---

## Getting API Keys & Credentials

### Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in/create account
3. Navigate to **API Keys**
4. Click **Create Key**
5. Copy key starting with `sk-ant-`
6. Paste into `.env` → `ANTHROPIC_API_KEY`

**Pricing**: ~$3 per 1M input tokens, ~$15 per 1M output tokens (Claude Sonnet 4.5)

### Gmail App Password

Regular Gmail password won't work due to 2FA. Use App Password:

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (if not already)
3. Search for **App Passwords** (or go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords))
4. Select:
   - App: **Mail**
   - Device: **Other** (name it "Editorial Engine")
5. Click **Generate**
6. Copy 16-character password (format: `xxxx xxxx xxxx xxxx`)
7. Paste into `.env` → `SMTP_PASS` (remove spaces)

### GitHub Token (Optional)

Without token: 60 requests/hour (might be sufficient)
With token: 5,000 requests/hour

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token** → **Classic**
3. Set:
   - Name: "Editorial Engine"
   - Expiration: 90 days (or custom)
   - Scopes: ✓ `public_repo` only
4. Click **Generate token**
5. Copy token starting with `ghp_`
6. Paste into `.env` → `GITHUB_TOKEN`

### Mastodon Token (Optional)

1. Log into your Mastodon instance
2. Go to **Preferences** → **Development**
3. Click **New Application**
4. Set:
   - Name: "Editorial Engine"
   - Scopes: `read:statuses` only
5. Click **Submit**
6. Copy access token
7. Paste into `.env` → `MASTODON_TOKEN`

---

## RSS Feed Configuration

### Finding Substack Feeds

Any Substack URL → append `/feed`:
- Blog: `https://example.substack.com`
- Feed: `https://example.substack.com/feed`

**Recommended AI-focused Substacks**:
```
https://aitidbits.substack.com/feed
https://simonwillison.net/atom/everything/
https://www.aisnakeoil.com/feed
https://www.latent.space/feed
```

### Finding Medium Feeds

User feed: `https://medium.com/feed/@username`
Publication feed: `https://medium.com/feed/publication-name`

**Recommended Medium AI writers**:
```
https://medium.com/feed/@yoheinakajima
https://medium.com/feed/@cobusgreyling
https://medium.com/feed/towards-data-science
```

### Multiple Feeds

Comma-separated in `.env`:
```bash
SUBSTACK_FEEDS=https://feed1.substack.com/feed,https://feed2.substack.com/feed
```

---

## Verification

### Test Configuration

```bash
node -e "import('./src/config/index.js').then(({config}) => console.log(config))"
```

Should output your config (API keys masked).

### Test Scraping

```bash
npm run scrape
```

Expected output:
```
Scraping 4 RSS feeds...
Scraped 25 items from https://...
Scraped 18 items from https://...
Total content items scraped: 43
```

### Test Full Workflow

```bash
npm start -- --now
```

Expected output:
```
=== Starting Nervegna Editorial Engine Workflow ===
Step 1/4: Scraping content...
Step 2/4: Ranking content...
Step 3/4: Generating editorial...
Step 4/4: Sending notification...
=== Workflow completed successfully in 28.5s ===
```

Check:
- `output/editorial-*.md` file created
- Email received at configured address

---

## Troubleshooting

### Error: "Missing API key"

**Problem**: `ANTHROPIC_API_KEY` not set or invalid

**Solution**:
1. Check `.env` file exists (not `.env.example`)
2. Verify key format: `sk-ant-api03-...`
3. Test key in Anthropic Console
4. Restart process after `.env` changes

### Error: "Invalid login" (Email)

**Problem**: Regular password used instead of App Password

**Solution**:
1. Generate Gmail App Password (see above)
2. Use 16-character password (remove spaces)
3. Check `SMTP_USER` matches the Gmail account

### Error: "API rate limit exceeded" (GitHub)

**Problem**: Hitting 60 requests/hour limit (unauthenticated)

**Solutions**:
1. Add `GITHUB_TOKEN` to `.env` (5,000/hour limit)
2. Reduce `config.github.topics` array length
3. Increase `minStars` threshold (fewer results)

### Warning: "No content passed ranking threshold"

**Problem**: All scraped items filtered out

**Solutions**:
1. Lower thresholds in `.env`:
   ```bash
   MIN_ENGAGEMENT_SCORE=0.2  # was 0.3
   MIN_RELEVANCE_SCORE=0.4   # was 0.6
   ```
2. Adjust `POV_KEYWORDS` to match your feeds
3. Check feeds are returning recent content

### Error: "ECONNREFUSED" (Email)

**Problem**: SMTP connection blocked

**Solutions**:
1. Check firewall/antivirus isn't blocking port 587
2. Try `SMTP_PORT=465` with `secure: true`
3. Verify Gmail allows "Less secure app access" (deprecated, use App Passwords)

---

## Next Steps

Once setup is complete:

1. **Test run**: `npm start -- --now` to verify end-to-end
2. **Review output**: Check `output/editorial-*.md` quality
3. **Tune scoring**: Adjust thresholds in `.env`
4. **Start scheduler**: `npm start` (runs every 72h)
5. **Optional**: Set up n8n workflow (see `workflows/n8n-workflow.json`)

---

## Production Deployment

### Running as System Service (macOS)

Create `~/Library/LaunchAgents/com.nervegna.editorial.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.nervegna.editorial</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/nervo/Desktop/Nervo-Projects/nervegna-editorial-engine/src/index.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/Users/nervo/Desktop/Nervo-Projects/nervegna-editorial-engine/logs/error.log</string>
    <key>StandardOutPath</key>
    <string>/Users/nervo/Desktop/Nervo-Projects/nervegna-editorial-engine/logs/output.log</string>
</dict>
</plist>
```

Load service:
```bash
launchctl load ~/Library/LaunchAgents/com.nervegna.editorial.plist
```

### Running as System Service (Linux)

Create `/etc/systemd/system/editorial-engine.service`:

```ini
[Unit]
Description=Nervegna Editorial Engine
After=network.target

[Service]
Type=simple
User=nervo
WorkingDirectory=/path/to/nervegna-editorial-engine
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable service:
```bash
sudo systemctl enable editorial-engine
sudo systemctl start editorial-engine
```

### Using PM2 (Cross-platform)

```bash
npm install -g pm2

pm2 start src/index.js --name editorial-engine
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

---

## Support

Issues? Check:
1. Logs: `logs/engine-YYYY-MM-DD.log`
2. GitHub Issues: [Repository URL]
3. Email: nervegna.tommaso@gmail.com

---

**Last Updated**: 2024-02-13
