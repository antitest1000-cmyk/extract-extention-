# 🌐 OmniExtract - Web Data, Cloud & Sitemap Harvester

**OmniExtract** is an advanced Manifest V3 Chrome Extension designed for developers, data engineers, security researchers, and SEO specialists. It extracts rich data from any webpage or an entire website, including image galleries, meta tags, cloud infrastructure links (AWS, GCP, Azure, Cloudflare, Supabase, GitHub), full XML sitemaps, and multi-page crawler aggregation.

---

## 🚀 Key Features

### 1. 🖼️ Deep Image & Asset Extraction
- Extracts all `<img>` tags, `srcset` high-res variants, `data-src` (lazy-loaded images), `<picture>` sources, and CSS `background-image` urls.
- Interactive visual gallery with thumbnail previews, dimensions (`width × height`), format badges (JPG, PNG, WebP, SVG).
- Filter images by format.
- 1-click preview in new tab, 1-click copy image URL, single download, or **batch download** all images.

### 2. 🗂️ Structured Cards & Feeds Extractor
- Extracts grouped data units (e-commerce products, blog articles, feed cards) with Title, Image, Description, Price, and Link together in exact visual order.
- One-click **Copy All**, copy as structured JSON, or click **Inspect** to highlight and jump to the card on the live web page.

### 3. 📊 HTML Table Extractor (CSV, JSON & Markdown)
- Auto-detects all `<table>` elements and structured data grids.
- Parses headers (`<th>`) and rows (`<tr>/<td>`) into clean key-value records.
- Live scrollable table preview in popup and full viewer.
- 1-click export to **CSV**, **JSON**, and **GitHub-flavored Markdown** tables.
- Click **Inspect** to highlight the table directly on the active webpage.

### 4. 📇 Leads & Contacts Dossier
- **Emails**: Extracts email addresses with smart filtration removing false-positives from `.png`, `.jpg`, `.svg`, `.js`, and `.css` files.
- **Phone Numbers**: Extracts international and domestic phone numbers via `tel:` links and robust regex.
- **Social Profiles**: Detects and organizes 12+ social networks: LinkedIn, Twitter/X, GitHub, Discord, Telegram, WhatsApp, YouTube, Instagram, Facebook, Reddit, TikTok, Medium.
- **HTML Form Endpoints**: Catalogs form actions, submission methods (`POST`/`GET`), and input fields with names, types, placeholders, and required flags.

### 5. 🤖 AI & LLM Clean Markdown Exporter
- Strips noisy page elements (navigation headers, sidebars, advertisements, footers, cookie banners).
- Converts core readable article/page content into pristine, prompt-ready **Markdown**.
- 1-click **"📋 Copy for AI"** or **"📥 Save .md"** to drop directly into ChatGPT, Claude, or Gemini prompts without wasting tokens.

### 6. ⚡ Dynamic Feed & Auto-Scroll Harvester
- Live `MutationObserver` automatically detects new elements as content loads dynamically.
- Built-in automated scroll harvester scrolls down and extracts elements on infinite-scroll pages (Instagram, Twitter, Pinterest, Unsplash), preserving them even when virtualized DOM elements unmount.

### 7. 📊 Meta, SEO & Description Tags
- Page Title, Meta Description, Keywords, Author, Robots, Canonical URL, Charset, and Language.
- **OpenGraph & Twitter Cards**: `og:title`, `og:description`, `og:image`, `og:site_name`, `twitter:card`, `twitter:image`.
- Interactive OpenGraph visual card preview.
- **Structured Data**: Automatically parses `<script type="application/ld+json">` schemas into clean JSON.
- **Heading Hierarchy**: Full H1-H6 tree with text and level tags.
- Word count and estimated reading time statistics.
- **Tech Stack Detection**: React, Next.js, Vue, Nuxt, Angular, WordPress, Shopify, Webflow, Tailwind CSS, Bootstrap, jQuery, Google Analytics.

