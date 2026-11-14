/**
 * OmniExtract - Background Service Worker (Manifest V3)
 * Handles sitemap discovery, XML parsing, multi-page crawling, file downloads, and data storage.
 */

// Global active crawl state
let activeCrawl = {
  isRunning: false,
  isPaused: false,
  shouldStop: false,
  domain: '',
  visitedUrls: new Set(),
  queue: [],
  maxPages: 50,
  results: {
    pages: [],
    allImages: new Map(),
    allCloudLinks: new Map(),
    allLinks: new Map(),
    allEmails: new Set()
  }
};

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 1. Sitemap Extraction
  if (request.action === 'FETCH_SITEMAP') {
    handleSitemapExtraction(request.targetUrl, request.customSitemapUrl)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }

  // 2. Start Multi-Page Site Crawler
  if (request.action === 'START_CRAWL') {
    startSiteCrawl(request.startUrl, request.maxPages || 30)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // 3. Crawler controls
  if (request.action === 'STOP_CRAWL') {
    activeCrawl.shouldStop = true;
    activeCrawl.isRunning = false;
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'GET_CRAWL_STATUS') {
    sendResponse({
      isRunning: activeCrawl.isRunning,
      pagesCrawled: activeCrawl.visitedUrls.size,
      queueSize: activeCrawl.queue.length,
      imagesFound: activeCrawl.results.allImages.size,
      cloudFound: activeCrawl.results.allCloudLinks.size,
      linksFound: activeCrawl.results.allLinks.size
    });
    return true;
  }

  // 4. Batch Download Files
  if (request.action === 'DOWNLOAD_FILE') {
    chrome.downloads.download({
      url: request.url,
      filename: request.filename || 'download',
      saveAs: request.saveAs || false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId });
      }
    });
    return true;
  }

  // 5. Open Full Viewer
  if (request.action === 'OPEN_VIEWER') {
    chrome.storage.local.set({ omniExtractActiveData: request.data }, () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('viewer/viewer.html') });
      sendResponse({ success: true });
    });
    return true;
  }
});

/**
 * =========================================================================
 * SITEMAP DISCOVERY & PARSING ENGINE (High-Speed Streaming & Budgeted)
 * =========================================================================
 */
async function handleSitemapExtraction(targetUrl, customSitemapUrl) {
  const urlObj = new URL(targetUrl);
  const origin = urlObj.origin;
  const alternateOrigin = origin.includes('://www.') 
    ? origin.replace('://www.', '://') 
    : origin.replace('://', '://www.');

  const discoveredSitemaps = [];
  const allUrls = new Map();
  const candidateUrls = [];

  // 1. If user provided a specific sitemap URL, prioritize it first
  if (customSitemapUrl && customSitemapUrl.trim()) {
    candidateUrls.push(customSitemapUrl.trim());
  }

  // 2. If targetUrl itself is an XML sitemap, prioritize it
  if (targetUrl && (targetUrl.endsWith('.xml') || targetUrl.includes('sitemap'))) {
    if (!candidateUrls.includes(targetUrl)) candidateUrls.push(targetUrl);
  }

  // 3. Check robots.txt on origin and alternate origin
  for (const org of [origin, alternateOrigin]) {
    try {
      const robotsUrl = `${org}/robots.txt`;
      const robotsRes = await fetch(robotsUrl, { cache: 'no-cache' });
      if (robotsRes.ok) {
        const robotsTxt = await robotsRes.text();
        const sitemapMatches = robotsTxt.matchAll(/^[ \t]*Sitemap:[ \t]*([^\r\n]+)/gmi);
        for (const m of sitemapMatches) {
          const smUrl = m[1].trim();
          if (smUrl && !candidateUrls.includes(smUrl)) {
            candidateUrls.push(smUrl);
          }
        }
      }
    } catch (e) {}
  }

  // 4. Standard sitemap paths to probe
  const standardPaths = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap-index.xml',
    '/wp-sitemap.xml',
    '/sitemap/sitemap.xml'
  ];

  [origin, alternateOrigin].forEach(org => {
    standardPaths.forEach(p => {
      const full = `${org}${p}`;
      if (!candidateUrls.includes(full)) candidateUrls.push(full);
    });
  });

  const visitedSitemaps = new Set();
  const queue = [...candidateUrls];
  let subSitemapsTotal = 0;
  const startTime = Date.now();

  // Process sitemaps with a tight budget to never hit the 30s service worker limit
  while (queue.length > 0 && visitedSitemaps.size < 15) {
    if (Date.now() - startTime > 7000) break; // Hard safety cutoff at 7 seconds
    if (allUrls.size >= 8000) break; // Safety cap to fit Chrome message IPC

    const sitemapUrl = queue.shift();
    if (visitedSitemaps.has(sitemapUrl)) continue;
    visitedSitemaps.add(sitemapUrl);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(sitemapUrl, {
        headers: { 'Accept': 'application/xml, text/xml, */*' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const xmlText = await res.text();
      if (!xmlText || (!xmlText.includes('<urlset') && !xmlText.includes('<sitemapindex') && !xmlText.includes('<sitemap'))) {
        continue;
      }

      discoveredSitemaps.push(sitemapUrl);

      // Check if this is a Sitemap Index
      const isIndex = /<sitemapindex[\s>]/i.test(xmlText) || /<sitemap[\s>]/i.test(xmlText);
      if (isIndex) {
        const subSitemaps = extractSitemapIndexUrlsFast(xmlText);
        subSitemapsTotal += subSitemaps.length;

        // Add sub-sitemaps directly so user has full index list
        subSitemaps.forEach(childUrl => {
          if (!allUrls.has(childUrl)) {
            allUrls.set(childUrl, {
              url: childUrl,
              lastmod: '',
              changefreq: '',
              priority: '',
              source: 'Sitemap Index Entry',
              isSubSitemap: true
            });
          }
        });

        // Enqueue first 2 sub-sitemaps to extract leaf URLs quickly
        subSitemaps.slice(0, 2).forEach(childUrl => {
          if (!visitedSitemaps.has(childUrl) && !queue.includes(childUrl)) {
            queue.push(childUrl);
          }
        });
      }

      // Fast streaming regex extraction
      const urlsFound = parseSitemapUrlsFast(xmlText, sitemapUrl);
      urlsFound.forEach(item => {
        if (!allUrls.has(item.url)) {
          allUrls.set(item.url, item);
        }
      });

    } catch (e) {
      console.warn(`[OmniExtract] Failed parsing sitemap ${sitemapUrl}:`, e);
    }
  }

  if (allUrls.size === 0 && discoveredSitemaps.length === 0) {
    throw new Error(`No sitemap found for ${origin}. Checked robots.txt and standard paths.`);
  }

  return {
    origin: origin,
    discoveredSources: discoveredSitemaps,
    isIndex: subSitemapsTotal > 0,
    indexCount: subSitemapsTotal,
    totalUrls: allUrls.size,
    urls: Array.from(allUrls.values())
  };
}

/**
 * Fast single-pass regex extraction of sitemap index links
 */
function extractSitemapIndexUrlsFast(xml) {
  const list = [];
  const locRegex = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    const u = match[1].trim();
    if (u.startsWith('http://') || u.startsWith('https://')) {
      list.push(u);
    }
  }
  return list;
}

