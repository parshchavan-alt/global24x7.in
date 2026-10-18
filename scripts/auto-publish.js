#!/usr/bin/env node
/**
 * Global 24x7 Autonomous 24/7 Cloud Publisher
 * Runs automatically via GitHub Actions or local node cron.
 * Generates an in-depth journalistic article, updates seedArticles.ts & articles.json,
 * and commits back to Git, triggering Cloudflare Pages to deploy the new article live!
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 1. Resolve Gemini API Key
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  try {
    const keysPath = path.join(__dirname, '..', '.data', 'api-keys.json');
    if (fs.existsSync(keysPath)) {
      const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
      if (Array.isArray(keys) && keys.length > 0) {
        apiKey = keys[0].key;
      }
    }
  } catch {}
}

if (!apiKey) {
  console.error('[Global 24x7 Auto-Publisher] Error: No GEMINI_API_KEY found in environment or .data/api-keys.json');
  process.exit(1);
}

const CATEGORIES = ['Technology', 'Business', 'World', 'Science', 'Health', 'Culture', 'Climate', 'Sports'];
const selectedCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

console.log(`[Global 24x7 Auto-Publisher] Triggering scheduled dispatch for category: ${selectedCategory}...`);

const prompt = `You are a world-class senior journalist and investigative correspondent for Global 24x7 (global24x7), an elite international publication.
Synthesize an authoritative, in-depth, deeply researched news article in English.
Category: ${selectedCategory}
Style: High-credibility, rigorous, dynamic, journalistic broadsheet narrative.

You MUST respond strictly with valid JSON with this exact schema (no markdown fences, just pure JSON):
{
  "title": "Compelling, journalistic headline under 95 characters",
  "summary": "1-2 sentence executive briefing overview under 220 characters",
  "content": "Full in-depth markdown article (at least 450 words) with ## Subheadings, analytical depth, expert perspectives, and global context",
  "keyTakeaways": [
    "Key strategic takeaway 1",
    "Key strategic takeaway 2",
    "Key strategic takeaway 3"
  ],
  "tags": ["${selectedCategory}", "Global 24x7", "Analysis"],
  "readingTimeMinutes": 5,
  "seo": {
    "metaTitle": "SEO meta title under 65 chars | Global 24x7",
    "metaDescription": "SEO meta description under 155 chars",
    "focusKeywords": ["${selectedCategory.toLowerCase()}", "global 24x7 news"]
  }
}`;

function callGemini(key, model = 'gemini-2.5-flash') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${model}:generateContent?key=${key}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error?.message || `HTTP ${res.statusCode}: ${body}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  try {
    let result;
    try {
      result = await callGemini(apiKey, 'gemini-2.5-flash');
    } catch (e1) {
      console.warn('[Global 24x7] gemini-2.5-flash failed, trying gemini-1.5-flash...', e1.message);
      result = await callGemini(apiKey, 'gemini-1.5-flash');
    }

    const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('No candidate content received from Gemini model');

    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const articleData = JSON.parse(cleaned);

    const slug = (articleData.title || 'dispatch')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const id = `art-${Date.now()}`;

    const newArticle = {
      id,
      slug,
      title: articleData.title,
      summary: articleData.summary,
      content: articleData.content,
      keyTakeaways: articleData.keyTakeaways || [],
      category: selectedCategory,
      tags: articleData.tags || [selectedCategory, 'Global 24x7'],
      author: {
        name: 'Global 24x7 Editorial Desk',
        title: `${selectedCategory} Senior Correspondent`,
      },
      publishedAt: new Date().toISOString(),
      readingTimeMinutes: articleData.readingTimeMinutes || 5,
      status: 'published',
      featuredRank: 2,
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      imageCaption: `${selectedCategory} strategic intelligence and editorial analysis.`,
      imageCredit: {
        photographer: 'Global 24x7 Staff',
        source: 'Global 24x7 Wire',
        license: 'Editorial',
      },
      language: 'en',
      viewsCount: 1,
      likesCount: 0,
      isEvergreen: Math.random() > 0.4,
      seo: articleData.seo || {
        metaTitle: `${articleData.title} | Global 24x7`,
        metaDescription: articleData.summary,
        focusKeywords: [selectedCategory.toLowerCase()],
      },
    };

    console.log(`[Global 24x7] Synthesized: "${newArticle.title}"`);

    // 1. Update .data/articles.json if exists
    const articlesJsonPath = path.join(__dirname, '..', '.data', 'articles.json');
    if (fs.existsSync(articlesJsonPath)) {
      try {
        const articles = JSON.parse(fs.readFileSync(articlesJsonPath, 'utf8'));
        articles.unshift(newArticle);
        fs.writeFileSync(articlesJsonPath, JSON.stringify(articles, null, 2), 'utf8');
        console.log(`[Global 24x7] Updated ${articlesJsonPath}`);
      } catch (err) {
        console.warn('Could not update .data/articles.json:', err.message);
      }
    }

    // 2. Update src/data/seedArticles.ts
    const seedArticlesPath = path.join(__dirname, '..', 'src', 'data', 'seedArticles.ts');
    if (fs.existsSync(seedArticlesPath)) {
      let content = fs.readFileSync(seedArticlesPath, 'utf8');
      const insertMarker = 'export const INITIAL_ARTICLES: Article[] = [';
      if (content.includes(insertMarker)) {
        const articleFormatted = `\n  ${JSON.stringify(newArticle, null, 2).replace(/\n/g, '\n  ')},`;
        content = content.replace(insertMarker, `${insertMarker}${articleFormatted}`);
        fs.writeFileSync(seedArticlesPath, content, 'utf8');
        console.log(`[Global 24x7] Successfully injected new article into ${seedArticlesPath}`);
      }
    }

    console.log('[Global 24x7] Auto-publishing cycle completed successfully!');
  } catch (err) {
    console.error('[Global 24x7] Auto-publishing failed:', err);
    process.exit(1);
  }
}

run();
