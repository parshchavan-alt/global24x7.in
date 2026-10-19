/**
 * Client-Side Direct Gemini API Service
 * Enables seamless API key verification and AI article generation directly from the browser
 * when deployed to static hosts like Cloudflare Pages, GitHub Pages, or when Node backend is offline.
 */

import { Article } from '../types';
import { resolveArticleImage } from './imageService';

export interface DirectTestResult {
  success: boolean;
  message: string;
  modelUsed?: string;
}

export async function testGeminiKeyDirectly(apiKey: string): Promise<DirectTestResult> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { success: false, message: 'Please provide a valid Gemini API key' };
  }

  // List of models to try for verification in order
  const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastErrorMessage = '';

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: 'Respond with OK' }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 10,
          },
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        // Not JSON
      }

      if (res.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return {
          success: true,
          modelUsed: model,
          message: `✓ Key verified successfully with Google Gemini (${model})! Connection active and articles generating.`,
        };
      }

      if (data?.error?.message) {
        lastErrorMessage = data.error.message;
        if (
          data.error.message.toLowerCase().includes('api key not valid') ||
          data.error.message.toLowerCase().includes('api_key_invalid')
        ) {
          return {
            success: false,
            message: `Google API Error: Invalid API key. Please check your key from Google AI Studio.`,
          };
        }
      }
    } catch (err: any) {
      lastErrorMessage = err.message || '';
      console.warn(`Direct test with ${model} failed:`, err);
    }
  }

  return {
    success: false,
    message: lastErrorMessage
      ? `Google API Error: ${lastErrorMessage}`
      : 'Could not connect to Google Gemini API. Please check your network connection and API key.',
  };
}

export async function generateArticleDirectly(
  apiKey: string,
  category: string,
  topic?: string,
  model = 'gemini-3.8-flash'
): Promise<{ success: boolean; article?: Article; error?: string }> {
  try {
    const isEvergreen = Math.random() > 0.4;
    const cat = category || 'Technology';
    const specificTopic = topic?.trim() || `${cat} breakthrough and industry transformation`;

    const prompt = `You are a world-class senior journalist and investigative reporter for Global 24x7 (global24x7), an elite international publication.
Synthesize a comprehensive, authoritative, deeply researched news article in English.
Category: ${cat}
Topic/Focus: ${specificTopic}
Style: High-credibility, rigorous, dynamic, journalistic narrative.

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
  "tags": ["Tag1", "Tag2", "Tag3"],
  "readingTimeMinutes": 5,
  "seo": {
    "metaTitle": "SEO meta title under 65 chars | Global 24x7",
    "metaDescription": "SEO meta description under 155 chars",
    "focusKeywords": ["keyword1", "keyword2"]
  }
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const text = await res.text();
    const data = JSON.parse(text);

    if (!res.ok) {
      return { success: false, error: data?.error?.message || `HTTP ${res.status} error from Gemini API` };
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return { success: false, error: 'Empty output from Gemini model' };
    }

    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const slug = (parsed.title || 'dispatch')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const id = `art-${Date.now()}`;

    const resolvedVisual = resolveArticleImage(cat, parsed.title, parsed.tags || []);

    const article: Article = {
      id,
      slug,
      title: parsed.title,
      summary: parsed.summary,
      content: parsed.content,
      keyTakeaways: parsed.keyTakeaways || [],
      category: cat,
      tags: parsed.tags || [cat, 'Global 24x7'],
      author: {
        name: 'Global 24x7 Editorial Desk',
        title: `${cat} Senior Correspondent`,
      },
      publishedAt: new Date().toISOString(),
      readingTimeMinutes: parsed.readingTimeMinutes || 4,
      status: 'published',
      featuredRank: 2,
      imageUrl: resolvedVisual.url,
      imageCaption: resolvedVisual.caption,
      imageCredit: resolvedVisual.credit,
      language: 'en',
      viewsCount: 1,
      likesCount: 0,
      isEvergreen,
      seo: parsed.seo || {
        metaTitle: `${parsed.title} | Global 24x7`,
        metaDescription: parsed.summary,
        focusKeywords: [cat.toLowerCase()],
      },
    };

    return { success: true, article };
  } catch (err: any) {
    return { success: false, error: err.message || 'Direct synthesis failed' };
  }
}
