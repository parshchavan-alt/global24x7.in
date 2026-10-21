# Implementation Plan: Context-Aware Visuals, Full Backups, Internet Media Import, Unique URLs & Editorial AI

## Overview of Added Requirements
1. **Article & System Backups**: 1-click full JSON backup export & restore mechanism to prevent data loss across server resets, code deploys, and container migrations.
2. **Find & Import Internet Media**: Search copyright-free internet press photos (Wikimedia Commons, Public Domain wires), auto-download and store them locally on the server `/media/`, with full photographer and license attribution.
3. **Guaranteed Unique Article URLs (Slug De-duplication)**: Strict algorithm ensuring no two articles ever share the same slug or URL.
4. **Context-Aware Visual Generation**: Gemini generates concrete visual descriptions of real-world scenes rather than abstract jargon, solving image-article mismatch.
5. **Fix Editorial Authentication on Upload**: Auto-inject admin tokens and passcodes in all media endpoints so image uploads never fail with 401.
6. **Smart Editorial AI Suite**: Added AI Headline Optimizer, Fact-Check & Verification Scanner, and Executive TL;DR generator.

---

## Technical Specifications & Architecture

### 1. Data Preservation & 1-Click Backups (Articles, Media & Settings)
- **Export Endpoint (`/api/backup/export`)**: Compiles all current articles (English + Hindi), categories, media registry, scheduler configs, branding, AdSense settings, and custom HTML/CSS into a single portable backup file (`global24x7-backup-[timestamp].json`).
- **Import / Restore Endpoint (`/api/backup/restore`)**: Allows the administrator to upload any previous backup JSON. Merges or replaces articles safely, writes to disk `.data/`, updates memory caches, and syncs with Cloudflare D1 if configured.
- **Client Auto-Snapshot**: Automatic periodic snapshot in browser `localStorage` and IndexedDB as a fail-safe against sudden hosting shutdowns.
- **Admin UI**: Add dedicated "Data Backup & Recovery" card in `ArticlesCMS.tsx` and `AdminDashboard.tsx` with one-click "Download Full Backup (.json)" and "Restore from Backup".

### 2. Context-Aware Visuals & Internet Media Import with Credit
- **Gemini Visual Scene Synthesis**:
  - Update article generation prompts in `server.ts` and `src/utils/geminiDirect.ts` to output:
    - `visualScenePrompt`: Concrete, photographic real-world scene description (e.g. *"Telephoto press photo of cleanroom engineers in white bunny suits inspecting a glowing 3nm silicon wafer on a robotic stage"*).
    - `visualSearchKeywords`: Real-world named entities (e.g. `["TSMC", "silicon wafer", "cleanroom"]`).
- **Find & Import Internet Media Engine (`searchAndImportInternetImage`)**:
  - Queries Wikimedia Commons API for authentic high-resolution, copyright-free press photography matching `visualSearchKeywords`.
  - Automatically fetches the media file, downloads it to the server `/media/` folder, and registers it in `media-index.json`.
  - Automatically attributes the real photographer, original Wikimedia link, and specific license (e.g., CC BY-SA 4.0 or Public Domain).
- **CMS "Find & Import Internet Media" Modal**:
  - In `ArticlesCMS.tsx`, add an interactive internet media finder modal. Admins can enter any search query, browse real copyright-free press photos with thumbnails and license tags, and click **"Import & Save to Server Storage"** to instantly localize and link it to the article.

### 3. Strict Slug & URL De-Duplication Engine
- **Slug Generation Algorithm**:
  - `generateUniqueArticleSlug(title: string, existingArticles: Article[], currentArticleId?: string): string`
  - Normalizes title to clean kebab-case: e.g., `india-gdp-growth-q3`.
  - If a collision is detected among existing articles, automatically appends a short deterministic suffix or numeric counter (e.g. `india-gdp-growth-q3-2` or `india-gdp-growth-q3-8f2b`).
  - Enforced in both `server.ts` autonomous scheduler cycles and manual article creation/saving in `ArticlesCMS.tsx`.

### 4. Seamless Editorial Authentication for Media Uploads
- **Fetch Interceptor**: In `src/utils/apiSafe.ts`, ensure every network request to `/api/*` automatically includes:
  - `x-admin-token` and `Authorization: Bearer <token>` from `sessionStorage` or `localStorage`.
  - `x-admin-passcode` from `localStorage` as an authenticated fallback.
- **MediaManagerPanel & ArticlesCMS**: Replace any remaining raw `fetch` calls with `safeFetchJson` with proper error handling and re-authentication prompts.
- **Server Resilience**: Allow signature verification with both environment `SESSION_SECRET` and stored `authConfig.sessionSecret`.

### 5. Advanced Editorial AI Tools
- **AI Headline & SEO Optimizer**: Analyzes draft content and generates 5 high-converting headlines (Broadsheet, Breaking Wire, SEO-Optimized, Explainer, and Viral Social) with predicted CTR and 60-character SEO title tags.
- **AI Fact-Check & Verification Scanner**: Scans article claims, identifies statistics/dates/assertions, flags statements requiring verification, and outputs an editorial confidence score.
- **AI Executive TL;DR & Bullet Summary Generator**: Generates clean 3-bullet takeaway cards and a 30-second audio-ready news briefing script.

---

## Step-by-Step Implementation Flow

1. **`src/utils/slugs.ts`**: Create slug sanitization and collision-detection utility.
2. **`src/utils/imageService.ts`**:
   - Add Wikimedia Commons search and metadata parsing.
   - Upgrade AI prompt construction to use scene-aware descriptions.
   - Remove static repetitive stock lists.
3. **`server.ts`**:
   - Update Gemini system prompts with `visualScenePrompt` and `visualSearchKeywords`.
   - Add `/api/backup/export` and `/api/backup/restore` with full validation.
   - Add `/api/media/search-and-import-web` endpoint to search Wikimedia, download image locally to `/media/`, and return local path + credit.
   - Add slug uniqueness verification in `executeAutonomousArticleGeneration` and article POST/PUT routes.
   - Add `/api/ai/optimize-headline` and `/api/ai/fact-check` endpoints using Gemini.
4. **`src/utils/apiSafe.ts`**:
   - Global fetch interceptor to automatically attach admin token and passcode to all `/api/*` requests.
5. **Frontend Components**:
   - **`MediaManagerPanel.tsx`**: Update all actions to `safeFetchJson`; add "Search & Import Internet Media" tool.
   - **`ArticlesCMS.tsx`**: Add "Import Internet Photo", "Generate AI Visual", "Optimize Headline", "Fact-Check Article", and "Backup / Restore Articles" buttons.
   - **`AutoSchedulerPanel.tsx`**: Add image mode switch ("AI Scene-Aware", "Live Wikimedia Press", "Smart Hybrid").
   - **`AdminDashboard.tsx`**: Add Backup & Restore card in Data/Settings tab.

---

## Verification Plan

### Automated & Compilation Tests
- Run `compile_applet` to verify TypeScript compliance across all modified components.
- Verify JSON schemas for backup export and import.

### Manual Verification
1. **Backup & Restore**: Export backup JSON, verify all articles/settings are included, test restoration flow.
2. **Media Upload**: Upload image in Media Manager and CMS; verify no 401 error occurs.
3. **Internet Media Import**: Search for a topic (e.g. "SpaceX rocket" or "G20 Summit"), import photo, verify it is saved locally in `/media/` and displays correct CC-BY credit.
4. **Duplicate Slug Test**: Create two articles with the exact same headline; verify their generated URLs are distinct.
5. **AI Editorial Tools**: Run Headline Optimizer and Fact-Check Scanner on a draft article.