/**
 * Fast streaming regex extraction of page URLs (Runs in < 70ms on 50k URLs)
 */
function parseSitemapUrlsFast(xml, sourceFile) {
  const results = [];
  const locRegex = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1].trim();
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      results.push({
        url: url,
        lastmod: '',
        changefreq: '',
        priority: '',
        source: sourceFile
      });
    }
    if (results.length >= 8000) break; // Don't overflow Chrome IPC
  }
  return results;
}

/**
 * =========================================================================
 * WHOLE-WEBSITE SPIDER / CRAWLER ENGINE
 * =========================================================================
 */
async function startSiteCrawl(startUrl, maxPages = 30) {
  const urlObj = new URL(startUrl);
  const domain = urlObj.hostname;
  const origin = urlObj.origin;

  activeCrawl = {
    isRunning: true,
    isPaused: false,
    shouldStop: false,
    domain: domain,
    visitedUrls: new Set(),
    queue: [startUrl],
    maxPages: Math.min(maxPages, 150),
    results: {
      pages: [],
      allImages: new Map(),
      allCloudLinks: new Map(),
      allLinks: new Map(),
      allEmails: new Set()
    }
  };

  while (activeCrawl.queue.length > 0 &&
         activeCrawl.visitedUrls.size < activeCrawl.maxPages &&
         !activeCrawl.shouldStop) {

    const currentUrl = activeCrawl.queue.shift();
    if (activeCrawl.visitedUrls.has(currentUrl)) continue;
    activeCrawl.visitedUrls.add(currentUrl);

    try {
      const res = await fetch(currentUrl, {
        headers: { 'Accept': 'text/html,application/xhtml+xml' }
      });

      if (!res.ok) continue;
      const html = await res.text();

      // Parse HTML text directly via regex extracts
      const pageData = parseHtmlQuick(html, currentUrl, origin);

      activeCrawl.results.pages.push({
        url: currentUrl,
        title: pageData.title,
        description: pageData.description,
        imageCount: pageData.images.length,
        cloudCount: pageData.cloudLinks.length
      });

      // Merge Images
      pageData.images.forEach(img => {
        if (!activeCrawl.results.allImages.has(img.url)) {
          activeCrawl.results.allImages.set(img.url, img);
        }
      });

      // Merge Cloud Links
      pageData.cloudLinks.forEach(c => {
        if (!activeCrawl.results.allCloudLinks.has(c.url)) {
          activeCrawl.results.allCloudLinks.set(c.url, c);
        }
      });

      // Merge Links
      pageData.links.forEach(l => {
        if (!activeCrawl.results.allLinks.has(l.url)) {
          activeCrawl.results.allLinks.set(l.url, l);
        }

        // Add to queue if internal and not visited
        if (l.isInternal && !activeCrawl.visitedUrls.has(l.url) && !activeCrawl.queue.includes(l.url)) {
          // Avoid non-html assets in crawl queue
          if (!l.url.match(/\.(jpg|jpeg|png|gif|svg|pdf|zip|css|js|webp)$/i)) {
            activeCrawl.queue.push(l.url);
          }
        }
      });

      // Merge emails
      pageData.emails.forEach(e => activeCrawl.results.allEmails.add(e));

      // Broadcast progress update
      try {
        chrome.runtime.sendMessage({
          action: 'CRAWL_PROGRESS',
          pagesCrawled: activeCrawl.visitedUrls.size,
          maxPages: activeCrawl.maxPages,
          queueLength: activeCrawl.queue.length,
          currentUrl: currentUrl,
          totalImages: activeCrawl.results.allImages.size,
          totalCloud: activeCrawl.results.allCloudLinks.size,
          totalLinks: activeCrawl.results.allLinks.size
        }).catch(() => {});
      } catch (e) {}

      // Slight delay between requests to be polite to servers
      await new Promise(r => setTimeout(r, 200));

    } catch (e) {
      console.warn(`[OmniExtract] Crawler error fetching ${currentUrl}:`, e);
    }
  }

  activeCrawl.isRunning = false;

  return {
    domain: domain,
    pagesCrawled: activeCrawl.visitedUrls.size,
    pages: activeCrawl.results.pages,
    images: Array.from(activeCrawl.results.allImages.values()),
    cloudLinks: Array.from(activeCrawl.results.allCloudLinks.values()),
    links: Array.from(activeCrawl.results.allLinks.values()),
    emails: Array.from(activeCrawl.results.allEmails)
  };
}