### 8. ☁️ Cloud & Infrastructure Link Detection
Automatically scans page DOM, scripts, resource tags, and inline JavaScript code to detect and categorize cloud service endpoints:
- **Amazon Web Services (AWS)**: S3 Buckets (`*.s3.amazonaws.com`, `s3://`), CloudFront CDN (`*.cloudfront.net`), API Gateway (`*.execute-api.*.amazonaws.com`), Lambda Function URLs, Elastic Beanstalk.
- **Google Cloud Platform (GCP)**: Cloud Storage (`storage.googleapis.com/*`), Firebase (`*.firebaseio.com`, `*.web.app`, `*.firebaseapp.com`), Cloud Run (`*.run.app`), App Engine (`*.appspot.com`), Cloud Functions.
- **Microsoft Azure**: Blob Storage (`*.blob.core.windows.net`), Azure CDN (`*.azureedge.net`), Azure App Services (`*.azurewebsites.net`), CloudApp VMs (`*.cloudapp.azure.com`), Front Door.
- **Cloudflare**: Workers (`*.workers.dev`), Pages (`*.pages.dev`), R2 Object Storage (`*.r2.cloudflarestorage.com`), CDN.
- **Modern Cloud & Storage Platforms**: DigitalOcean Spaces, Supabase DB, Vercel, Netlify, Heroku, Backblaze B2, Wasabi.
- **Source Repositories**: GitHub (`github.com`, `raw.githubusercontent.com`), GitLab, Bitbucket.
- **Internal APIs**: Discovers REST (`/api/v*`, `.json`) and GraphQL endpoints from inline scripts.

### 9. 🗺️ Whole Website XML Sitemap Extractor
- Automatic discovery: checks `robots.txt` for `Sitemap:` directives and probes standard paths (`/sitemap.xml`, `/sitemap_index.xml`, `/wp-sitemap.xml`, `/sitemap/sitemap.xml`).
- Supports custom sitemap URL input for custom-named sitemaps.
- **Recursive Sitemap Index Traversal**: If the sitemap contains nested `<sitemapindex>` child files (e.g. `sitemap-posts.xml`, `sitemap-products.xml`), it follows and parses all child sitemaps automatically.
- Extracts Page URL (`<loc>`), Last Modified date (`<lastmod>`), Change Frequency (`<changefreq>`), Priority (`<priority>`), and image locations (`<image:loc>`).
- Filter sitemap URLs with instant keyword search.
- Export to `.txt` (clean URL list ready for wget / curl / python crawlers) or `.csv`.

### 10. 🕷️ In-Extension Multi-Page Site Crawler (Spider)
- Spider across internal pages of the current website up to a configured page limit (10, 25, 50, 100 pages).
- Aggregates images, links, cloud service assets, and contact emails across every visited page.
- Real-time progress bar with live status indicators.

### 11. 🖥️ Full-Screen Dashboard (Viewer)
- Dedicated full-width dashboard tab (`viewer.html`) for analyzing large datasets (thousands of sitemap URLs or hundreds of images).
- Instant global search filter across all columns.
- Formatted raw JSON tree viewer with 1-click copy.
- Comprehensive CSV / JSON / TXT exports.

### 12. 🎯 Visual Point & Pick Element Harvester (Crosshair Picker)
- Click the **🎯 Point & Pick** button in the header or Overview Quick Actions deck.
- Hover over any element on the page to see an interactive luminous highlight with tag name, CSS class, and dimensions.
- Click to extract exact text content, nested images, links, outer HTML, and unique CSS selector path with instant 1-click clipboard copy and toast notification.
- Press `Escape` anytime to cancel.

### 13. ⚡ Single Page Application (SPA) & Framework State Inspector
- Automatically discovers and extracts raw backend JSON state payloads embedded in modern SPAs:
  - **Next.js**: `<script id="__NEXT_DATA__">` (full server-side props, product lists, user profiles, routing state).
  - **Nuxt.js**: `__NUXT_DATA__` raw state arrays and hydration stores.
  - **Shopify**: `window.Shopify` and `window.ShopifyAnalytics` configuration objects.
- 1-Click **"Copy Raw JSON"** and **"Download state.json"** (bypasses noisy DOM scraping entirely!).

### 14. 🛡️ Security & Leaked API Keys Scanner
- Proactively scans page scripts, inline config objects, and environment bundles for accidentally exposed secrets:
  - **AWS Access Keys** (`AKIA...`)
  - **Google Cloud & Firebase API Keys** (`AIza...`)
  - **GitHub Personal Access Tokens** (`ghp_...`, `github_pat_...`)
  - **Stripe Public & Secret Keys** (`pk_live_...`, `sk_live_...`)
  - **Slack Bot & Webhook Tokens** (`xoxb-...`, `xoxp-...`)
  - **JSON Web Tokens (JWT) / Bearer Tokens** (`eyJ...`)
- Categorized by severity (`CRITICAL`, `WARNING`) in the Cloud & APIs tab with 1-click credential copying for bug bounty hunters and devsecops audits.

