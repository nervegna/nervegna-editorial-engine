#!/usr/bin/env node

/**
 * Test script to verify API connections and configuration
 * Usage: node scripts/test-connection.js
 */

import Anthropic from '@anthropic-ai/sdk';
import nodemailer from 'nodemailer';
import { Octokit } from 'octokit';
import config from '../src/config/index.js';

console.log('🔍 Testing Nervegna Editorial Engine Connections\n');

// Test Anthropic API
async function testAnthropic() {
  console.log('1️⃣  Testing Anthropic API...');

  if (!config.anthropic.apiKey) {
    console.log('   ❌ No API key configured\n');
    return false;
  }

  try {
    const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });
    const message = await anthropic.messages.create({
      model: config.anthropic.model,
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Reply with OK' }],
    });

    console.log('   ✅ Anthropic API working');
    console.log(`   Model: ${config.anthropic.model}`);
    console.log(`   Response: ${message.content[0].text}\n`);
    return true;
  } catch (error) {
    console.log('   ❌ Anthropic API failed:', error.message, '\n');
    return false;
  }
}

// Test Email (SMTP)
async function testEmail() {
  console.log('2️⃣  Testing Email (SMTP)...');

  if (!config.email.auth.user || !config.email.auth.pass) {
    console.log('   ❌ Email credentials not configured\n');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: config.email.auth,
    });

    await transporter.verify();

    console.log('   ✅ SMTP connection working');
    console.log(`   Host: ${config.email.host}:${config.email.port}`);
    console.log(`   User: ${config.email.auth.user}\n`);
    return true;
  } catch (error) {
    console.log('   ❌ SMTP connection failed:', error.message, '\n');
    return false;
  }
}

// Test GitHub API
async function testGitHub() {
  console.log('3️⃣  Testing GitHub API...');

  try {
    const octokit = config.github.token
      ? new Octokit({ auth: config.github.token })
      : new Octokit();

    const { data } = await octokit.rest.rateLimit.get();

    const authenticated = !!config.github.token;
    console.log('   ✅ GitHub API working');
    console.log(`   Authenticated: ${authenticated}`);
    console.log(`   Rate limit: ${data.rate.remaining}/${data.rate.limit}\n`);
    return true;
  } catch (error) {
    console.log('   ❌ GitHub API failed:', error.message, '\n');
    return false;
  }
}

// Test RSS Feeds
async function testRSS() {
  console.log('4️⃣  Testing RSS Feeds...');

  const allFeeds = [...config.feeds.substack, ...config.feeds.medium];

  if (allFeeds.length === 0) {
    console.log('   ⚠️  No RSS feeds configured\n');
    return false;
  }

  console.log(`   Found ${allFeeds.length} configured feeds`);

  let workingFeeds = 0;
  for (const feed of allFeeds.slice(0, 3)) { // Test first 3 only
    try {
      const response = await fetch(feed);
      if (response.ok) {
        workingFeeds++;
        console.log(`   ✅ ${feed.substring(0, 50)}...`);
      } else {
        console.log(`   ❌ ${feed} - HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${feed} - ${error.message}`);
    }
  }

  console.log(`   ${workingFeeds}/${Math.min(allFeeds.length, 3)} feeds accessible\n`);
  return workingFeeds > 0;
}

// Run all tests
async function runTests() {
  const results = {
    anthropic: await testAnthropic(),
    email: await testEmail(),
    github: await testGitHub(),
    rss: await testRSS(),
  };

  console.log('=' .repeat(50));
  console.log('📊 Test Summary\n');

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  console.log(`Anthropic API:  ${results.anthropic ? '✅' : '❌'}`);
  console.log(`Email (SMTP):   ${results.email ? '✅' : '❌'}`);
  console.log(`GitHub API:     ${results.github ? '✅' : '❌'}`);
  console.log(`RSS Feeds:      ${results.rss ? '✅' : '❌'}`);

  console.log(`\nTotal: ${passed}/${total} passed`);

  if (passed === total) {
    console.log('\n✅ All systems ready! You can run: npm start -- --now\n');
  } else {
    console.log('\n⚠️  Some systems need configuration. Check .env file.\n');
  }

  process.exit(passed === total ? 0 : 1);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