/**
 * Lightweight HTML parser for background crawler
 */
function parseHtmlQuick(html, pageUrl, origin) {
  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

  // Meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : '';

  // Images
  const images = [];
  const imgMatches = html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi);
  for (const m of imgMatches) {
    try {
      const src = new URL(m[1], pageUrl).href;
      images.push({
        url: src,
        foundOnPage: pageUrl,
        type: 'img'
      });
    } catch (e) {}
  }

  // Links
  const links = [];
  const linkMatches = html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi);
  for (const m of linkMatches) {
    try {
      const href = m[1].trim();
      if (!href || href.startsWith('javascript:') || href.startsWith('#')) continue;
      const fullUrl = new URL(href, pageUrl).href;
      const urlObj = new URL(fullUrl);
      const isInternal = (urlObj.origin === origin);

      links.push({
        url: fullUrl,
        isInternal: isInternal,
        foundOnPage: pageUrl
      });
    } catch (e) {}
  }

  // Cloud links
  const cloudLinks = [];
  const cloudRules = [
    { regex: /https?:\/\/[a-z0-9.-]+\.s3[a-z0-9.-]*\.amazonaws\.com[^\s"',<>)]+/gi, provider: 'AWS', category: 'S3 Object Storage' },
    { regex: /https?:\/\/[a-z0-9.-]+\.cloudfront\.net[^\s"',<>)]+/gi, provider: 'AWS', category: 'CloudFront CDN' },
    { regex: /https?:\/\/storage\.googleapis\.com\/[^\s"',<>)]+/gi, provider: 'Google Cloud', category: 'Cloud Storage (GCS)' },
    { regex: /https?:\/\/[a-z0-9.-]+\.(?:firebaseio|web|firebaseapp)\.com[^\s"',<>)]+/gi, provider: 'Google Cloud', category: 'Firebase' },
    { regex: /https?:\/\/[a-z0-9.-]+\.blob\.core\.windows\.net[^\s"',<>)]+/gi, provider: 'Microsoft Azure', category: 'Blob Storage' },
    { regex: /https?:\/\/[a-z0-9.-]+\.azureedge\.net[^\s"',<>)]+/gi, provider: 'Microsoft Azure', category: 'Azure CDN' },
    { regex: /https?:\/\/[a-z0-9.-]+\.digitaloceanspaces\.com[^\s"',<>)]+/gi, provider: 'DigitalOcean', category: 'Spaces Storage' },
    { regex: /https?:\/\/[a-z0-9.-]+\.supabase\.co[^\s"',<>)]+/gi, provider: 'Supabase', category: 'Backend DB' },
    { regex: /https?:\/\/[a-z0-9.-]+\.(?:r2\.cloudflarestorage\.com|workers\.dev)[^\s"',<>)]+/gi, provider: 'Cloudflare', category: 'R2/Workers' },
    { regex: /https?:\/\/(?:raw\.githubusercontent\.com|github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)[^\s"',<>)]+/gi, provider: 'GitHub', category: 'Repository/Assets' }
  ];

  for (const rule of cloudRules) {
    const matches = html.match(rule.regex) || [];
    for (const match of matches) {
      cloudLinks.push({
        url: match,
        provider: rule.provider,
        category: rule.category,
        foundOnPage: pageUrl
      });
    }
  }

  // Emails
  const emails = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];

  return {
    title,
    description,
    images,
    links,
    cloudLinks,
    emails: Array.from(new Set(emails))
  };
}

