/**
 * OmniExtract - Content Script (Enhanced Pro with Dynamic Auto-Harvester)
 * Features:
 * - Persistent in-tab accumulator store (never loses virtualized/scrolled-away items)
 * - MutationObserver watching dynamic DOM changes & AJAX infinite-scroll loaders
 * - Scroll event listener capturing lazy-loaded images & media on the fly
 * - Auto-Scroll Engine for hands-free feed harvesting (Instagram, Pinterest, Twitter, e-commerce)
 * - Real-time synchronization with extension popup
 */

(() => {
  // Clean up any previous instance observers/listeners if re-injected
  if (window.__omniExtractCleanup) {
    try { window.__omniExtractCleanup(); } catch (e) {}
  }

  // =========================================================================
  // PERSISTENT ACCUMULATOR STORE (Lives with the tab)
  // =========================================================================
  const store = window.__omniExtractStore || {
    images: new Map(),
    media: new Map(),
    cards: new Map(),
    tables: new Map(),
    forms: new Map(),
    cloudLinks: new Map(),
    links: new Map(),
    emails: new Set(),
    phones: new Set(),
    socials: new Map(),
    colors: new Set(),
    fonts: new Set()
  };
  store.tables = store.tables || new Map();
  store.forms = store.forms || new Map();
  window.__omniExtractStore = store;

  // Auto-scroll state
  let autoScrollState = {
    isActive: false,
    intervalId: null,
    scrollCount: 0,
    maxScrolls: 50,
    lastHeight: 0,
    floatingBadge: null
  };

  // Persistent ID generators (immune to TDZ, hoisting, and re-injections)
  function getNextCardId() {
    window.__omniCardIdCounter = (window.__omniCardIdCounter || 0) + 1;
    return 'omni_card_' + window.__omniCardIdCounter;
  }
  function getNextTableId() {
    window.__omniTableIdCounter = (window.__omniTableIdCounter || 0) + 1;
    return 'omni_table_' + window.__omniTableIdCounter;
  }
  let pickerActive = false;
  let hoveredEl = null;
  let activeMutationObserver = null;
  let activeScrollListener = null;




  // Listen for messages from popup or background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'EXTRACT_PAGE_DATA') {
      try {
        // Run deep scan and merge
        runDeepScan();
        const data = buildPayload();
        sendResponse({ success: true, data });
      } catch (err) {
        console.error('[OmniExtract] Extraction error:', err);
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }

    if (request.action === 'START_AUTO_SCROLL') {
      startAutoScroll(request.maxScrolls || 40);
      sendResponse({ success: true, isScrolling: true });
      return true;
    }

    if (request.action === 'STOP_AUTO_SCROLL') {
      stopAutoScroll();
      sendResponse({ success: true, isScrolling: false });
      return true;
    }

    if (request.action === 'GET_AUTO_SCROLL_STATUS') {
      sendResponse({
        isActive: autoScrollState.isActive,
        scrollCount: autoScrollState.scrollCount,
        imagesCaptured: store.images.size,
        mediaCaptured: store.media.size
      });
      return true;
    }

    if (request.action === 'HIGHLIGHT_ELEMENT') {
      highlightUrl(request.url);
      sendResponse({ success: true });
      return true;
    }

    if (request.action === 'HIGHLIGHT_CARD') {
      highlightCard(request.cardId);
      sendResponse({ success: true });
      return true;
    }

    if (request.action === 'HIGHLIGHT_TABLE') {
      highlightTable(request.tableId);
      sendResponse({ success: true });
      return true;
    }

    if (request.action === 'START_PICKER') {
      startInteractivePicker();
      sendResponse({ success: true });
      return true;
    }
  });

  /**
   * Run initial scan when content script starts
   */
  function initialScan() {
    runDeepScan();
  }


  /**
   * Setup MutationObserver and Scroll Watchers to catch infinite scroll / lazy-loaders
   */
  function setupDynamicObservers() {
    let mutationDebounceTimer = null;
    activeMutationObserver = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const mut of mutations) {
        if (mut.type === 'childList' && mut.addedNodes.length > 0) {
          shouldScan = true;
          break;
        } else if (mut.type === 'attributes') {
          const attr = mut.attributeName;
          if (attr === 'src' || attr === 'data-src' || attr === 'data-original' || attr === 'srcset' || attr === 'href') {
            shouldScan = true;
            break;
          }
        }
      }

      if (shouldScan) {
        clearTimeout(mutationDebounceTimer);
        mutationDebounceTimer = setTimeout(() => {
          runDeepScan();
          broadcastLiveUpdate();
        }, 300);
      }
    });

    if (document.body) {
      activeMutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'data-src', 'data-original', 'srcset', 'href', 'poster']
      });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if (activeMutationObserver && document.body) {
          activeMutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'data-src', 'data-original', 'srcset', 'href', 'poster']
          });
        }
      });
    }

    // 2. Throttled scroll listener
    let scrollDebounceTimer = null;
    activeScrollListener = () => {
      clearTimeout(scrollDebounceTimer);
      scrollDebounceTimer = setTimeout(() => {
        runDeepScan();
        broadcastLiveUpdate();
      }, 400);
    };
    window.addEventListener('scroll', activeScrollListener, { passive: true });
  }

  /**
   * Broadcast real-time update to popup if open
   */
  function broadcastLiveUpdate() {
    try {
      chrome.runtime.sendMessage({
        action: 'DYNAMIC_DOM_UPDATE',
        stats: {
          images: store.images.size,
          media: store.media.size,
          cards: store.cards.size,
          cloud: store.cloudLinks.size,
          links: store.links.size
        }
      }).catch(() => {});
    } catch (e) {}

    // Update floating badge if auto-scroll active
    updateFloatingBadge();
  }

  /**
   * Master deep scan: merges into `store` without losing previously scrolled items
   */
  function runDeepScan() {
    extractImagesIntoStore();
    extractMediaIntoStore();
    extractCardsIntoStore();
    extractTablesIntoStore();
    extractFormsIntoStore();
    extractCloudLinksIntoStore();
    extractLinksIntoStore();
    extractContactsIntoStore();
    extractDesignAssetsIntoStore();
  }

  /**
   * Builds the consolidated payload
   */
  function buildPayload() {
    return {
      url: window.location.href,
      origin: window.location.origin,
      domain: window.location.hostname,
      timestamp: new Date().toISOString(),
      metadata: extractMetadata(),
      images: Array.from(store.images.values()),
      media: Array.from(store.media.values()),
      cards: Array.from(store.cards.values()),
      tables: Array.from(store.tables.values()),
      forms: Array.from(store.forms.values()),
      cleanMarkdown: extractCleanPageMarkdown(),
      cloudLinks: Array.from(store.cloudLinks.values()),
      links: Array.from(store.links.values()),
      contacts: {
        emails: Array.from(store.emails),
        phones: Array.from(store.phones),
        socials: Array.from(store.socials.values())
      },
      headings: extractHeadings(),
      designAssets: {
        colors: Array.from(store.colors).slice(0, 8),
        fonts: Array.from(store.fonts).slice(0, 5)
      },
      technologies: detectTechStack(),
      stats: getPageStats(),
      inPageSitemap: extractInPageSitemap(),
      frameworkState: extractFrameworkStateAndSecrets(),
      seoAudit: computeSeoAudit()
    };
  }

  /**
   * IN-PAGE XML SITEMAP EXTRACTION (Instant detection if active page is an XML sitemap)
   */

  /**
   * FRAMEWORK & SPA STATE EXTRACTOR (__NEXT_DATA__, Nuxt, Shopify) & SECRETS SCANNER
   */
  function extractFrameworkStateAndSecrets() {
    const findings = {
      frameworks: [],
      rawState: null,
      rawStateType: null,
      stateSize: 0,
      secrets: []
    };

    try {
      // 1. Next.js __NEXT_DATA__
      const nextDataEl = document.getElementById('__NEXT_DATA__');
      if (nextDataEl && nextDataEl.textContent) {
        try {
          const parsed = JSON.parse(nextDataEl.textContent);
          findings.rawState = parsed;
          findings.rawStateType = 'Next.js (__NEXT_DATA__)';
          findings.stateSize = nextDataEl.textContent.length;
          findings.frameworks.push('Next.js');
        } catch (e) {}
      }

      // 2. Nuxt __NUXT_DATA__ or __NUXT__
      const nuxtDataEl = document.getElementById('__NUXT_DATA__');
      if (nuxtDataEl && nuxtDataEl.textContent) {
        try {
          const parsed = JSON.parse(nuxtDataEl.textContent);
          if (!findings.rawState) {
            findings.rawState = parsed;
            findings.rawStateType = 'Nuxt.js (__NUXT_DATA__)';
            findings.stateSize = nuxtDataEl.textContent.length;
          }
          findings.frameworks.push('Nuxt.js');
        } catch (e) {}
      }

      // 3. Shopify detection
      if (window.Shopify || document.querySelector('script[id*="shopify" i]')) {
        findings.frameworks.push('Shopify');
      }

      // 4. Scan page HTML for exposed secrets and API keys
      const htmlToScan = document.documentElement ? document.documentElement.outerHTML : '';
      const secretPatterns = [
        { type: 'AWS Access Key', regex: /\b(AKIA[0-9A-Z]{16})\b/g, severity: 'critical' },
        { type: 'Google API Key', regex: /\b(AIza[0-9A-Za-z\-_]{35})\b/g, severity: 'warning' },
        { type: 'GitHub Token', regex: /\b(ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{22,})\b/g, severity: 'critical' },
        { type: 'Stripe API Key', regex: /\b(sk_live_[0-9a-zA-Z]{24}|pk_live_[0-9a-zA-Z]{24})\b/g, severity: 'critical' },
        { type: 'Slack Token', regex: /\b(xox[baprs]-[0-9a-zA-Z]{10,48})\b/g, severity: 'critical' },
        { type: 'JSON Web Token (JWT)', regex: /\b(eyJ[a-zA-Z0-9_\-]{10,}\.eyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,})\b/g, severity: 'info' }
      ];

      const detected = [];
      const seenRaw = new Set();
      secretPatterns.forEach(pat => {
        const matches = htmlToScan.match(pat.regex) || [];
        matches.forEach(val => {
          if (!seenRaw.has(val)) {
            seenRaw.add(val);
            const masked = val.length > 12 ? val.slice(0, 6) + '••••••••' + val.slice(-4) : val.slice(0, 3) + '••••';
            detected.push({
              type: pat.type,
              masked: masked,
              raw: val,
              severity: pat.severity
            });
          }
        });
      });

      findings.secrets = detected.slice(0, 20);
    } catch (err) {
      console.warn('[OmniExtract] State/secrets error:', err);
    }

    return findings;
  }

  /**
   * COMPREHENSIVE SEO HEALTH SCORE & AUDIT
   */
  function computeSeoAudit() {
    const meta = extractMetadata();
    const headings = extractHeadings();
    let score = 100;
    const checks = [];

    // Title Tag
    const title = meta.title || '';
    if (!title) {
      score -= 25;
      checks.push({ name: 'Page Title', status: 'fail', message: 'Missing <title> tag' });
    } else if (title.length < 30 || title.length > 65) {
      score -= 8;
      checks.push({ name: 'Title Length', status: 'warn', message: `${title.length} chars (Best: 30-65 chars)` });
    } else {
      checks.push({ name: 'Page Title', status: 'pass', message: `${title.length} chars (Optimal length)` });
    }

    // Meta Description
    const desc = meta.description || '';
    if (!desc) {
      score -= 20;
      checks.push({ name: 'Meta Description', status: 'fail', message: 'Missing meta description' });
    } else if (desc.length < 70 || desc.length > 160) {
      score -= 6;
      checks.push({ name: 'Description Length', status: 'warn', message: `${desc.length} chars (Best: 70-160 chars)` });
    } else {
      checks.push({ name: 'Meta Description', status: 'pass', message: `${desc.length} chars (Optimal length)` });
    }

    // Canonical Link
    if (meta.canonical) {
      checks.push({ name: 'Canonical Tag', status: 'pass', message: 'Configured properly' });
    } else {
      score -= 10;
      checks.push({ name: 'Canonical Tag', status: 'warn', message: 'Missing rel="canonical" tag' });
    }

    // OpenGraph Tags
    const og = meta.openGraph || {};
    if (og['og:title'] && og['og:image']) {
      checks.push({ name: 'Social OpenGraph', status: 'pass', message: 'og:title & og:image present' });
    } else {
      score -= 10;
      checks.push({ name: 'Social OpenGraph', status: 'warn', message: 'Incomplete social preview tags' });
    }

    // H1 Heading
    const h1s = headings.filter(h => h.level.toLowerCase() === 'h1');
    if (h1s.length === 1) {
      checks.push({ name: 'H1 Structure', status: 'pass', message: 'Single primary H1 heading' });
    } else if (h1s.length === 0) {
      score -= 15;
      checks.push({ name: 'H1 Structure', status: 'fail', message: 'No <h1> heading detected on page' });
    } else {
      score -= 5;
      checks.push({ name: 'H1 Structure', status: 'warn', message: `Multiple (${h1s.length}) <h1> headings found` });
    }

    return {
      score: Math.max(0, score),
      checks
    };
  }

  function extractInPageSitemap() {
    try {
      const isXml = (document.contentType && (document.contentType.includes('xml') || document.contentType.includes('text/plain'))) || 
                    Boolean(document.querySelector('sitemapindex, urlset, sitemap, [xmlns*="sitemap"]')) ||
                    window.location.pathname.endsWith('.xml') ||
                    window.location.pathname.includes('sitemap');

      if (!isXml) return null;

      // 1. Try namespace-agnostic DOM element selection first
      let locElements = Array.from(document.getElementsByTagNameNS ? document.getElementsByTagNameNS('*', 'loc') : []);
      if (locElements.length === 0) {
        locElements = Array.from(document.getElementsByTagName('loc'));
      }
      if (locElements.length === 0) {
        locElements = Array.from(document.querySelectorAll('loc'));
      }

      const isIndex = Boolean(
        (document.getElementsByTagNameNS && document.getElementsByTagNameNS('*', 'sitemapindex').length > 0) ||
        (document.getElementsByTagNameNS && document.getElementsByTagNameNS('*', 'sitemap').length > 0) ||
        document.getElementsByTagName('sitemapindex').length > 0 ||
        document.getElementsByTagName('sitemap').length > 0 ||
        document.querySelector('sitemapindex, sitemap') ||
        (document.documentElement && document.documentElement.nodeName.toLowerCase().includes('sitemapindex'))
      );

      const urls = [];
      if (locElements.length > 0) {
        locElements.forEach(el => {
          const text = (el.textContent || el.innerText || '').trim();
          if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
            const parent = el.parentElement;
            let lastmod = '';
            let changefreq = '';
            let priority = '';
            if (parent) {
              const lm = (parent.getElementsByTagNameNS ? parent.getElementsByTagNameNS('*', 'lastmod')[0] : null) || parent.querySelector('lastmod');
              if (lm) lastmod = (lm.textContent || '').trim();
              const cf = (parent.getElementsByTagNameNS ? parent.getElementsByTagNameNS('*', 'changefreq')[0] : null) || parent.querySelector('changefreq');
              if (cf) changefreq = (cf.textContent || '').trim();
              const pr = (parent.getElementsByTagNameNS ? parent.getElementsByTagNameNS('*', 'priority')[0] : null) || parent.querySelector('priority');
              if (pr) priority = (pr.textContent || '').trim();
            }
            urls.push({
              url: text,
              lastmod,
              changefreq,
              priority,
              source: isIndex ? 'Sitemap Index Entry' : 'Active XML Page'
            });
          }
        });
      }

      // 2. High-speed Fallback: If DOM query found nothing (e.g. Chrome XML viewer wrapper), serialize XML to string and regex match
      if (urls.length === 0) {
        let xmlStr = '';
        try {
          xmlStr = new XMLSerializer().serializeToString(document);
        } catch (_) {
          xmlStr = document.documentElement ? document.documentElement.outerHTML : '';
        }
        if (!xmlStr && document.body) {
          xmlStr = document.body.innerText || document.body.textContent || '';
        }

        if (xmlStr && (xmlStr.includes('<loc>') || xmlStr.includes('&lt;loc&gt;') || xmlStr.includes('http'))) {
          const locRegex = /(?:<loc>|&lt;loc&gt;)\s*(?:<!\[CDATA\[)?\s*([^<>&\s]+)\s*(?:\]\]>)?\s*(?:<\/loc>|&lt;\/loc&gt;)/gi;
          let m;
          const seen = new Set();
          while ((m = locRegex.exec(xmlStr)) !== null) {
            const u = m[1].trim();
            if ((u.startsWith('http://') || u.startsWith('https://')) && !seen.has(u)) {
              seen.add(u);
              urls.push({
                url: u,
                lastmod: '',
                changefreq: '',
                priority: '',
                source: isIndex ? 'Sitemap Index Entry' : 'Active XML Page'
              });
            }
          }
        }
      }

      if (urls.length > 0) {
        return {
          isIndex,
          sourceUrl: window.location.href,
          count: urls.length,
          urls: urls.slice(0, 10000)
        };
      }
    } catch (e) {
      console.warn('[OmniExtract] In-page sitemap error:', e);
    }
    return null;
  }

  /**
   * 1. METADATA & SEO EXTRACTION
   */
  function extractMetadata() {
    const getMeta = (names) => {
      for (const name of names) {
        const el = document.querySelector(`meta[name="${name}" i], meta[property="${name}" i]`);
        if (el && el.content) return el.content.trim();
      }
      return '';
    };

    const og = {};
    document.querySelectorAll('meta[property^="og:" i]').forEach(el => {
      const prop = el.getAttribute('property');
      if (prop && el.content) og[prop.toLowerCase()] = el.content.trim();
    });

    const twitter = {};
    document.querySelectorAll('meta[name^="twitter:" i]').forEach(el => {
      const name = el.getAttribute('name');
      if (name && el.content) twitter[name.toLowerCase()] = el.content.trim();
    });

    const jsonLd = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      try { jsonLd.push(JSON.parse(script.textContent)); } catch (e) {}
    });

    const canonicalEl = document.querySelector('link[rel="canonical"]');
    const canonical = canonicalEl ? canonicalEl.href : '';

    return {
      title: document.title || '',
      description: getMeta(['description', 'og:description', 'twitter:description']),
      keywords: getMeta(['keywords']),
      author: getMeta(['author', 'article:author']),
      robots: getMeta(['robots', 'googlebot']),
      canonical: canonical,
      charset: document.characterSet || 'UTF-8',
      viewport: getMeta(['viewport']),
      themeColor: getMeta(['theme-color']),
      language: document.documentElement.lang || '',
      openGraph: og,
      twitterCard: twitter,
      jsonLd: jsonLd
    };
  }

  /**
   * Generates a normalized deduplication fingerprint for image URLs.
   * Eliminates duplicate entries caused by responsive CDN parameters (w=400 vs w=800)
   * or WordPress thumbnail suffixes (-300x200.jpg vs .jpg).
   */
  function getImageDedupeKey(url) {
    if (!url || typeof url !== 'string') return '';
    if (url.startsWith('data:')) {
      return `data:${url.length}:${url.slice(0, 80)}`;
    }
    try {
      const u = new URL(url);
      let pathname = u.pathname.toLowerCase();
      // Strip common thumbnail and density suffixes: -300x200, _600x400, @2x
      pathname = pathname.replace(/[-_]\d+x\d+(?=\.[a-z0-9]+$)/i, '')
                         .replace(/@\d+x(?=\.[a-z0-9]+$)/i, '')
                         .replace(/[-_](thumb|thumbnail|small|medium|large|card|preview)(?=\.[a-z0-9]+$)/i, '');

      // Strip query parameters that only represent resizing/compression
      const resizeParams = new Set([
        'w', 'width', 'h', 'height', 'maxwidth', 'maxheight',
        'fit', 'crop', 'auto', 'format', 'quality', 'q',
        'v', 'version', 'size', 'resize', 'scale', 'dpr'
      ]);
      const searchParams = new URLSearchParams();
      u.searchParams.forEach((val, key) => {
        if (!resizeParams.has(key.toLowerCase())) {
          searchParams.append(key, val);
        }
      });
      const remainingSearch = searchParams.toString();
      return `${u.host}${pathname}${remainingSearch ? '?' + remainingSearch : ''}`;
    } catch (e) {
      return url.split('?')[0].toLowerCase();
    }
  }

  /**
   * Extracts the single highest-resolution candidate from a srcset string
   */
  function getBestUrlFromSrcset(srcset) {
    if (!srcset || typeof srcset !== 'string') return null;
    const candidates = [];
    const entries = srcset.split(',');
    for (const entry of entries) {
      const parts = entry.trim().split(/\s+/);
      const rawUrl = parts[0];
      if (!rawUrl) continue;
      let width = 0;
      if (parts[1]) {
        if (parts[1].endsWith('w')) {
          width = parseInt(parts[1], 10) || 0;
        } else if (parts[1].endsWith('x')) {
          width = Math.round((parseFloat(parts[1]) || 1) * 1000);
        }
      }
      candidates.push({ url: rawUrl, width });
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.width - a.width);
    return candidates[0];
  }

  /**
   * 2. IMAGES ACCUMULATOR (Deduplication-Hardened Pro Engine)
   * Prevents multi-resolution duplicates while guaranteeing the highest quality asset is saved
   */
  function extractImagesIntoStore() {
    const addImage = (src, details = {}) => {
      if (!src || typeof src !== 'string') return;
      src = src.trim();
      if (!src || src.startsWith('javascript:') || src === '#' || src.startsWith('blob:')) return;

      let absoluteUrl;
      try {
        absoluteUrl = new URL(src, window.location.href).href;
      } catch (e) {
        return;
      }

      const dedupeKey = getImageDedupeKey(absoluteUrl);
      if (!dedupeKey) return;

      // Detect file extension
      let ext = 'IMG';
      if (absoluteUrl.startsWith('data:image/')) {
        const match = absoluteUrl.match(/^data:image\/([a-zA-Z0-9+]+);/);
        ext = match ? match[1].toUpperCase() : 'DATA-URI';
      } else {
        try {
          const pathname = new URL(absoluteUrl).pathname;
          const match = pathname.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/);
          if (match) ext = match[1].toUpperCase();
          if (ext === 'JPEG') ext = 'JPG';
        } catch (e) {}
      }

      const w = details.width || 0;
      const h = details.height || 0;

      // Deduplication check: if we already have this image, upgrade to higher resolution if available
      if (store.images.has(dedupeKey)) {
        const existing = store.images.get(dedupeKey);
        const existingArea = (existing.width || 0) * (existing.height || 0);
        const newArea = w * h;

        // Upgrade if new variant has higher dimensions or better srcset descriptor
        if (newArea > existingArea || (!existing.width && w)) {
          existing.url = absoluteUrl;
          existing.width = w;
          existing.height = h;
          existing.format = ext;
        }
        if (details.alt && !existing.alt) existing.alt = details.alt;
        if (details.title && !existing.title) existing.title = details.title;
        return;
      }

      store.images.set(dedupeKey, {
        url: absoluteUrl,
        alt: details.alt || '',
        title: details.title || '',
        width: w,
        height: h,
        type: details.type || 'img',
        format: ext,
        isDataUri: absoluteUrl.startsWith('data:')
      });
    };

    // 2a. All <img> elements: pick the best high-res source directly
    document.querySelectorAll('img').forEach(img => {
      let src = img.currentSrc || img.src || img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src') || img.getAttribute('data-high-res-src');
      let w = img.naturalWidth || img.width || parseInt(img.getAttribute('width') || '0', 10);
      let h = img.naturalHeight || img.height || parseInt(img.getAttribute('height') || '0', 10);

      // If srcset exists, extract the single best high-res candidate
      const srcset = img.srcset || img.getAttribute('data-srcset');
      if (srcset) {
        const bestCandidate = getBestUrlFromSrcset(srcset);
        if (bestCandidate && bestCandidate.url) {
          src = bestCandidate.url;
          if (bestCandidate.width && (!w || bestCandidate.width > w)) {
            w = bestCandidate.width;
          }
        }
      }

      addImage(src, {
        alt: img.alt || img.getAttribute('aria-label') || '',
        title: img.title || '',
        width: w,
        height: h,
        type: 'img'
      });
    });

    // 2b. <picture> elements: extract best high-res source per picture
    document.querySelectorAll('picture').forEach(picture => {
      const sources = Array.from(picture.querySelectorAll('source'));
      let bestSourceUrl = null;
      let maxWidth = 0;
      for (const s of sources) {
        const srcset = s.srcset || s.getAttribute('data-srcset') || s.src;
        if (srcset) {
          const candidate = getBestUrlFromSrcset(srcset);
          if (candidate && candidate.width >= maxWidth) {
            maxWidth = candidate.width;
            bestSourceUrl = candidate.url;
          }
        }
      }
      if (bestSourceUrl) {
        const imgInside = picture.querySelector('img');
        addImage(bestSourceUrl, {
          alt: imgInside?.alt || '',
          width: maxWidth,
          type: 'picture'
        });
      }
    });

    // 2c. Meta tags
    const ogImg = document.querySelector('meta[property="og:image"]')?.content;
    if (ogImg) addImage(ogImg, { alt: 'OpenGraph Banner', type: 'meta-og' });

    const twImg = document.querySelector('meta[name="twitter:image"]')?.content;
    if (twImg) addImage(twImg, { alt: 'Twitter Banner', type: 'meta-twitter' });

    // 2d. CSS background images (scans current viewport elements)
    const elements = document.querySelectorAll('header, nav, main, section, div, span, button, a, figure, banner');
    const maxScan = Math.min(elements.length, 300);
    for (let i = 0; i < maxScan; i++) {
      try {
        const bg = window.getComputedStyle(elements[i]).backgroundImage;
        if (bg && bg !== 'none' && bg.includes('url(')) {
          const matches = bg.match(/url\(["']?([^"')]+)["']?\)/g);
          if (matches) {
            matches.forEach(m => {
              const clean = m.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
              addImage(clean, { type: 'background' });
            });
          }
        }
      } catch (e) {}
    }
  }

  /**
   * 3. MEDIA (VIDEO & AUDIO) ACCUMULATOR
   */
  function extractMediaIntoStore() {
    const addMedia = (item) => {
      if (!item || !item.url) return;
      let url = item.url.trim();
      if (!url || url.startsWith('javascript:') || url.startsWith('blob:')) return;

      try {
        url = new URL(url, window.location.href).href;
      } catch (e) {
        return;
      }

      if (store.media.has(url)) return;

      store.media.set(url, {
        url: url,
        title: item.title || '',
        kind: item.kind || 'video',
        format: item.format || 'MP4',
        poster: item.poster || '',
        duration: item.duration || '',
        source: item.source || 'HTML5 Element'
      });
    };

    // 3a. <video>
    document.querySelectorAll('video').forEach((v, idx) => {
      const poster = v.poster ? new URL(v.poster, window.location.href).href : '';
      const vSrc = v.currentSrc || v.src;
      if (vSrc) {
        addMedia({
          url: vSrc,
          title: v.title || v.getAttribute('aria-label') || `Video #${idx + 1}`,
          kind: 'video',
          format: detectMediaFormat(vSrc, 'MP4'),
          poster: poster,
          source: '<video> Tag'
        });
      }

      v.querySelectorAll('source').forEach(s => {
        if (s.src) {
          addMedia({
            url: s.src,
            title: v.title || `Video Source`,
            kind: 'video',
            format: detectMediaFormat(s.src, 'VIDEO'),
            poster: poster,
            source: '<video> Source'
          });
        }
      });
    });

    // 3b. <audio>
    document.querySelectorAll('audio').forEach((a, idx) => {
      const aSrc = a.currentSrc || a.src;
      if (aSrc) {
        addMedia({
          url: aSrc,
          title: a.title || `Audio Track #${idx + 1}`,
          kind: 'audio',
          format: detectMediaFormat(aSrc, 'MP3'),
          source: '<audio> Tag'
        });
      }

      a.querySelectorAll('source').forEach(s => {
        if (s.src) {
          addMedia({
            url: s.src,
            title: a.title || 'Audio Source',
            kind: 'audio',
            format: detectMediaFormat(s.src, 'AUDIO'),
            source: '<audio> Source'
          });
        }
      });
    });

    // 3c. Embeds in <iframe>
    document.querySelectorAll('iframe[src]').forEach(iframe => {
      const src = iframe.src;
      if (!src) return;

      if (/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/i.test(src) || /youtu\.be\/([a-zA-Z0-9_-]+)/i.test(src)) {
        const match = src.match(/(?:embed\/|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
        const ytId = match ? match[1] : '';
        addMedia({
          url: src,
          title: iframe.title || `YouTube Video (${ytId})`,
          kind: 'video',
          format: 'YOUTUBE',
          poster: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '',
          source: 'YouTube Embed'
        });
      } else if (/player\.vimeo\.com\/video\/([0-9]+)/i.test(src)) {
        addMedia({
          url: src,
          title: iframe.title || 'Vimeo Player',
          kind: 'video',
          format: 'VIMEO',
          source: 'Vimeo Embed'
        });
      } else if (/soundcloud\.com\/player/i.test(src)) {
        addMedia({
          url: src,
          title: iframe.title || 'SoundCloud Player',
          kind: 'audio',
          format: 'SOUNDCLOUD',
          source: 'SoundCloud Embed'
        });
      } else if (/open\.spotify\.com\/embed/i.test(src)) {
        addMedia({
          url: src,
          title: iframe.title || 'Spotify Player',
          kind: 'audio',
          format: 'SPOTIFY',
          source: 'Spotify Embed'
        });
      }
    });

    // 3d. Direct links to video/audio files
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.href;
      if (!href) return;

      const videoExtMatch = href.match(/\.(mp4|webm|mkv|mov|flv|avi|m3u8|ts|mpd)(?:[\?#]|$)/i);
      if (videoExtMatch) {
        addMedia({
          url: href,
          title: a.innerText.trim() || `Video File (${videoExtMatch[1].toUpperCase()})`,
          kind: 'video',
          format: videoExtMatch[1].toUpperCase(),
          source: 'Direct Video Link'
        });
      }

      const audioExtMatch = href.match(/\.(mp3|wav|ogg|m4a|aac|flac|opus|wma)(?:[\?#]|$)/i);
      if (audioExtMatch) {
        addMedia({
          url: href,
          title: a.innerText.trim() || `Audio File (${audioExtMatch[1].toUpperCase()})`,
          kind: 'audio',
          format: audioExtMatch[1].toUpperCase(),
          source: 'Direct Audio Link'
        });
      }
    });
  }

  function detectMediaFormat(url, fallback = 'MEDIA') {
    try {
      const pathname = new URL(url).pathname;
      const match = pathname.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/);
      if (match) return match[1].toUpperCase();
    } catch (e) {}
    return fallback;
  }

  /**
   * 4. CLOUD & INFRASTRUCTURE LINKS ACCUMULATOR
   */
  function extractCloudLinksIntoStore() {
    const addCloud = (url, provider, category, context = '') => {
      if (!url) return;
      let cleanUrl = url.trim();
      if (!cleanUrl) return;

      try {
        cleanUrl = new URL(cleanUrl, window.location.href).href;
      } catch (e) {
        return;
      }

      if (store.cloudLinks.has(cleanUrl)) return;

      store.cloudLinks.set(cleanUrl, {
        url: cleanUrl,
        provider: provider,
        category: category,
        context: context
      });
    };

    const candidateStrings = new Set();
    document.querySelectorAll('a[href]').forEach(el => candidateStrings.add({ str: el.href, ctx: 'Anchor Link' }));
    document.querySelectorAll('img[src]').forEach(el => candidateStrings.add({ str: el.src, ctx: 'Image Source' }));
    document.querySelectorAll('script[src]').forEach(el => candidateStrings.add({ str: el.src, ctx: 'Script Source' }));
    document.querySelectorAll('link[href]').forEach(el => candidateStrings.add({ str: el.href, ctx: 'Resource Link' }));
    document.querySelectorAll('iframe[src]').forEach(el => candidateStrings.add({ str: el.src, ctx: 'Iframe Source' }));

    const rules = [
      { regex: /s3[.-][a-z0-9-]*\.amazonaws\.com/i, provider: 'AWS', category: 'S3 Object Storage' },
      { regex: /[a-z0-9.-]+\.s3\.amazonaws\.com/i, provider: 'AWS', category: 'S3 Object Storage' },
      { regex: /[a-z0-9.-]+\.cloudfront\.net/i, provider: 'AWS', category: 'CloudFront CDN' },
      { regex: /[a-z0-9.-]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com/i, provider: 'AWS', category: 'API Gateway' },
      { regex: /[a-z0-9.-]+\.lambda-url\.[a-z0-9-]+\.on\.aws/i, provider: 'AWS', category: 'Lambda Function' },
      { regex: /storage\.googleapis\.com/i, provider: 'Google Cloud', category: 'Cloud Storage (GCS)' },
      { regex: /[a-z0-9.-]+\.storage\.googleapis\.com/i, provider: 'Google Cloud', category: 'Cloud Storage (GCS)' },
      { regex: /[a-z0-9.-]+\.firebaseio\.com/i, provider: 'Google Cloud', category: 'Firebase DB' },
      { regex: /[a-z0-9.-]+\.web\.app/i, provider: 'Google Cloud', category: 'Firebase Hosting' },
      { regex: /[a-z0-9.-]+\.firebaseapp\.com/i, provider: 'Google Cloud', category: 'Firebase Hosting' },
      { regex: /[a-z0-9.-]+\.run\.app/i, provider: 'Google Cloud', category: 'Cloud Run Service' },
      { regex: /[a-z0-9.-]+\.blob\.core\.windows\.net/i, provider: 'Microsoft Azure', category: 'Blob Storage' },
      { regex: /[a-z0-9.-]+\.azureedge\.net/i, provider: 'Microsoft Azure', category: 'Azure CDN' },
      { regex: /[a-z0-9.-]+\.azurewebsites\.net/i, provider: 'Microsoft Azure', category: 'Azure App Service' },
      { regex: /[a-z0-9.-]+\.workers\.dev/i, provider: 'Cloudflare', category: 'Cloudflare Workers' },
      { regex: /[a-z0-9.-]+\.pages\.dev/i, provider: 'Cloudflare', category: 'Cloudflare Pages' },
      { regex: /[a-z0-9.-]+\.r2\.cloudflarestorage\.com/i, provider: 'Cloudflare', category: 'R2 Object Storage' },
      { regex: /[a-z0-9.-]+\.digitaloceanspaces\.com/i, provider: 'DigitalOcean', category: 'Spaces Storage' },
      { regex: /[a-z0-9.-]+\.supabase\.co/i, provider: 'Supabase', category: 'Backend DB' },
      { regex: /[a-z0-9.-]+\.vercel\.app/i, provider: 'Vercel', category: 'Vercel Deploy' },
      { regex: /[a-z0-9.-]+\.netlify\.app/i, provider: 'Netlify', category: 'Netlify App' },
      { regex: /raw\.githubusercontent\.com/i, provider: 'GitHub', category: 'Raw Content' },
      { regex: /github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/i, provider: 'GitHub', category: 'Source Repo' }
    ];

    candidateStrings.forEach(({ str, ctx }) => {
      for (const rule of rules) {
        if (rule.regex.test(str)) {
          addCloud(str, rule.provider, rule.category, ctx);
          break;
        }
      }
    });

    const scriptTexts = Array.from(document.querySelectorAll('script:not([src])')).map(s => s.textContent || '').join('\n');
    const s3Matches = scriptTexts.match(/https?:\/\/[a-z0-9.-]+\.s3[a-z0-9.-]*\.amazonaws\.com[^\s"',)]+/gi) || [];
    s3Matches.forEach(url => addCloud(url, 'AWS', 'S3 Object Storage (Script)', 'Inline JS'));

    const gcsMatches = scriptTexts.match(/https?:\/\/storage\.googleapis\.com\/[^\s"',)]+/gi) || [];
    gcsMatches.forEach(url => addCloud(url, 'Google Cloud', 'Cloud Storage (Script)', 'Inline JS'));

    const azMatches = scriptTexts.match(/https?:\/\/[a-z0-9.-]+\.blob\.core\.windows\.net[^\s"',)]+/gi) || [];
    azMatches.forEach(url => addCloud(url, 'Microsoft Azure', 'Blob Storage (Script)', 'Inline JS'));
  }

  /**
   * 5. ALL HYPERLINKS ACCUMULATOR
   */
  function extractLinksIntoStore() {
    const currentHost = window.location.hostname;

    document.querySelectorAll('a[href]').forEach(a => {
      let href = a.getAttribute('href');
      if (!href) return;
      href = href.trim();
      if (!href || href.startsWith('javascript:')) return;

      let absoluteUrl;
      try {
        absoluteUrl = new URL(href, window.location.href).href;
      } catch (e) {
        return;
      }

      if (store.links.has(absoluteUrl)) return;

      let linkHost = '';
      let isInternal = false;
      let isDoc = false;
      let docType = '';

      try {
        const urlObj = new URL(absoluteUrl);
        linkHost = urlObj.hostname;
        isInternal = (linkHost === currentHost || linkHost.endsWith('.' + currentHost));

        const docExtMatch = urlObj.pathname.match(/\.(pdf|docx?|xlsx?|pptx?|zip|rar|tar|gz|csv|json|xml|txt|epub|dmg|exe)$/i);
        if (docExtMatch) {
          isDoc = true;
          docType = docExtMatch[1].toUpperCase();
        }
      } catch (e) {}

      const linkText = (a.innerText || a.textContent || '').replace(/\s+/g, ' ').trim();

      store.links.set(absoluteUrl, {
        url: absoluteUrl,
        text: linkText.substring(0, 100),
        title: a.title || '',
        rel: a.rel || '',
        isInternal: isInternal,
        isDocument: isDoc,
        docType: docType
      });
    });
  }

  /**
   * 6. CONTACTS & SOCIALS ACCUMULATOR
   */
  function extractContactsIntoStore() {
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
      const email = a.href.replace(/^mailto:/i, '').split('?')[0].trim();
      if (email) store.emails.add(email);
    });

    document.querySelectorAll('a[href^="tel:"]').forEach(a => {
      const phone = a.href.replace(/^tel:/i, '').trim();
      if (phone) store.phones.add(phone);
    });

    const bodyText = document.body ? document.body.innerText : '';

    // Extract phone numbers from body text
    const phoneMatches = bodyText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g) || [];
    phoneMatches.forEach(p => {
      const clean = p.trim();
      if (clean.length >= 7 && clean.length <= 24 && /\d{4,}/.test(clean.replace(/\D/g, ''))) {
        store.phones.add(clean);
      }
    });

    // Extract emails from body text (excluding image/script extensions)
    const emailMatches = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    emailMatches.forEach(em => {
      const lower = em.toLowerCase();
      if (!lower.endsWith('.png') && !lower.endsWith('.jpg') && !lower.endsWith('.webp') && !lower.endsWith('.js') && !lower.endsWith('.svg')) {
        store.emails.add(lower);
      }
    });

    const socialPlatforms = [
      { name: 'Twitter/X', regex: /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]{1,30})/i },
      { name: 'LinkedIn', regex: /linkedin\.com\/(?:company|in)\/([a-zA-Z0-9_-]+)/i },
      { name: 'GitHub', regex: /github\.com\/([a-zA-Z0-9_-]+)/i },
      { name: 'Discord', regex: /(?:discord\.gg|discord\.com\/invite)\/([a-zA-Z0-9_-]+)/i },
      { name: 'Telegram', regex: /(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/i },
      { name: 'WhatsApp', regex: /(?:wa\.me|api\.whatsapp\.com\/send\?phone=)(\+?[0-9]+)/i },
      { name: 'Instagram', regex: /instagram\.com\/([a-zA-Z0-9_.-]+)/i },
      { name: 'YouTube', regex: /(?:youtube\.com\/(?:@|c\/|channel\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/i },
      { name: 'Facebook', regex: /(?:facebook\.com|fb\.com)\/([a-zA-Z0-9_.-]+)/i },
      { name: 'Reddit', regex: /reddit\.com\/(?:r|user)\/([a-zA-Z0-9_]+)/i },
      { name: 'TikTok', regex: /tiktok\.com\/@([a-zA-Z0-9_.-]+)/i },
      { name: 'Medium', regex: /medium\.com\/@?([a-zA-Z0-9_.-]+)/i }
    ];

    document.querySelectorAll('a[href]').forEach(a => {
      for (const platform of socialPlatforms) {
        if (platform.regex.test(a.href)) {
          if (!store.socials.has(a.href)) {
            store.socials.set(a.href, { platform: platform.name, url: a.href });
          }
          break;
        }
      }
    });
  }

  /**
   * 7. DESIGN ASSETS ACCUMULATOR
   */
  function extractDesignAssetsIntoStore() {
    const elements = document.querySelectorAll('body, header, nav, h1, h2, p, button, a, div, section');
    const scanCount = Math.min(elements.length, 60);

    for (let i = 0; i < scanCount; i++) {
      try {
        const style = window.getComputedStyle(elements[i]);
        if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent') {
          const hex = rgbToHex(style.backgroundColor);
          if (hex) store.colors.add(hex);
        }
        if (style.color) {
          const hex = rgbToHex(style.color);
          if (hex) store.colors.add(hex);
        }
        if (style.fontFamily) {
          const firstFont = style.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
          if (firstFont) store.fonts.add(firstFont);
        }
      } catch (e) {}
    }
  }

  function rgbToHex(rgb) {
    if (!rgb || rgb.startsWith('#')) return rgb;
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return '';
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }

  /**
   * =========================================================================
   * STRUCTURED CARDS & REPEATING ENTITY HARVESTER (PRO UNIVERSAL)
   * Detects composite containers with title, image, description, links, and badges
   * =========================================================================
   */

  function extractBestImageUrl(el) {
    if (!el) return '';
    const imgEl = el.querySelector('img');
    if (imgEl) {
      let src = imgEl.currentSrc || imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-original') || imgEl.getAttribute('data-lazy-src') || imgEl.getAttribute('data-url') || '';
      if (!src || src.startsWith('data:image/svg') || src.startsWith('data:image/gif') || src.includes('blank.gif') || src.includes('spacer.gif')) {
        const srcset = imgEl.srcset || imgEl.getAttribute('data-srcset') || imgEl.getAttribute('srcset') || '';
        if (srcset) {
          const parts = srcset.split(',').map(s => s.trim().split(' ')[0]).filter(Boolean);
          if (parts.length > 0) src = parts[parts.length - 1];
        }
      }
      if (src && !src.startsWith('data:image/svg') && !src.startsWith('data:image/gif')) {
        try { return new URL(src, window.location.href).href; } catch(e) {}
      }
    }

    const pictureEl = el.querySelector('picture');
    if (pictureEl) {
      const source = pictureEl.querySelector('source[srcset]');
      if (source) {
        const srcset = source.getAttribute('srcset') || '';
        const parts = srcset.split(',').map(s => s.trim().split(' ')[0]).filter(Boolean);
        if (parts.length > 0) {
          try { return new URL(parts[parts.length - 1], window.location.href).href; } catch(e) {}
        }
      }
    }

    const bgEls = el.querySelectorAll('[style*="background-image"], [style*="background:"]');
    for (const bgEl of bgEls) {
      const style = window.getComputedStyle(bgEl);
      if (style.backgroundImage && style.backgroundImage.startsWith('url(')) {
        const cleaned = style.backgroundImage.slice(4, -1).replace(/["']/g, '');
        if (cleaned && !cleaned.startsWith('data:')) {
          try { return new URL(cleaned, window.location.href).href; } catch(e) {}
        }
      }
    }

    try {
      const rootStyle = window.getComputedStyle(el);
      if (rootStyle.backgroundImage && rootStyle.backgroundImage.startsWith('url(')) {
        const cleaned = rootStyle.backgroundImage.slice(4, -1).replace(/["']/g, '');
        if (cleaned && !cleaned.startsWith('data:')) {
          return new URL(cleaned, window.location.href).href;
        }
      }
    } catch(e) {}

    return '';
  }

  function extractBestTitle(el) {
    if (!el) return '';
    const heading = el.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"]');
    if (heading) {
      const txt = (heading.innerText || heading.textContent || '').trim();
      if (txt.length >= 2) return txt.substring(0, 250);
    }

    const titleEl = el.querySelector('[class*="title" i], [class*="heading" i], [class*="header" i], [class*="name" i]');
    if (titleEl) {
      const txt = (titleEl.innerText || titleEl.textContent || '').trim();
      if (txt.length >= 2) return txt.substring(0, 250);
    }

    const strong = el.querySelector('strong, b');
    if (strong) {
      const txt = (strong.innerText || strong.textContent || '').trim();
      if (txt.length >= 3 && txt.length <= 150) return txt;
    }

    const anchors = el.querySelectorAll('a[href]');
    for (const a of anchors) {
      const txt = (a.innerText || a.textContent || '').trim();
      if (txt.length >= 4 && txt.length <= 200 && !txt.toLowerCase().includes('read more') && !txt.toLowerCase().includes('learn more')) {
        return txt;
      }
    }

    return '';
  }

  function extractBestDescription(el, title) {
    if (!el) return '';
    const pEls = el.querySelectorAll('p');
    for (const p of pEls) {
      const txt = (p.innerText || p.textContent || '').replace(/\s+/g, ' ').trim();
      if (txt.length >= 5 && txt !== title) return txt.substring(0, 450);
    }

    const descEl = el.querySelector('[class*="desc" i], [class*="summary" i], [class*="snippet" i], [class*="text" i], [class*="body" i], [class*="caption" i], [class*="bio" i], [data-testid*="tweetText" i]');
    if (descEl) {
      const txt = (descEl.innerText || descEl.textContent || '').replace(/\s+/g, ' ').trim();
      if (txt.length >= 5 && txt !== title) return txt.substring(0, 450);
    }

    const childDivs = el.querySelectorAll('div, span');
    for (const d of childDivs) {
      if (d.children.length === 0) {
        const txt = (d.innerText || d.textContent || '').replace(/\s+/g, ' ').trim();
        if (txt.length >= 18 && txt !== title) {
          return txt.substring(0, 450);
        }
      }
    }

    return '';
  }

  function parseSingleCardElement(el) {
    if (!el || el.nodeType !== 1) return null;
    const tag = el.tagName.toLowerCase();
    if (['body', 'html', 'header', 'footer', 'nav', 'aside'].includes(tag)) return null;

    const imgUrl = extractBestImageUrl(el);
    const title = extractBestTitle(el);
    const description = extractBestDescription(el, title);

    let linkUrl = '';
    let linkText = '';
    let linkEl = el.querySelector('a[href]');
    if (!linkEl && el.tagName.toLowerCase() === 'a' && el.getAttribute('href')) {
      linkEl = el;
    }
    if (linkEl) {
      const href = linkEl.getAttribute('href');
      if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
        try {
          linkUrl = new URL(href, window.location.href).href;
          linkText = (linkEl.innerText || linkEl.textContent || '').trim();
        } catch(e) {}
      }
    }

    let price = '';
    const priceEl = el.querySelector('[class*="price" i], [class*="amount" i], [class*="cost" i]');
    if (priceEl) {
      price = (priceEl.innerText || priceEl.textContent || '').trim();
    } else {
      const text = el.innerText || el.textContent || '';
      const match = text.match(/(?:[\$€£¥₹]\s*\d+(?:[\.,]\d{2})?|\d+(?:[\.,]\d{2})?\s*(?:USD|EUR|GBP|INR|CAD|AUD))/);
      if (match) price = match[0].trim();
    }

    let badge = '';
    const badgeEl = el.querySelector('[class*="badge" i], [class*="tag" i], [class*="category" i], [class*="status" i]');
    if (badgeEl && badgeEl !== priceEl) {
      badge = (badgeEl.innerText || badgeEl.textContent || '').trim();
    }

    const hasTitle = Boolean(title && title.length >= 2 && title.length < 350);
    const hasImage = Boolean(imgUrl);
    const hasDesc = Boolean(description && description.length >= 4);
    const hasLink = Boolean(linkUrl);

    // Accept if card has (title & image) OR (title & desc) OR (title & link) OR (image & link/desc)
    if ((hasTitle && (hasImage || hasDesc || hasLink)) || (hasImage && (hasDesc || hasLink))) {
      let cardId = el.getAttribute('data-omni-card-id');
      if (!cardId) {
        cardId = getNextCardId();
        el.setAttribute('data-omni-card-id', cardId);
      }

      return {
        id: cardId,
        title: title || 'Card Component',
        image: imgUrl || '',
        alt: title || 'Image',
        description: description || '',
        link: linkUrl || '',
        linkText: linkText || '',
        price: price || '',
        badge: badge || '',
        sourceTag: tag,
        timestamp: new Date().toISOString()
      };
    }
    return null;
  }

  function extractCardsIntoStore() {
    const candidateSelectors = [
      'article',
      '[role="article"]',
      '[class*="card" i]:not(body):not(html)',
      '[class*="product" i]:not(body):not(html)',
      '[class*="item" i]:not(body):not(html)',
      '[class*="post" i]:not(body):not(html)',
      '[class*="entry" i]:not(body):not(html)',
      '[class*="tile" i]:not(body):not(html)',
      '[class*="listing" i]:not(body):not(html)',
      '[class*="result" i]:not(body):not(html)',
      '[data-testid*="tweet" i]',
      '[data-testid*="post" i]',
      '[data-testid*="card" i]',
      'li'
    ];

    const candidateElements = new Set();
    try {
      document.querySelectorAll(candidateSelectors.join(', ')).forEach(el => candidateElements.add(el));
    } catch (e) {}

    // Repeating Sibling Discovery: inspect grids & lists
    try {
      const listParents = document.querySelectorAll('main, section, [class*="grid" i], [class*="list" i], [class*="feed" i], [class*="container" i], [class*="wrapper" i], ul, ol');
      listParents.forEach(parent => {
        if (parent.children && parent.children.length >= 2 && parent.children.length <= 150) {
          let matchingChildren = [];
          for (let i = 0; i < parent.children.length; i++) {
            const child = parent.children[i];
            if (child.nodeType === 1) {
              const hasImg = Boolean(child.querySelector('img, [style*="background-image"]'));
              const hasTxt = (child.innerText || child.textContent || '').trim().length >= 8;
              if (hasImg || hasTxt) {
                matchingChildren.push(child);
              }
            }
          }
          if (matchingChildren.length >= 2) {
            matchingChildren.forEach(c => candidateElements.add(c));
          }
        }
      });
    } catch (e) {}

    // Find parent containers of all images on page (up to 4 levels)
    document.querySelectorAll('img').forEach(img => {
      let p = img.parentElement;
      for (let depth = 0; depth < 4 && p && p !== document.body && p !== document.documentElement; depth++) {
        const tag = p.tagName.toLowerCase();
        if (['article', 'li', 'div', 'section', 'a'].includes(tag)) {
          if (p.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"], [class*="title" i], [class*="heading" i], [class*="name" i], strong')) {
            candidateElements.add(p);
            break;
          }
        }
        p = p.parentElement;
      }
    });

    const validCards = [];

    candidateElements.forEach(el => {
      if (!el || el.nodeType !== 1) return;
      const tag = el.tagName.toLowerCase();
      if (['body', 'html', 'header', 'footer', 'nav', 'aside'].includes(tag)) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0 && !el.offsetParent) return;
      if (rect.width > window.innerWidth * 0.96 && rect.height > window.innerHeight * 1.6) return;

      // Prefer leaf containers
      let hasChildCandidate = false;
      for (const other of candidateElements) {
        if (other !== el && el.contains(other)) {
          if (other.querySelector('img') && other.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"], [class*="title" i]')) {
            hasChildCandidate = true;
            break;
          }
        }
      }
      if (hasChildCandidate) return;

      const card = parseSingleCardElement(el);
      if (card) {
        validCards.push(card);
      }
    });

    // Merge into store
    validCards.forEach(card => {
      const sig = `${card.title}|${card.image}|${card.link}`.toLowerCase();
      if (!store.cards.has(sig)) {
        store.cards.set(sig, card);
      } else {
        const existing = store.cards.get(sig);
        if (!existing.description && card.description) existing.description = card.description;
        if (!existing.image && card.image) existing.image = card.image;
        if (!existing.price && card.price) existing.price = card.price;
        if (!existing.badge && card.badge) existing.badge = card.badge;
      }
    });
  }


  /**
   * =========================================================================
   * DATA TABLES & HTML FORMS EXTRACTORS
   * =========================================================================
   */

  function extractTablesIntoStore() {
    try {
      const tableElements = document.querySelectorAll('table, [role="table"]');
      tableElements.forEach((tableEl) => {
        if (tableEl.offsetWidth === 0 && tableEl.offsetHeight === 0) return;

        let tableId = tableEl.getAttribute('data-omni-table-id');
        if (!tableId) {
          tableId = getNextTableId();
          tableEl.setAttribute('data-omni-table-id', tableId);
        }

        let caption = '';
        const captionEl = tableEl.querySelector('caption');
        if (captionEl) {
          caption = (captionEl.innerText || captionEl.textContent || '').trim();
        } else {
          const prev = tableEl.previousElementSibling;
          if (prev && /^h[1-6]$/i.test(prev.tagName)) {
            caption = (prev.innerText || prev.textContent || '').trim();
          }
        }

        let headers = [];
        const ths = tableEl.querySelectorAll('thead th, tr:first-child th');
        if (ths.length > 0) {
          ths.forEach((th, idx) => {
            const text = (th.innerText || th.textContent || '').trim();
            headers.push(text || `Column ${idx + 1}`);
          });
        }

        const rows = [];
        const trs = tableEl.querySelectorAll('tbody tr, tr');
        trs.forEach((tr, rowIdx) => {
          if (ths.length > 0 && tr.parentElement && tr.parentElement.tagName.toLowerCase() === 'thead') return;
          if (ths.length > 0 && rowIdx === 0 && tr.querySelectorAll('td').length === 0) return;

          const cells = tr.querySelectorAll('td, th');
          if (cells.length === 0) return;

          const rowValues = [];
          const rowObj = {};

          cells.forEach((cell, colIdx) => {
            const val = (cell.innerText || cell.textContent || '').trim().replace(/\s+/g, ' ');
            rowValues.push(val);
            const colHeader = headers[colIdx] || `Col_${colIdx + 1}`;
            rowObj[colHeader] = val;
          });

          if (headers.length === 0 && rowIdx === 0) {
            headers = rowValues.map((v, i) => v || `Column ${i + 1}`);
          } else if (rowValues.some(v => Boolean(v))) {
            rows.push({
              values: rowValues,
              object: rowObj
            });
          }
        });

        if (rows.length === 0 && headers.length === 0) return;
        if (headers.length === 0 && rows.length > 0) {
          const maxCols = Math.max(...rows.map(r => r.values.length));
          for (let i = 0; i < maxCols; i++) headers.push(`Column ${i + 1}`);
        }

        const escapeCsv = (str) => {
          if (!str) return '""';
          const s = String(str).replace(/"/g, '""');
          return `"${s}"`;
        };
        let csv = headers.map(escapeCsv).join(',') + '\n';
        rows.forEach(r => {
          csv += r.values.map(escapeCsv).join(',') + '\n';
        });

        let markdown = '| ' + headers.join(' | ') + ' |\n';
        markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
        rows.forEach(r => {
          const paddedVals = headers.map((_, i) => (r.values[i] || '').replace(/\|/g, '\\|'));
          markdown += '| ' + paddedVals.join(' | ') + ' |\n';
        });

        store.tables.set(tableId, {
          id: tableId,
          caption: caption || `Table #${tableId.split('_').pop()}`,
          headers: headers,
          rowsCount: rows.length,
          colsCount: headers.length,
          rows: rows.map(r => r.object),
          rawRows: rows.map(r => r.values),
          csv: csv,
          markdown: markdown,
          timestamp: new Date().toISOString()
        });
      });
    } catch(err) {
      console.warn('[OmniExtract] Table scan err:', err);
    }
  }

  function extractFormsIntoStore() {
    try {
      const formElements = document.querySelectorAll('form');
      formElements.forEach((formEl, idx) => {
        const formId = formEl.id || `form_${idx + 1}`;
        let action = formEl.getAttribute('action') || window.location.href;
        try {
          action = new URL(action, window.location.href).href;
        } catch (e) {}

        const method = (formEl.getAttribute('method') || 'GET').toUpperCase();
        const name = formEl.getAttribute('name') || formId;

        const inputs = [];
        const fieldEls = formEl.querySelectorAll('input, select, textarea');
        fieldEls.forEach((field) => {
          const fType = field.getAttribute('type') || (field.tagName.toLowerCase() === 'textarea' ? 'textarea' : 'text');
          if (fType === 'hidden' && !field.name) return;

          inputs.push({
            name: field.getAttribute('name') || field.id || '(unnamed)',
            type: fType,
            placeholder: field.getAttribute('placeholder') || '',
            required: field.hasAttribute('required'),
            value: field.value ? (fType === 'password' ? '••••••' : field.value.slice(0, 50)) : ''
          });
        });

        store.forms.set(formId, {
          id: formId,
          name: name,
          action: action,
          method: method,
          fieldsCount: inputs.length,
          fields: inputs,
          timestamp: new Date().toISOString()
        });
      });
    } catch(err) {
      console.warn('[OmniExtract] Form scan err:', err);
    }
  }

  function extractCleanPageMarkdown() {
    try {
      const clone = document.body ? document.body.cloneNode(true) : null;
      if (!clone) return '';

      const stripSelectors = [
        'script', 'style', 'noscript', 'iframe', 'svg', 'canvas',
        'nav', 'header', 'footer', 'aside',
        '[class*="cookie" i]', '[id*="cookie" i]',
        '[class*="banner" i]', '[class*="advert" i]', '[class*="popup" i]',
        '[class*="modal" i]', '#__omni_floating_harvester', '#__omni_picker_banner'
      ];
      clone.querySelectorAll(stripSelectors.join(', ')).forEach(el => el.remove());

      const lines = [];
      lines.push(`# ${document.title || 'Extracted Web Page'}`);
      lines.push(`> Source: [${window.location.href}](${window.location.href})\n`);

      const main = clone.querySelector('main, article, [role="main"]') || clone;

      const walker = document.createTreeWalker(main, NodeFilter.SHOW_ELEMENT);
      let curr = walker.currentNode;

      while (curr) {
        const tag = curr.tagName.toLowerCase();
        const text = (curr.innerText || curr.textContent || '').trim();

        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
          const level = '#'.repeat(parseInt(tag[1]));
          if (text) lines.push(`\n${level} ${text}\n`);
        } else if (tag === 'p' && text.length > 0) {
          lines.push(`\n${text}\n`);
        } else if (tag === 'li' && text.length > 0) {
          lines.push(`- ${text}`);
        } else if (tag === 'blockquote' && text.length > 0) {
          lines.push(`> ${text}\n`);
        } else if (tag === 'pre' && text.length > 0) {
          lines.push(`\n\`\`\`\n${text}\n\`\`\`\n`);
        }
        curr = walker.nextNode();
      }

      return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    } catch (e) {
      return '';
    }
  }

  function highlightTable(tableId) {
    if (!tableId) return;
    const el = document.querySelector(`[data-omni-table-id="${tableId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const origOutline = el.style.outline;
      const origShadow = el.style.boxShadow;
      el.style.outline = '4px solid #10b981';
      el.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.9)';
      setTimeout(() => {
        el.style.outline = origOutline;
        el.style.boxShadow = origShadow;
      }, 3000);
    }
  }

  /**
   * =========================================================================
   * INTERACTIVE CONTAINER & CARD PICKER (Point & Click)
   * =========================================================================
   */

  function startInteractivePicker() {
    if (pickerActive) return;
    pickerActive = true;

    const bar = document.createElement('div');
    bar.id = '__omni_picker_banner';
    bar.style.cssText = `
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      background: #0f1626;
      color: #38bdf8;
      border: 2px solid #38bdf8;
      box-shadow: 0 8px 32px rgba(0,0,0,0.85);
      border-radius: 30px;
      padding: 10px 22px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: default;
    `;
    bar.innerHTML = `
      <span>🎯 Hover & Click any card or container to extract it!</span>
      <button id="__omni_picker_cancel" style="background:#f43f5e; color:#fff; border:none; border-radius:15px; padding:4px 12px; cursor:pointer; font-weight:700; font-size:11px;">Cancel (Esc)</button>
    `;
    (document.body || document.documentElement).appendChild(bar);

    document.getElementById('__omni_picker_cancel')?.addEventListener('click', stopInteractivePicker);

    document.addEventListener('mouseover', onPickerMouseOver, true);
    document.addEventListener('mouseout', onPickerMouseOut, true);
    document.addEventListener('click', onPickerClick, true);
    document.addEventListener('keydown', onPickerKeyDown, true);
  }

  function stopInteractivePicker() {
    pickerActive = false;
    if (hoveredEl) {
      hoveredEl.style.outline = hoveredEl.__omni_prev_outline || '';
      hoveredEl.style.cursor = hoveredEl.__omni_prev_cursor || '';
      hoveredEl = null;
    }
    const bar = document.getElementById('__omni_picker_banner');
    if (bar) bar.remove();

    document.removeEventListener('mouseover', onPickerMouseOver, true);
    document.removeEventListener('mouseout', onPickerMouseOut, true);
    document.removeEventListener('click', onPickerClick, true);
    document.removeEventListener('keydown', onPickerKeyDown, true);
  }

  function onPickerMouseOver(e) {
    if (!pickerActive) return;
    const target = e.target;
    if (target.id === '__omni_picker_banner' || target.closest('#__omni_picker_banner')) return;

    if (hoveredEl && hoveredEl !== target) {
      hoveredEl.style.outline = hoveredEl.__omni_prev_outline || '';
      hoveredEl.style.cursor = hoveredEl.__omni_prev_cursor || '';
    }

    hoveredEl = target;
    hoveredEl.__omni_prev_outline = target.style.outline;
    hoveredEl.__omni_prev_cursor = target.style.cursor;
    hoveredEl.style.outline = '3px dashed #38bdf8';
    hoveredEl.style.cursor = 'crosshair';
  }

  function onPickerMouseOut(e) {
    if (!pickerActive) return;
    if (e.target && e.target === hoveredEl) {
      e.target.style.outline = e.target.__omni_prev_outline || '';
      e.target.style.cursor = e.target.__omni_prev_cursor || '';
      hoveredEl = null;
    }
  }

  function onPickerClick(e) {
    if (!pickerActive) return;
    const target = e.target;
    if (target.id === '__omni_picker_banner' || target.closest('#__omni_picker_banner')) return;

    e.preventDefault();
    e.stopPropagation();

    const selectedContainer = target;
    stopInteractivePicker();

    let extractedCount = 0;
    if (selectedContainer.children && selectedContainer.children.length >= 2) {
      for (let i = 0; i < selectedContainer.children.length; i++) {
        const child = selectedContainer.children[i];
        if (child.nodeType === 1) {
          const card = parseSingleCardElement(child);
          if (card) {
            const sig = `${card.title}|${card.image}|${card.link}`.toLowerCase();
            store.cards.set(sig, card);
            extractedCount++;
          }
        }
      }
    }

    if (extractedCount === 0) {
      const card = parseSingleCardElement(selectedContainer);
      if (card) {
        const sig = `${card.title}|${card.image}|${card.link}`.toLowerCase();
        store.cards.set(sig, card);
        extractedCount = 1;
      }
    }
    // Walk up to parent containers if child element was clicked
    if (extractedCount === 0) {
      let candidate = selectedContainer.parentElement;
      for (let depth = 0; depth < 5 && candidate && candidate !== document.body && candidate !== document.documentElement; depth++) {
        const card = parseSingleCardElement(candidate);
        if (card) {
          const sig = (card.title + '|' + card.image + '|' + card.link).toLowerCase();
          store.cards.set(sig, card);
          extractedCount = 1;
          break;
        }
        if (candidate.children && candidate.children.length >= 2) {
          for (let i = 0; i < candidate.children.length; i++) {
            const child = candidate.children[i];
            if (child.nodeType === 1) {
              const c = parseSingleCardElement(child);
              if (c) {
                const sig = (c.title + '|' + c.image + '|' + c.link).toLowerCase();
                store.cards.set(sig, c);
                extractedCount++;
              }
            }
          }
          if (extractedCount > 0) break;
        }
        candidate = candidate.parentElement;
      }
    }

    broadcastLiveUpdate();
    flashPickerSuccessToast(extractedCount);
  }

  function onPickerKeyDown(e) {
    if (e.key === 'Escape' && pickerActive) {
      stopInteractivePicker();
    }
  }

  function flashPickerSuccessToast(count) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #10b981;
      color: #fff;
      padding: 12px 24px;
      border-radius: 30px;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 8px 30px rgba(0,0,0,0.6);
      z-index: 2147483647;
      animation: __omni_bounce 0.3s ease;
    `;
    toast.textContent = `🎉 Captured ${count || 1} card(s)! Reopen OmniExtract popup to view all.`;
    (document.body || document.documentElement).appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  window.__omniExtractCleanup = () => {
    try {
      if (activeMutationObserver) activeMutationObserver.disconnect();
      if (activeScrollListener) window.removeEventListener('scroll', activeScrollListener);
      if (autoScrollState.intervalId) clearInterval(autoScrollState.intervalId);
      stopInteractivePicker();
      const badge = document.getElementById('__omni_floating_harvester');
      if (badge) badge.remove();
    } catch(e) {}
  };

  function extractHeadings() {
    const headings = [];
    document.querySelectorAll('h1, h2, h3, h4').forEach(h => {
      const text = (h.innerText || h.textContent || '').replace(/\s+/g, ' ').trim();
      if (text) headings.push({ level: h.tagName.toLowerCase(), text: text.substring(0, 140) });
    });
    return headings;
  }

  function detectTechStack() {
    const techs = [];
    if (document.querySelector('[data-reactroot], [data-reactid]') || window.React) techs.push('React');
    if (document.querySelector('#__next') || window.__NEXT_DATA__) techs.push('Next.js');
    if (document.querySelector('#__nuxt') || window.__NUXT__) techs.push('Nuxt.js');
    if (document.querySelector('[data-v-]') || window.Vue) techs.push('Vue.js');
    if (document.querySelector('meta[name="generator"][content*="WordPress" i]')) techs.push('WordPress');
    if (document.querySelector('meta[name="generator"][content*="Shopify" i]') || window.Shopify) techs.push('Shopify');
    if (document.querySelector('meta[name="generator"][content*="Webflow" i]')) techs.push('Webflow');
    if (document.querySelector('script[src*="tailwind"], link[href*="tailwind"]')) techs.push('Tailwind CSS');
    if (document.querySelector('script[src*="bootstrap"], link[href*="bootstrap"]')) techs.push('Bootstrap');
    return techs;
  }

  function getPageStats() {
    const text = document.body ? (document.body.innerText || '') : '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return {
      wordCount: words,
      readingTime: `${Math.max(1, Math.ceil(words / 200))} min`,
      domElementsCount: document.getElementsByTagName('*').length
    };
  }

  /**
   * =========================================================================
   * AUTO-SCROLL ENGINE (Hands-free infinite scroll harvesting)
   * =========================================================================
   */
  function startAutoScroll(maxScrolls = 40) {
    if (autoScrollState.isActive) return;

    autoScrollState.isActive = true;
    autoScrollState.scrollCount = 0;
    autoScrollState.maxScrolls = maxScrolls;
    autoScrollState.lastHeight = (document.body || document.documentElement).scrollHeight;

    createFloatingBadge();

    // Scroll interval: scrolls down 70% viewport height every 800ms
    autoScrollState.intervalId = setInterval(() => {
      if (!autoScrollState.isActive) return;

      autoScrollState.scrollCount++;
      const scrollStep = Math.floor(window.innerHeight * 0.75);
      window.scrollBy({ top: scrollStep, behavior: 'smooth' });

      // Run deep scan immediately to catch newly revealed nodes
      runDeepScan();
      broadcastLiveUpdate();

      // Check if end of page reached or max scrolls reached
      const currentScroll = window.scrollY + window.innerHeight;
      const totalHeight = (document.body || document.documentElement).scrollHeight;

      if (autoScrollState.scrollCount >= autoScrollState.maxScrolls || 
          (currentScroll >= totalHeight - 20 && totalHeight === autoScrollState.lastHeight)) {
        stopAutoScroll();
      } else {
        autoScrollState.lastHeight = totalHeight;
      }

    }, 850);
  }

  function stopAutoScroll() {
    autoScrollState.isActive = false;
    if (autoScrollState.intervalId) {
      clearInterval(autoScrollState.intervalId);
      autoScrollState.intervalId = null;
    }

    // Final deep scan
    runDeepScan();
    broadcastLiveUpdate();

    try {
      chrome.runtime.sendMessage({
        action: 'AUTO_SCROLL_COMPLETE',
        stats: {
          images: store.images.size,
          media: store.media.size,
          cloud: store.cloudLinks.size,
          links: store.links.size
        }
      }).catch(() => {});
    } catch (e) {}

    // Remove or update badge
    if (autoScrollState.floatingBadge) {
      autoScrollState.floatingBadge.innerHTML = `
        <span>🎉 Harvest Complete! (${store.images.size} Images, ${store.media.size} Media)</span>
        <button id="__omni_close_badge" style="background:#000;color:#fff;border:none;border-radius:4px;padding:2px 8px;cursor:pointer;font-weight:700;">OK</button>
      `;
      document.getElementById('__omni_close_badge')?.addEventListener('click', () => {
        removeFloatingBadge();
      });
      setTimeout(removeFloatingBadge, 4000);
    }
  }

  function createFloatingBadge() {
    removeFloatingBadge();
    const badge = document.createElement('div');
    badge.id = '__omni_floating_harvester';
    badge.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999999;
      background: #18181b;
      color: #38bdf8;
      border: 2px solid #38bdf8;
      border-radius: 12px;
      padding: 10px 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 6px 20px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: __omni_bounce 0.3s ease;
    `;
    badge.innerHTML = `
      <span class="__omni_spinner" style="display:inline-block;animation:__omni_spin 1s linear infinite;">⚡</span>
      <span id="__omni_badge_text">Harvesting Dynamic Feed... (${store.images.size} imgs)</span>
      <button id="__omni_stop_btn" style="background:#f43f5e;color:#fff;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-weight:700;font-size:11px;">Stop</button>
    `;
    (document.body || document.documentElement).appendChild(badge);
    autoScrollState.floatingBadge = badge;

    document.getElementById('__omni_stop_btn')?.addEventListener('click', stopAutoScroll);
  }

  function updateFloatingBadge() {
    const textEl = document.getElementById('__omni_badge_text');
    if (textEl && autoScrollState.isActive) {
      textEl.textContent = `Harvesting... ${store.images.size} imgs, ${store.cards.size} cards, ${store.media.size} media (#${autoScrollState.scrollCount}/${autoScrollState.maxScrolls})`;
    }
  }

  function removeFloatingBadge() {
    const existing = document.getElementById('__omni_floating_harvester');
    if (existing) existing.remove();
    autoScrollState.floatingBadge = null;
  }

  function highlightUrl(url) {
    if (!url) return;
    const el = document.querySelector(`[src="${url}"], [href="${url}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const orig = el.style.outline;
      el.style.outline = '4px solid #f43f5e';
      setTimeout(() => el.style.outline = orig, 2500);
    }
  }

  function highlightCard(cardId) {
    if (!cardId) return;
    const el = document.querySelector(`[data-omni-card-id="${cardId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const origOutline = el.style.outline;
      const origShadow = el.style.boxShadow;
      el.style.outline = '3px solid #f59e0b';
      el.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.8)';
      setTimeout(() => {
        el.style.outline = origOutline;
        el.style.boxShadow = origShadow;
      }, 2500);
    }
  }

  // =========================================================================
  // BOOTSTRAP: Start Initial Scan and Observers (Executed after all definitions)
  // =========================================================================
  initialScan();
  setupDynamicObservers();

})();