### 15. 📈 SEO Health Scorecard & Technical Audit
- Real-time 0-100 SEO health score with color-coded grade badges (Excellent, Good, Fair, Needs Work).
- Comprehensive automated checklist:
  - Title length optimization (ideal: 30-60 characters)
  - Meta description presence & length (ideal: 120-160 characters)
  - Canonical URL configuration
  - OpenGraph social sharing completeness (`og:title`, `og:image`, `og:description`)
  - H1 heading tag structure and hierarchy

### 16. ⌨️ Zero-Scroll Two-Row Command Deck with Instant Hotkeys
- Redesigned 10-tab command deck arranged in a compact 2-row layout (5 tabs per row) with zero horizontal scrolling:
  - **Row 1**: Overview, Images, Media, Cards, Tables
  - **Row 2**: Leads, Cloud & APIs, Links, Sitemap, Spider
- **Hotkeys**: Press `Alt+1` through `Alt+0` (or `Alt+9` for Sitemap) to jump directly to any tab instantly, or use `Left`/`Right` arrow keys to cycle tabs seamlessly.

---


## 📦 How to Install in Google Chrome

Loading the extension into Chrome takes less than 30 seconds:

1. Open **Google Chrome**.
2. In the URL address bar, navigate to:
   ```
   chrome://extensions/
   ```
3. In the top-right corner, enable the toggle for **Developer mode**.
4. In the top-left corner, click the **Load unpacked** button.
5. Select the folder containing this extension:
   ```
   c:\Users\antri\OneDrive\Desktop\python game
   ```
6. The **OmniExtract - Web Data, Cloud & Sitemap Harvester** icon will now appear in your Chrome toolbar!
7. *(Optional)* Click the puzzle icon in Chrome and click the **Pin** icon next to OmniExtract for 1-click access.

---

## 🛠️ Usage Guide

### A. Extract Current Page Data
1. Navigate to any website (e.g., `https://aws.amazon.com`, `https://github.com`, `https://news.ycombinator.com`, etc.).
2. Click the **OmniExtract** icon in your browser toolbar.
3. Browse the tabs:
   - **Overview**: View Page Title, Meta Description, OpenGraph preview, Tech stack, and Headings.
   - **Images**: Browse all images, filter by JPG/PNG/WebP/SVG, download individually or in batch.
   - **Cloud & APIs**: Inspect all AWS S3 buckets, Google Cloud Storage, Azure Blobs, and API endpoints found on the site.
   - **Links**: View internal links, external links, document files (PDF/DOCX/ZIP), emails, and social media profiles.

### B. Extract All URLs from the Website Sitemap
1. Click the **Sitemap** tab.
2. Click **"Extract Sitemap"** (it will automatically scan `robots.txt` and `/sitemap.xml`).
3. You can also paste an exact sitemap URL into the input field.
4. Once extracted, you will see the total URLs found, last modified dates, and change frequencies.
5. Click **"Export URLs (.txt)"** or **"Export CSV"** to save the full URL list.

### C. Spider / Crawl the Entire Website
1. Click the **Crawler** tab.
2. Choose your crawl depth (e.g. 25 or 50 pages).
3. Click **"Start Site Crawl"**.
4. Watch the crawler spider the website, aggregating images, cloud links, and URLs in real time.
5. Export the aggregated crawl results as JSON.

### D. Exporting Data
- Click the **Export** button in the top toolbar:
  - **Export Tab as JSON**
  - **Export Tab as CSV**
  - **Export URLs as TXT**
  - **Export Complete Site Data (JSON)**
- Click **"Copy"** to copy all visible URLs or items directly to your clipboard.

### E. Opening Full-Screen Dashboard
- Click the external link icon in the top header (or click "Open Full Dashboard" in the Crawler tab).
- Opens `viewer.html` in a full browser tab with large tables, sortable columns, and visual grids.

---

## 📁 Project Structure

```
├── manifest.json              # Manifest V3 extension configuration
├── icons/                     # Extension icons (16px, 32px, 48px, 128px)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── scripts/
│   ├── content.js             # In-page DOM extractor (meta, images, cloud, links)
│   └── background.js          # Service worker (sitemap XML parser, crawler, downloads)
├── popup/
│   ├── popup.html             # Sleek extension popup interface
│   ├── popup.css              # Modern dark theme styles
│   └── popup.js               # Popup controller, filtering, and export actions
├── viewer/
│   ├── viewer.html            # Full-screen data dashboard
│   ├── viewer.css             # Dashboard responsive styling
│   └── viewer.js              # Full-screen data controller & table search
└── README.md                  # Documentation and quick start guide
```

---

## 🔒 Security & Privacy
- Runs 100% locally inside your Chrome browser.
- Zero external tracking, zero analytics, zero external scripts loaded over CDN.
- All extracted data stays private on your machine.

