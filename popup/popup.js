/**
 * OmniExtract Pro - Popup Controller (Enhanced)
 * Manages UI, Grid/List layouts, Lightbox, Media (Video/Audio) players, Palettes, and Exports.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    currentTab: 'tab-overview',
    pageData: null,
    activeUrl: '',
    domain: '',
    searchQuery: '',
    viewMode: 'grid', // 'grid' or 'list'
    cardViewMode: 'cards', // 'cards' or 'json'
    imageFormatFilter: 'all',
    mediaKindFilter: 'all',
    cloudProviderFilter: 'all',
    linksTypeFilter: 'all',
    sitemapData: null,
    crawlData: null,
    isAutoScrolling: false,
    selectedImageUrls: new Set()
  };

  // DOM Elements
  const elements = {
    currentDomain: document.getElementById('currentDomain'),
    btnRefresh: document.getElementById('btnRefresh'),
    btnOpenViewer: document.getElementById('btnOpenViewer'),
    globalSearchInput: document.getElementById('globalSearchInput'),
    btnClearSearch: document.getElementById('btnClearSearch'),
    viewToggleWrapper: document.getElementById('viewToggleWrapper'),
    btnViewGrid: document.getElementById('btnViewGrid'),
    btnViewList: document.getElementById('btnViewList'),
    btnExport: document.getElementById('btnExport'),
    exportMenu: document.getElementById('exportMenu'),
    btnCopyAll: document.getElementById('btnCopyAll'),
    toast: document.getElementById('toastMessage'),

    // Badges
    badgeImages: document.getElementById('badgeImages'),
    badgeMedia: document.getElementById('badgeMedia'),
    badgeCards: document.getElementById('badgeCards'),
    badgeTables: document.getElementById('badgeTables'),
    badgeLeads: document.getElementById('badgeLeads'),
    badgeCloud: document.getElementById('badgeCloud'),
    badgeLinks: document.getElementById('badgeLinks'),
    badgeSitemap: document.getElementById('badgeSitemap'),

    // Overview Tab
    metaTitle: document.getElementById('metaTitle'),
    metaDescription: document.getElementById('metaDescription'),
    metaCanonical: document.getElementById('metaCanonical'),
    metaKeywords: document.getElementById('metaKeywords'),
    statWords: document.getElementById('statWords'),
    statCards: document.getElementById('statCards'),
    statTables: document.getElementById('statTables'),
    statLeads: document.getElementById('statLeads'),
    statImages: document.getElementById('statImages'),
    statMedia: document.getElementById('statMedia'),
    statCloud: document.getElementById('statCloud'),
    statLinks: document.getElementById('statLinks'),
    lblAiTokenCount: document.getElementById('lblAiTokenCount'),
    aiSnippetPreview: document.getElementById('aiSnippetPreview'),
    btnCopyMarkdownAi: document.getElementById('btnCopyMarkdownAi'),
    btnDownloadMarkdownAi: document.getElementById('btnDownloadMarkdownAi'),
    btnQuickPick: document.getElementById('btnQuickPick'),
    btnQuickAutoScroll: document.getElementById('btnQuickAutoScroll'),
    btnQuickCopyAi: document.getElementById('btnQuickCopyAi'),
    btnQuickViewer: document.getElementById('btnQuickViewer'),
    seoAuditCard: document.getElementById('seoAuditCard'),
    seoScoreVal: document.getElementById('seoScoreVal'),
    lblSeoScoreBadge: document.getElementById('lblSeoScoreBadge'),
    seoChecklistContainer: document.getElementById('seoChecklistContainer'),
    spaStateCard: document.getElementById('spaStateCard'),
    spaStateTitle: document.getElementById('spaStateTitle'),
    spaStateSize: document.getElementById('spaStateSize'),
    btnCopySpaJson: document.getElementById('btnCopySpaJson'),
    btnDownloadSpaJson: document.getElementById('btnDownloadSpaJson'),
    secretsScannerCard: document.getElementById('secretsScannerCard'),
    lblSecretsCount: document.getElementById('lblSecretsCount'),
    secretsListContainer: document.getElementById('secretsListContainer'),
    pillSecretsFilter: document.getElementById('pillSecretsFilter'),
    pillSecretsCount: document.getElementById('pillSecretsCount'),
    tablesCountLabel: document.getElementById('tablesCountLabel'),
    btnCopyAllTablesMd: document.getElementById('btnCopyAllTablesMd'),
    btnExportAllTablesCsv: document.getElementById('btnExportAllTablesCsv'),
    tablesListContainer: document.getElementById('tablesListContainer'),
    leadsSummaryLabel: document.getElementById('leadsSummaryLabel'),
    btnCopyAllEmails: document.getElementById('btnCopyAllEmails'),
    btnCopyAllPhones: document.getElementById('btnCopyAllPhones'),
    btnExportLeadsCsv: document.getElementById('btnExportLeadsCsv'),
    leadsContainer: document.getElementById('leadsContainer'),
    statMedia: document.getElementById('statMedia'),
    statCloud: document.getElementById('statCloud'),
    paletteRow: document.getElementById('paletteRow'),
    fontsRow: document.getElementById('fontsRow'),
    ogTitle: document.getElementById('ogTitle'),
    ogDesc: document.getElementById('ogDesc'),
    ogSite: document.getElementById('ogSite'),
    ogImageBox: document.getElementById('ogImageBox'),
    techStackTags: document.getElementById('techStackTags'),
    headingsList: document.getElementById('headingsList'),

    // Images Tab & Selection
    imagesGalleryContainer: document.getElementById('imagesGalleryContainer'),
    imagesGallery: document.getElementById('imagesGallery'),
    imageFormatFilters: document.getElementById('imageFormatFilters'),
    btnAutoScroll: document.getElementById('btnAutoScroll'),
    imagesSelectionBar: document.getElementById('imagesSelectionBar'),
    btnSelectAllImages: document.getElementById('btnSelectAllImages'),
    btnDeselectAllImages: document.getElementById('btnDeselectAllImages'),
    lblSelectedImagesCount: document.getElementById('lblSelectedImagesCount'),
    btnCopySelectedImageUrls: document.getElementById('btnCopySelectedImageUrls'),
    btnDownloadSelectedImages: document.getElementById('btnDownloadSelectedImages'),

    // Media Tab (Video & Audio)
    mediaListContainer: document.getElementById('mediaListContainer'),
    mediaKindFilters: document.getElementById('mediaKindFilters'),
    btnAutoScrollMedia: document.getElementById('btnAutoScrollMedia'),
    btnDownloadAllMedia: document.getElementById('btnDownloadAllMedia'),

    // Cards Tab (Structured Entities)
    cardsViewContainer: document.getElementById('cardsViewContainer'),
    cardsGrid: document.getElementById('cardsGrid'),
    cardsJsonContainer: document.getElementById('cardsJsonContainer'),
    cardsJsonPre: document.getElementById('cardsJsonPre'),
    cardViewFilters: document.getElementById('cardViewFilters'),
    btnPickContainer: document.getElementById('btnPickContainer'),
    btnAutoScrollCards: document.getElementById('btnAutoScrollCards'),
    btnCopyAllCardsJson: document.getElementById('btnCopyAllCardsJson'),
    btnCopyAllCardsText: document.getElementById('btnCopyAllCardsText'),
    btnCopyRawCardsJson: document.getElementById('btnCopyRawCardsJson'),

    // Cloud Tab
    cloudLinksList: document.getElementById('cloudLinksList'),
    cloudProviderFilters: document.getElementById('cloudProviderFilters'),

    // Links Tab
    allLinksList: document.getElementById('allLinksList'),
    linksTypeFilters: document.getElementById('linksTypeFilters'),

    // Sitemap Tab
    inputCustomSitemap: document.getElementById('inputCustomSitemap'),
    btnFetchSitemap: document.getElementById('btnFetchSitemap'),
    sitemapStatusRow: document.getElementById('sitemapStatusRow'),
    sitemapStatusText: document.getElementById('sitemapStatusText'),
    sitemapMetaBar: document.getElementById('sitemapMetaBar'),
    sitemapCount: document.getElementById('sitemapCount'),
    sitemapUrlsList: document.getElementById('sitemapUrlsList'),
    btnExportSitemapTxt: document.getElementById('btnExportSitemapTxt'),
    btnExportSitemapCsv: document.getElementById('btnExportSitemapCsv'),

    // Crawler Tab
    selectMaxPages: document.getElementById('selectMaxPages'),
    btnStartCrawl: document.getElementById('btnStartCrawl'),
    btnStopCrawl: document.getElementById('btnStopCrawl'),
    crawlProgressContainer: document.getElementById('crawlProgressContainer'),
    crawlProgressFill: document.getElementById('crawlProgressFill'),
    crawlProgressText: document.getElementById('crawlProgressText'),
    crawlerResultsArea: document.getElementById('crawlerResultsArea'),

    // Lightbox
    imageLightboxModal: document.getElementById('imageLightboxModal'),
    lightboxBackdrop: document.getElementById('lightboxBackdrop'),
    lightboxCloseBtn: document.getElementById('lightboxCloseBtn'),
    lightboxImg: document.getElementById('lightboxImg'),
    lightboxDims: document.getElementById('lightboxDims'),
    lightboxUrl: document.getElementById('lightboxUrl'),
    lightboxCopyBtn: document.getElementById('lightboxCopyBtn'),
    lightboxDownloadBtn: document.getElementById('lightboxDownloadBtn')
  };

  init();

  async function init() {
    setupTabNavigation();
    setupEventListeners();
    setupLightbox();
    await loadActiveTabData();
    checkAutoScrollStatus();
  }

  /**
   * Loads data from active tab
   */
  async function loadActiveTabData() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
        elements.currentDomain.textContent = 'Browser Internal Page';
        showToast('Open a regular website to extract data');
        return;
      }

      state.activeUrl = tab.url;
      const parsedUrl = new URL(tab.url);
      state.domain = parsedUrl.hostname;
      elements.currentDomain.textContent = state.domain;

      chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_PAGE_DATA' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['scripts/content.js']
          }, () => {
            if (chrome.runtime.lastError) {
              elements.currentDomain.textContent = 'Cannot extract on this page';
              return;
            }
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_PAGE_DATA' }, (res2) => {
                if (res2 && res2.success) {
                  populateData(res2.data);
                } else {
                  elements.currentDomain.textContent = 'Please reload webpage (F5)';
                  showToast('Please reload active tab (F5) to enable OmniExtract', 4000);
                }
              });
            }, 150);
          });
        } else {
          populateData(response.data);
        }
      });

    } catch (err) {
      console.error('[OmniExtract] Tab error:', err);
      elements.currentDomain.textContent = 'Error connecting to tab';
    }
  }

  /**
   * Populate UI with extracted data
   */
  function populateData(data) {
    state.pageData = data;

    // Badges
    const tableCount = (data.tables && data.tables.length) || 0;
    const emailCount = (data.contacts && data.contacts.emails && data.contacts.emails.length) || 0;
    const phoneCount = (data.contacts && data.contacts.phones && data.contacts.phones.length) || 0;
    const socialCount = (data.contacts && data.contacts.socials && data.contacts.socials.length) || 0;
    const leadsTotal = emailCount + phoneCount + socialCount;

    elements.badgeImages.textContent = (data.images && data.images.length) || 0;
    elements.badgeMedia.textContent = (data.media && data.media.length) || 0;
    elements.badgeCards.textContent = (data.cards && data.cards.length) || 0;
    if (elements.badgeTables) elements.badgeTables.textContent = tableCount;
    if (elements.badgeLeads) elements.badgeLeads.textContent = leadsTotal;
    elements.badgeCloud.textContent = (data.cloudLinks && data.cloudLinks.length) || 0;
    elements.badgeLinks.textContent = (data.links && data.links.length) || 0;

    // In-page XML Sitemap auto-detection
    if (data.inPageSitemap && data.inPageSitemap.count > 0) {
      elements.badgeSitemap.textContent = data.inPageSitemap.count;
      elements.inputCustomSitemap.value = data.inPageSitemap.sourceUrl;
      state.sitemapData = {
        origin: state.domain,
        discoveredSources: [data.inPageSitemap.sourceUrl],
        totalUrls: data.inPageSitemap.count,
        urls: data.inPageSitemap.urls
      };
      elements.sitemapStatusText.textContent = `Extracted ${data.inPageSitemap.count} ${data.inPageSitemap.isIndex ? 'sub-sitemaps from index' : 'URLs'} from this page!`;
      elements.sitemapMetaBar.style.display = 'flex';
      elements.sitemapCount.textContent = `${data.inPageSitemap.count.toLocaleString()} URLs Found`;
      renderSitemapUrls(data.inPageSitemap.urls);
    } else if (data.url && (data.url.endsWith('.xml') || data.url.includes('sitemap'))) {
      elements.inputCustomSitemap.value = data.url;
    }

    // Overview Tab
    elements.metaTitle.textContent = data.metadata.title || 'Untitled';
    elements.metaDescription.textContent = data.metadata.description || 'No description meta tag found.';
    elements.metaCanonical.textContent = data.metadata.canonical || data.url;
    elements.metaKeywords.textContent = data.metadata.keywords || (data.metadata.author ? `Author: ${data.metadata.author}` : 'None detected');

    elements.statWords.textContent = (data.stats.wordCount || 0).toLocaleString();
    elements.statCards.textContent = (data.cards && data.cards.length) || 0;
    if (elements.statTables) elements.statTables.textContent = tableCount;
    if (elements.statLeads) elements.statLeads.textContent = leadsTotal;
    elements.statImages.textContent = (data.images && data.images.length) || 0;
    elements.statMedia.textContent = (data.media && data.media.length) || 0;
    elements.statCloud.textContent = (data.cloudLinks && data.cloudLinks.length) || 0;
    if (elements.statLinks) elements.statLinks.textContent = (data.links && data.links.length) || 0;

    // AI Markdown preview and token count
    if (data.cleanMarkdown) {
      const approxTokens = Math.round(data.cleanMarkdown.length / 4);
      if (elements.lblAiTokenCount) {
        elements.lblAiTokenCount.textContent = `~${approxTokens} tokens • Prompt Ready`;
      }
      if (elements.aiSnippetPreview) {
        const previewText = data.cleanMarkdown.split('\n').filter(Boolean).slice(0, 3).join(' • ');
        elements.aiSnippetPreview.innerHTML = `<code>${escapeHtml(previewText || '# Ready for LLMs')}</code>`;
      }
    }

    // SEO Health Audit
    renderSeoAudit(data.seoAudit);

    // Framework State & Secrets
    renderFrameworkState(data.frameworkState);
    renderSecrets(data.frameworkState?.secrets);

    // Color Palette & Fonts
    renderDesignAssets(data.designAssets);

    // OpenGraph
    const og = data.metadata.openGraph || {};
    elements.ogTitle.textContent = og['og:title'] || data.metadata.title || 'No OG Title';
    elements.ogDesc.textContent = og['og:description'] || data.metadata.description || 'No OG Description';
    elements.ogSite.textContent = og['og:site_name'] || state.domain;

    if (og['og:image']) {
      elements.ogImageBox.style.backgroundImage = `url("${og['og:image']}")`;
      elements.ogImageBox.textContent = '';
    } else {
      elements.ogImageBox.style.backgroundImage = 'none';
      elements.ogImageBox.textContent = 'No OG Image';
    }

    // Tech stack
    if (data.technologies && data.technologies.length > 0) {
      elements.techStackTags.innerHTML = data.technologies
        .map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`)
        .join('');
    } else {
      elements.techStackTags.innerHTML = '<span class="tag-empty">Standard HTML / Vanilla JS</span>';
    }

    // Headings
    if (data.headings && data.headings.length > 0) {
      elements.headingsList.innerHTML = data.headings.slice(0, 25).map(h => `
        <div class="heading-row">
          <span class="heading-tag">${h.level.toUpperCase()}</span>
          <span class="heading-text" title="${escapeHtml(h.text)}">${escapeHtml(h.text)}</span>
        </div>
      `).join('');
    } else {
      elements.headingsList.innerHTML = '<div class="empty-state">No H1-H4 tags detected.</div>';
    }

    // Render tabs
    renderImagesTab();
    renderMediaTab();
    renderCardsTab();
    renderTablesTab();
    renderLeadsTab();
    renderCloudTab();
    renderLinksTab();
  }


  function renderSeoAudit(audit) {
    if (!audit || !elements.seoAuditCard) return;

    if (elements.seoScoreVal) {
      elements.seoScoreVal.textContent = audit.score;
    }

    if (elements.lblSeoScoreBadge) {
      if (audit.score >= 85) {
        elements.lblSeoScoreBadge.style.color = '#34d399';
        elements.lblSeoScoreBadge.style.borderColor = 'rgba(16, 185, 129, 0.5)';
        elements.lblSeoScoreBadge.style.background = 'rgba(16, 185, 129, 0.15)';
      } else if (audit.score >= 60) {
        elements.lblSeoScoreBadge.style.color = '#fbbf24';
        elements.lblSeoScoreBadge.style.borderColor = 'rgba(245, 158, 11, 0.5)';
        elements.lblSeoScoreBadge.style.background = 'rgba(245, 158, 11, 0.15)';
      } else {
        elements.lblSeoScoreBadge.style.color = '#f43f5e';
        elements.lblSeoScoreBadge.style.borderColor = 'rgba(244, 63, 94, 0.5)';
        elements.lblSeoScoreBadge.style.background = 'rgba(244, 63, 94, 0.15)';
      }
    }

    if (elements.seoChecklistContainer && audit.checks) {
      elements.seoChecklistContainer.innerHTML = audit.checks.map(c => {
        const icon = c.status === 'pass' ? '✓' : (c.status === 'warn' ? '!' : '✕');
        return `
          <div class="seo-check-item">
            <div class="seo-check-left">
              <span class="seo-check-icon ${c.status}">${icon}</span>
              <span class="seo-check-name">${escapeHtml(c.name)}</span>
            </div>
            <span class="seo-check-msg">${escapeHtml(c.message)}</span>
          </div>
        `;
      }).join('');
    }
  }

  function renderFrameworkState(frameworkState) {
    if (!elements.spaStateCard) return;

    if (frameworkState && frameworkState.rawState) {
      elements.spaStateCard.style.display = 'block';
      const sizeKb = Math.round(frameworkState.stateSize / 1024) || 1;
      if (elements.spaStateTitle) {
        elements.spaStateTitle.textContent = `${frameworkState.rawStateType || 'SPA State Payload'}`;
      }
      if (elements.spaStateSize) {
        elements.spaStateSize.textContent = `${sizeKb} KB JSON state detected • Full props payload`;
      }

      elements.btnCopySpaJson.onclick = () => {
        copyToClipboard(JSON.stringify(frameworkState.rawState, null, 2));
        showToast('📋 Copied full SPA State JSON to clipboard!');
      };

      elements.btnDownloadSpaJson.onclick = () => {
        downloadFile(JSON.stringify(frameworkState.rawState, null, 2), `${state.domain}-state.json`, 'application/json');
      };
    } else {
      elements.spaStateCard.style.display = 'none';
    }
  }

  function renderSecrets(secrets) {
    if (!elements.secretsScannerCard) return;

    if (secrets && secrets.length > 0) {
      elements.secretsScannerCard.style.display = 'block';
      if (elements.lblSecretsCount) elements.lblSecretsCount.textContent = `${secrets.length} Keys Found`;
      if (elements.pillSecretsFilter) {
        elements.pillSecretsFilter.style.display = 'inline-block';
        if (elements.pillSecretsCount) elements.pillSecretsCount.textContent = secrets.length;
      }

      if (elements.secretsListContainer) {
        elements.secretsListContainer.innerHTML = secrets.map(s => `
          <div class="secret-item-row">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="${s.severity === 'critical' ? 'secret-badge-crit' : 'secret-badge-warn'}">${s.type}</span>
              <span style="color: #cbd5e1;">${escapeHtml(s.masked)}</span>
            </div>
            <button class="btn-copy-secret" data-raw="${escapeHtml(s.raw)}">Copy</button>
          </div>
        `).join('');

        elements.secretsListContainer.querySelectorAll('.btn-copy-secret').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(btn.dataset.raw);
            showToast('Copied API key / credential to clipboard!');
          });
        });
      }
    } else {
      elements.secretsScannerCard.style.display = 'none';
      if (elements.pillSecretsFilter) elements.pillSecretsFilter.style.display = 'none';
    }
  }

  function renderDesignAssets(assets) {
    if (!assets) return;

    if (assets.colors && assets.colors.length > 0) {
      elements.paletteRow.innerHTML = assets.colors.map(hex => `
        <div class="color-swatch-chip" data-hex="${hex}" title="Click to copy ${hex}">
          <span class="color-circle" style="background-color: ${hex};"></span>
          <span>${hex}</span>
        </div>
      `).join('');

      elements.paletteRow.querySelectorAll('.color-swatch-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          copyToClipboard(chip.dataset.hex);
          showToast(`Copied color ${chip.dataset.hex}`);
        });
      });
    } else {
      elements.paletteRow.innerHTML = '<span class="tag-empty">No dominant colors detected</span>';
    }

    if (assets.fonts && assets.fonts.length > 0) {
      elements.fontsRow.innerHTML = assets.fonts.map(f => `
        <span class="font-badge" title="Font Family">${escapeHtml(f)}</span>
      `).join('');
    }
  }

  /**
   * =========================================================================
   * RENDER IMAGES TAB (PRO REDESIGN - NO COLLAPSED BOXES)
   * =========================================================================
   */
  /**
   * Toggle selection state for an image
   */
  function toggleImageSelection(url, card, cb) {
    if (!url) return;
    if (state.selectedImageUrls.has(url)) {
      state.selectedImageUrls.delete(url);
      if (card) card.classList.remove('selected');
      if (cb) cb.classList.remove('checked');
    } else {
      state.selectedImageUrls.add(url);
      if (card) card.classList.add('selected');
      if (cb) cb.classList.add('checked');
    }
    updateImageSelectionUI();
  }

  /**
   * Update selection counter and action buttons in Images tab
   */
  function updateImageSelectionUI() {
    const count = state.selectedImageUrls.size;
    if (elements.lblSelectedImagesCount) {
      elements.lblSelectedImagesCount.textContent = count === 0 ? '0 selected' : `${count} selected`;
      if (count > 0) {
        elements.lblSelectedImagesCount.classList.add('active');
      } else {
        elements.lblSelectedImagesCount.classList.remove('active');
      }
    }

    if (elements.btnCopySelectedImageUrls) {
      if (count > 0) {
        elements.btnCopySelectedImageUrls.style.display = 'inline-flex';
        elements.btnCopySelectedImageUrls.textContent = `Copy URLs (${count})`;
      } else {
        elements.btnCopySelectedImageUrls.style.display = 'none';
      }
    }

    if (elements.btnDownloadSelectedImages) {
      if (count > 0) {
        elements.btnDownloadSelectedImages.innerHTML = `⬇ Download Selected (${count})`;
        elements.btnDownloadSelectedImages.classList.remove('btn-outline');
        elements.btnDownloadSelectedImages.classList.add('btn-primary');
      } else {
        elements.btnDownloadSelectedImages.innerHTML = `Download All`;
        elements.btnDownloadSelectedImages.classList.remove('btn-primary');
        elements.btnDownloadSelectedImages.classList.add('btn-outline');
      }
    }
  }

  function renderImagesTab() {
    if (!state.pageData || !state.pageData.images) return;

    let items = state.pageData.images;

    // Apply format or dimension filter
    if (state.imageFormatFilter !== 'all') {
      if (state.imageFormatFilter === 'highres') {
        items = items.filter(img => (img.width >= 1000 || img.height >= 800));
      } else if (state.imageFormatFilter === 'icons') {
        items = items.filter(img => (img.width > 0 && img.width <= 120 && img.height <= 120));
      } else {
        items = items.filter(img => img.format === state.imageFormatFilter);
      }
    }

    // Apply search query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      items = items.filter(img => img.url.toLowerCase().includes(q) || (img.alt && img.alt.toLowerCase().includes(q)));
    }

    if (items.length === 0) {
      elements.imagesGallery.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; width: 100%;">
          <p>No images matching filter</p>
        </div>`;
      return;
    }

    // Apply Layout Class (grid-layout vs list-layout)
    elements.imagesGallery.className = `image-gallery ${state.viewMode === 'grid' ? 'grid-layout' : 'list-layout'}`;

    if (state.viewMode === 'grid') {
      // GRID VIEW
      elements.imagesGallery.innerHTML = items.map((img, idx) => {
        const dims = (img.width && img.height) ? `${img.width}×${img.height}` : (img.format || 'IMG');
        const isSelected = state.selectedImageUrls.has(img.url);
        return `
          <div class="image-card-pro ${isSelected ? 'selected' : ''}" data-url="${escapeHtml(img.url)}" data-dims="${escapeHtml(dims)}" data-idx="${idx}">
            <div class="image-select-checkbox ${isSelected ? 'checked' : ''}" title="Select image">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div class="image-thumb-area">
              <img src="${escapeHtml(img.url)}" 
                   referrerpolicy="no-referrer" 
                   loading="lazy" 
                   alt="${escapeHtml(img.alt || 'Image')}">
              <span class="image-format-badge">${escapeHtml(img.format || 'IMG')}</span>
              
              <!-- Hover Overlay with Actions -->
              <div class="image-hover-overlay">
                <button class="overlay-btn btn-zoom" title="Zoom in Lightbox">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6M8 11h6"/>
                  </svg>
                </button>
                <button class="overlay-btn btn-copy-card" title="Copy URL">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                </button>
                <button class="overlay-btn btn-dl-card" title="Download Image">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="image-info-bar">
              <span class="image-res">${escapeHtml(dims)}</span>
              <button class="image-quick-copy btn-quick-copy">Copy</button>
            </div>
          </div>
        `;
      }).join('');

    } else {
      // LIST VIEW
      elements.imagesGallery.innerHTML = items.map((img, idx) => {
        const dims = (img.width && img.height) ? `${img.width}×${img.height}px` : (img.format || 'IMG');
        const filename = getUrlFilename(img.url);
        const isSelected = state.selectedImageUrls.has(img.url);
        return `
          <div class="image-list-row ${isSelected ? 'selected' : ''}" data-url="${escapeHtml(img.url)}" data-dims="${escapeHtml(dims)}">
            <div class="image-select-checkbox ${isSelected ? 'checked' : ''}" style="position: static; flex-shrink: 0;" title="Select image">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <img class="image-mini-thumb" src="${escapeHtml(img.url)}" referrerpolicy="no-referrer" loading="lazy">
            <div class="image-list-details">
              <div class="image-list-title" title="${escapeHtml(img.url)}">${escapeHtml(filename)}</div>
              <div class="image-list-meta">${escapeHtml(dims)} &bull; ${escapeHtml(img.format || 'IMG')}</div>
            </div>
            <div class="list-row-badges">
              <button class="copy-mini-btn btn-zoom">Zoom</button>
              <button class="copy-mini-btn btn-copy-card">Copy</button>
              <button class="copy-mini-btn btn-dl-card">Save</button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Attach Event Listeners to cards
    const cards = elements.imagesGallery.querySelectorAll('.image-card-pro, .image-list-row');
    cards.forEach(card => {
      const url = card.dataset.url;
      const dims = card.dataset.dims;
      const imgEl = card.querySelector('img');
      const cb = card.querySelector('.image-select-checkbox');

      // Checkbox click
      if (cb) {
        cb.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleImageSelection(url, card, cb);
        });
      }

      // Graceful error fallback if image protected or blocked by hotlink
      if (imgEl) {
        imgEl.addEventListener('error', () => {
          const thumbArea = card.querySelector('.image-thumb-area');
          if (thumbArea) {
            thumbArea.innerHTML = `
              <div class="image-fallback-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
                <span>Direct Access Only</span>
              </div>
            `;
          }
        });
      }

      // Zoom in Lightbox
      card.querySelectorAll('.btn-zoom').forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          openLightbox(url, dims);
        });
      });

      // Copy URL
      card.querySelectorAll('.btn-copy-card, .btn-quick-copy').forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          copyToClipboard(url);
          showToast('Image URL copied!');
        });
      });

      // Single Download
      card.querySelectorAll('.btn-dl-card').forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          downloadUrl(url);
        });
      });

      // Clicking card body: Ctrl/Shift/Cmd click toggles selection, otherwise opens lightbox in grid view
      card.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          toggleImageSelection(url, card, cb);
          return;
        }
        if (state.viewMode === 'grid' && !e.target.closest('.image-hover-overlay, .image-select-checkbox, .image-quick-copy')) {
          openLightbox(url, dims);
        }
      });
    });

    updateImageSelectionUI();
  }

  /**
   * =========================================================================
   * RENDER VIDEO & AUDIO TAB (NEW FEATURE)
   * =========================================================================
   */
  function renderMediaTab() {
    if (!state.pageData || !state.pageData.media) return;

    let items = state.pageData.media;

    if (state.mediaKindFilter !== 'all') {
      items = items.filter(m => m.kind === state.mediaKindFilter);
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      items = items.filter(m => m.url.toLowerCase().includes(q) || (m.title && m.title.toLowerCase().includes(q)));
    }

    if (items.length === 0) {
      elements.mediaListContainer.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <p>No video or audio assets found matching filter.</p>
        </div>`;
      return;
    }

    elements.mediaListContainer.innerHTML = items.map(m => {
      const isVideo = m.kind === 'video';
      const isAudio = m.kind === 'audio';
      const badgeClass = isVideo ? 'badge-rose' : 'badge-accent';

      return `
        <div class="media-card" data-url="${escapeHtml(m.url)}">
          <div class="media-thumb-box">
            ${m.poster ? `<img src="${escapeHtml(m.poster)}" referrerpolicy="no-referrer">` : `
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--text-muted)" stroke-width="1.5">
                ${isVideo ? '<polygon points="5 3 19 12 5 21 5 3"/>' : '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'}
              </svg>
            `}
            <div class="media-play-icon">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <polygon points="6 4 18 12 6 20 6 4"/>
              </svg>
            </div>
          </div>
          <div class="media-details">
            <div class="media-title" title="${escapeHtml(m.title || m.url)}">${escapeHtml(m.title || getUrlFilename(m.url))}</div>
            <div class="media-sub">${escapeHtml(m.source)} &bull; <span class="badge ${badgeClass}">${escapeHtml(m.format)}</span></div>
            ${isAudio ? `<audio controls src="${escapeHtml(m.url)}" preload="none"></audio>` : ''}
            <div class="media-actions">
              <a href="${escapeHtml(m.url)}" target="_blank" rel="noopener" class="btn-xs btn-outline">Open in Tab</a>
              <button class="btn-xs btn-secondary btn-copy-media" data-url="${escapeHtml(m.url)}">Copy Link</button>
              <button class="btn-xs btn-primary btn-dl-media" data-url="${escapeHtml(m.url)}">Download</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners
    elements.mediaListContainer.querySelectorAll('.btn-copy-media').forEach(b => {
      b.addEventListener('click', () => {
        copyToClipboard(b.dataset.url);
        showToast('Media link copied!');
      });
    });

    elements.mediaListContainer.querySelectorAll('.btn-dl-media').forEach(b => {
      b.addEventListener('click', () => downloadUrl(b.dataset.url));
    });
  }

  /**
   * =========================================================================
   * RENDER STRUCTURED CARDS TAB (NEW FEATURE)
   * Shows entities in exact position (Title + Image + Description + Link + Price)
   * =========================================================================
   */
  function renderCardsTab() {
    if (!state.pageData || !state.pageData.cards) return;

    let items = state.pageData.cards;

    // Search query filter
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      items = items.filter(c => 
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.link && c.link.toLowerCase().includes(q)) ||
        (c.badge && c.badge.toLowerCase().includes(q)) ||
        (c.price && c.price.toLowerCase().includes(q))
      );
    }

    // Toggle View Mode (Cards View vs JSON View)
    if (state.cardViewMode === 'json') {
      elements.cardsViewContainer.style.display = 'none';
      elements.cardsJsonContainer.style.display = 'flex';
      elements.cardsJsonPre.textContent = JSON.stringify(items, null, 2);
      return;
    }

    elements.cardsViewContainer.style.display = 'flex';
    elements.cardsJsonContainer.style.display = 'none';

    if (items.length === 0) {
      elements.cardsGrid.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
          <p>No structured card components detected.</p>
          <p style="font-size: 11px;">Try clicking ⚡ Auto-Scroll to scan dynamic feeds or articles.</p>
        </div>`;
      return;
    }

    elements.cardsGrid.innerHTML = items.map((card, idx) => {
      return `
        <div class="entity-card" data-card-id="${escapeHtml(card.id)}" data-idx="${idx}">
          <div class="entity-thumb-box">
            ${card.image ? `
              <img src="${escapeHtml(card.image)}" referrerpolicy="no-referrer" loading="lazy" alt="${escapeHtml(card.alt || card.title)}">
            ` : `
              <div class="entity-fallback-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
                <span>No Image</span>
              </div>
            `}
          </div>

          <div class="entity-card-content">
            <div class="entity-header-row">
              <div class="entity-title" title="${escapeHtml(card.title)}">${escapeHtml(card.title)}</div>
              <div class="entity-badge-group">
                ${card.price ? `<span class="entity-price-badge">${escapeHtml(card.price)}</span>` : ''}
                ${card.badge ? `<span class="entity-badge">${escapeHtml(card.badge)}</span>` : ''}
              </div>
            </div>

            ${card.description ? `
              <div class="entity-desc" title="${escapeHtml(card.description)}">${escapeHtml(card.description)}</div>
            ` : '<div class="entity-desc" style="color:var(--text-muted); font-style:italic;">No description text found</div>'}

            <div class="entity-footer-row">
              ${card.link ? `
                <a href="${escapeHtml(card.link)}" target="_blank" class="entity-url-link" title="${escapeHtml(card.link)}">
                  🔗 ${escapeHtml(card.linkText || card.link)}
                </a>
              ` : '<span style="font-size:10px; color:var(--text-muted);">Inline Card</span>'}

              <div class="entity-actions">
                <button class="entity-btn entity-btn-highlight btn-highlight-card" title="Scroll & highlight on webpage">
                  🎯 Locate
                </button>
                <button class="entity-btn btn-copy-card-all" title="Copy Title, Image, Description & Link in one click">
                  📋 Copy All
                </button>
                <button class="entity-btn btn-copy-card-json" title="Copy as JSON object">
                  { } JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach card event listeners
    const cardEls = elements.cardsGrid.querySelectorAll('.entity-card');
    cardEls.forEach(el => {
      const idx = parseInt(el.dataset.idx, 10);
      const card = items[idx];
      if (!card) return;

      // Image error fallback
      const img = el.querySelector('img');
      if (img) {
        img.addEventListener('error', () => {
          img.parentElement.innerHTML = `
            <div class="entity-fallback-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              </svg>
              <span>Image Protected</span>
            </div>
          `;
        });
      }

      // Highlight on page
      el.querySelector('.btn-highlight-card')?.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          if (!tab || !tab.id) return;
          chrome.tabs.sendMessage(tab.id, { action: 'HIGHLIGHT_CARD', cardId: card.id }, () => {
            showToast(`Highlighted "${card.title.substring(0, 20)}..." on page!`);
          });
        });
      });

      // Copy All formatted text
      el.querySelector('.btn-copy-card-all')?.addEventListener('click', () => {
        const text = formatCardText(card);
        copyToClipboard(text);
        showToast('Copied card (Title, Image, Desc & Link)!');
      });

      // Copy JSON
      el.querySelector('.btn-copy-card-json')?.addEventListener('click', () => {
        const json = JSON.stringify(card, null, 2);
        copyToClipboard(json);
        showToast('Card copied as JSON!');
      });

      // Title click opens lightbox if image exists
      el.querySelector('.entity-title')?.addEventListener('click', () => {
        if (card.image) openLightbox(card.image, card.title);
      });
    });
  }


  /**
   * =========================================================================
   * DATA TABLES TAB CONTROLLER
   * =========================================================================
   */
  function renderTablesTab() {
    if (!state.pageData) return;
    const tables = state.pageData.tables || [];

    if (elements.tablesCountLabel) {
      elements.tablesCountLabel.textContent = `${tables.length} Table${tables.length === 1 ? '' : 's'} Discovered`;
    }

    if (tables.length === 0) {
      elements.tablesListContainer.innerHTML = `
        <div class="empty-state">
          <p style="font-size: 13px; color: var(--text-primary);">No HTML tables found on this page.</p>
          <p style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
            If data is in a repeating list or cards format, check the <strong>Cards</strong> tab!
          </p>
        </div>`;
      return;
    }

    elements.tablesListContainer.innerHTML = tables.map((tbl, idx) => {
      const headerRowHtml = (tbl.headers && tbl.headers.length > 0)
        ? `<tr>${tbl.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`
        : '';

      const bodyRowsHtml = (tbl.previewRows || []).map(row => {
        return `<tr>${row.map(cell => `<td title="${escapeHtml(cell)}">${escapeHtml(cell)}</td>`).join('')}</tr>`;
      }).join('');

      return `
        <div class="table-card-pro" data-table-id="${escapeHtml(tbl.id)}">
          <div class="table-card-header">
            <div class="table-title">
              <span>📊</span>
              <span>${escapeHtml(tbl.title)}</span>
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
              <span class="table-meta-badge">${tbl.rowCount} Rows × ${tbl.colCount} Cols</span>
            </div>
          </div>

          <div class="table-preview-scroll">
            <table class="omni-table">
              <thead>${headerRowHtml}</thead>
              <tbody>${bodyRowsHtml}</tbody>
            </table>
          </div>

          <div class="table-actions-row">
            <button class="btn-xs btn-outline btn-inspect-table" data-table-id="${escapeHtml(tbl.id)}" style="border-color: #10b981; color: #10b981;">
              🎯 Inspect
            </button>
            <button class="btn-xs btn-outline btn-copy-table-md" data-idx="${idx}">
              📝 Markdown
            </button>
            <button class="btn-xs btn-outline btn-copy-table-json" data-idx="${idx}">
              📋 JSON
            </button>
            <button class="btn-xs btn-primary btn-download-table-csv" data-idx="${idx}">
              📥 CSV
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Wire table card buttons
    elements.tablesListContainer.querySelectorAll('.btn-inspect-table').forEach(btn => {
      btn.addEventListener('click', () => {
        const tableId = btn.dataset.tableId;
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          if (tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, { action: 'HIGHLIGHT_TABLE', tableId });
            showToast('Highlighted table on webpage!');
          }
        });
      });
    });

    elements.tablesListContainer.querySelectorAll('.btn-copy-table-md').forEach(btn => {
      btn.addEventListener('click', () => {
        const tbl = tables[Number(btn.dataset.idx)];
        if (tbl && tbl.markdown) {
          copyToClipboard(tbl.markdown);
          showToast(`Copied "${tbl.title}" as Markdown Table!`);
        }
      });
    });

    elements.tablesListContainer.querySelectorAll('.btn-copy-table-json').forEach(btn => {
      btn.addEventListener('click', () => {
        const tbl = tables[Number(btn.dataset.idx)];
        if (tbl && tbl.json) {
          copyToClipboard(JSON.stringify(tbl.json, null, 2));
          showToast(`Copied "${tbl.title}" as JSON array!`);
        }
      });
    });

    elements.tablesListContainer.querySelectorAll('.btn-download-table-csv').forEach(btn => {
      btn.addEventListener('click', () => {
        const tbl = tables[Number(btn.dataset.idx)];
        if (tbl && tbl.csv) {
          const safeName = (tbl.title || 'table').toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
          downloadFile(tbl.csv, `${state.domain}-${safeName}.csv`, 'text/csv');
        }
      });
    });
  }

  /**
   * =========================================================================
   * LEADS, CONTACTS & FORMS TAB CONTROLLER
   * =========================================================================
   */
  function renderLeadsTab() {
    if (!state.pageData) return;
    const contacts = state.pageData.contacts || { emails: [], phones: [], socials: [] };
    const emails = contacts.emails || [];
    const phones = contacts.phones || [];
    const socials = contacts.socials || [];
    const forms = state.pageData.forms || [];

    const totalCount = emails.length + phones.length + socials.length;
    if (elements.leadsSummaryLabel) {
      elements.leadsSummaryLabel.textContent = `${totalCount} Contacts & Leads (${emails.length} Emails • ${phones.length} Phones • ${socials.length} Socials)`;
    }

    if (totalCount === 0 && forms.length === 0) {
      elements.leadsContainer.innerHTML = `
        <div class="empty-state">
          <p style="font-size: 13px; color: var(--text-primary);">No direct emails, phone numbers, or social profiles detected.</p>
          <p style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
            Check the <strong>Links</strong> tab for all other outbound links.
          </p>
        </div>`;
      return;
    }

    let html = '';

    // 1. Emails Section
    if (emails.length > 0) {
      html += `
        <div class="leads-section">
          <div class="leads-section-header">
            <div class="leads-section-title">
              <span>✉️</span>
              <span>Discovered Emails (${emails.length})</span>
            </div>
            <button class="btn-xs btn-outline btn-copy-all-emails-mini" style="font-size: 10px; padding: 2px 7px;">Copy All</button>
          </div>
          <div class="leads-list">
            ${emails.map(em => `
              <div class="lead-item-row">
                <span class="lead-val-text selectable">${escapeHtml(em)}</span>
                <div style="display: flex; gap: 4px;">
                  <button class="btn-xs btn-outline btn-copy-single-lead" data-val="${escapeHtml(em)}" style="padding: 2px 6px;">Copy</button>
                  <a href="mailto:${escapeHtml(em)}" class="btn-xs btn-primary" style="padding: 2px 6px; text-decoration: none;">Email</a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 2. Phone Numbers Section
    if (phones.length > 0) {
      html += `
        <div class="leads-section">
          <div class="leads-section-header">
            <div class="leads-section-title">
              <span>📞</span>
              <span>Phone Numbers (${phones.length})</span>
            </div>
            <button class="btn-xs btn-outline btn-copy-all-phones-mini" style="font-size: 10px; padding: 2px 7px;">Copy All</button>
          </div>
          <div class="leads-list">
            ${phones.map(ph => `
              <div class="lead-item-row">
                <span class="lead-val-text selectable">${escapeHtml(ph)}</span>
                <div style="display: flex; gap: 4px;">
                  <button class="btn-xs btn-outline btn-copy-single-lead" data-val="${escapeHtml(ph)}" style="padding: 2px 6px;">Copy</button>
                  <a href="tel:${escapeHtml(ph)}" class="btn-xs btn-primary" style="padding: 2px 6px; text-decoration: none;">Call</a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 3. Social Profiles Section
    if (socials.length > 0) {
      html += `
        <div class="leads-section">
          <div class="leads-section-header">
            <div class="leads-section-title">
              <span>🌐</span>
              <span>Social & Community Profiles (${socials.length})</span>
            </div>
          </div>
          <div class="social-grid-cards">
            ${socials.map(soc => `
              <a href="${escapeHtml(soc.url)}" target="_blank" class="social-pill-card" title="${escapeHtml(soc.url)}">
                <span style="font-weight: 700; color: #38bdf8;">${escapeHtml(soc.platform)}</span>
                <span class="chip chip-blue" style="font-size: 9px; padding: 1px 4px;">↗</span>
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 4. Forms Section
    if (forms.length > 0) {
      html += `
        <div class="leads-section">
          <div class="leads-section-header">
            <div class="leads-section-title">
              <span>📋</span>
              <span>Detected Forms & Action Endpoints (${forms.length})</span>
            </div>
          </div>
          <div>
            ${forms.map(frm => `
              <div class="form-item-card">
                <div class="form-meta-row">
                  <strong>${escapeHtml(frm.name)}</strong>
                  <span class="chip ${frm.method === 'POST' ? 'chip-blue' : 'chip-green'}">${frm.method}</span>
                </div>
                <div style="font-size: 11px; font-family: monospace; color: var(--accent-cyan); word-break: break-all; margin-bottom: 6px;">
                  Action: ${escapeHtml(frm.action)}
                </div>
                <div class="form-fields-chips">
                  ${frm.fields.map(f => `
                    <span class="field-chip" title="${escapeHtml(f.type)}: ${escapeHtml(f.placeholder || f.value || '')}">
                      ${escapeHtml(f.name)} (${escapeHtml(f.type)}${f.required ? '*' : ''})
                    </span>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    elements.leadsContainer.innerHTML = html;

    // Wire up lead buttons
    elements.leadsContainer.querySelectorAll('.btn-copy-single-lead').forEach(btn => {
      btn.addEventListener('click', () => {
        copyToClipboard(btn.dataset.val);
        showToast(`Copied: ${btn.dataset.val}`);
      });
    });

    elements.leadsContainer.querySelector('.btn-copy-all-emails-mini')?.addEventListener('click', () => {
      if (emails.length > 0) {
        copyToClipboard(emails.join('\n'));
        showToast(`Copied ${emails.length} emails!`);
      }
    });

    elements.leadsContainer.querySelector('.btn-copy-all-phones-mini')?.addEventListener('click', () => {
      if (phones.length > 0) {
        copyToClipboard(phones.join('\n'));
        showToast(`Copied ${phones.length} phones!`);
      }
    });
  }

  function formatCardText(card) {
    let out = `Title: ${card.title}\n`;
    if (card.image) out += `Image: ${card.image}\n`;
    if (card.price) out += `Price: ${card.price}\n`;
    if (card.badge) out += `Badge: ${card.badge}\n`;
    if (card.description) out += `Description: ${card.description}\n`;
    if (card.link) out += `Link: ${card.link}\n`;
    return out.trim();
  }

  /**
   * =========================================================================
   * RENDER CLOUD TAB
   * =========================================================================
   */
  function renderCloudTab() {
    if (!state.pageData || !state.pageData.cloudLinks) return;

    let items = state.pageData.cloudLinks;

    if (state.cloudProviderFilter !== 'all') {
      items = items.filter(c => c.provider === state.cloudProviderFilter);
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      items = items.filter(c => c.url.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.provider.toLowerCase().includes(q));
    }

    if (items.length === 0) {
      elements.cloudLinksList.innerHTML = `<div class="empty-state"><p>No cloud endpoints found for filter.</p></div>`;
      return;
    }

    elements.cloudLinksList.innerHTML = items.map(c => {
      const badgeClass = getProviderBadgeClass(c.provider);
      return `
        <div class="list-row">
          <div class="list-row-main">
            <div class="list-row-title selectable" title="${escapeHtml(c.url)}">${escapeHtml(c.url)}</div>
            <div class="list-row-subtitle">${escapeHtml(c.category)} &bull; ${escapeHtml(c.context || 'Page Asset')}</div>
          </div>
          <div class="list-row-badges">
            <span class="provider-badge ${badgeClass}">${escapeHtml(c.provider)}</span>
            <button class="copy-mini-btn btn-copy-item" data-val="${escapeHtml(c.url)}">Copy</button>
          </div>
        </div>
      `;
    }).join('');

    elements.cloudLinksList.querySelectorAll('.btn-copy-item').forEach(btn => {
      btn.addEventListener('click', () => {
        copyToClipboard(btn.dataset.val);
        showToast('Cloud link copied!');
      });
    });
  }

  function getProviderBadgeClass(provider) {
    if (provider === 'AWS') return 'provider-aws';
    if (provider === 'Google Cloud') return 'provider-gcp';
    if (provider === 'Microsoft Azure') return 'provider-azure';
    if (provider === 'Cloudflare') return 'provider-cloudflare';
    if (provider === 'GitHub') return 'provider-github';
    return 'badge-accent';
  }

  /**
   * =========================================================================
   * RENDER LINKS TAB
   * =========================================================================
   */
  function renderLinksTab() {
    if (!state.pageData) return;

    let items = [];

    if (state.linksTypeFilter === 'contacts') {
      const contacts = state.pageData.contacts || { emails: [], phones: [], socials: [] };
      items = [
        ...contacts.emails.map(e => ({ url: `mailto:${e}`, text: e, category: 'Email Address' })),
        ...contacts.phones.map(p => ({ url: `tel:${p}`, text: p, category: 'Phone Number' })),
        ...contacts.socials.map(s => ({ url: s.url, text: s.platform, category: `Social (${s.platform})` }))
      ];
    } else {
      items = state.pageData.links || [];
      if (state.linksTypeFilter === 'internal') items = items.filter(l => l.isInternal);
      else if (state.linksTypeFilter === 'external') items = items.filter(l => !l.isInternal);
      else if (state.linksTypeFilter === 'documents') items = items.filter(l => l.isDocument);
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      items = items.filter(l => l.url.toLowerCase().includes(q) || (l.text && l.text.toLowerCase().includes(q)));
    }

    if (items.length === 0) {
      elements.allLinksList.innerHTML = `<div class="empty-state"><p>No links found for current filter.</p></div>`;
      return;
    }

    elements.allLinksList.innerHTML = items.slice(0, 300).map(l => {
      const tag = l.isDocument ? (l.docType || 'FILE') : (l.category || (l.isInternal ? 'Internal' : 'External'));
      return `
        <div class="list-row">
          <div class="list-row-main">
            <div class="list-row-title" title="${escapeHtml(l.text || l.url)}">${escapeHtml(l.text || l.url)}</div>
            <div class="list-row-subtitle" title="${escapeHtml(l.url)}">${escapeHtml(l.url)}</div>
          </div>
          <div class="list-row-badges">
            <span class="provider-badge provider-aws">${escapeHtml(tag)}</span>
            <button class="copy-mini-btn btn-copy-link" data-url="${escapeHtml(l.url)}">Copy</button>
          </div>
        </div>
      `;
    }).join('');

    elements.allLinksList.querySelectorAll('.btn-copy-link').forEach(btn => {
      btn.addEventListener('click', () => {
        copyToClipboard(btn.dataset.url);
        showToast('Link copied!');
      });
    });
  }

  /**
   * =========================================================================
   * SITEMAP EXTRACTION
   * =========================================================================
   */
  async function fetchSitemap() {
    let customUrl = elements.inputCustomSitemap.value.trim();
    if (!customUrl && state.activeUrl && (state.activeUrl.endsWith('.xml') || state.activeUrl.includes('sitemap'))) {
      customUrl = state.activeUrl;
      elements.inputCustomSitemap.value = customUrl;
    }

    // Instant local extraction if already on an XML sitemap page
    if ((!customUrl || customUrl === state.activeUrl) && state.pageData && state.pageData.inPageSitemap && state.pageData.inPageSitemap.count > 0) {
      const inPage = state.pageData.inPageSitemap;
      state.sitemapData = {
        origin: state.domain,
        discoveredSources: [inPage.sourceUrl],
        totalUrls: inPage.count,
        urls: inPage.urls
      };
      elements.sitemapStatusRow.querySelector('.status-indicator').classList.remove('loading');
      elements.btnFetchSitemap.disabled = false;
      elements.badgeSitemap.textContent = inPage.count;
      elements.sitemapStatusText.textContent = `Extracted ${inPage.count} URLs directly from this XML page!`;
      elements.sitemapMetaBar.style.display = 'flex';
      elements.sitemapCount.textContent = `${inPage.count.toLocaleString()} URLs Found`;
      renderSitemapUrls(inPage.urls);
      return;
    }

    const targetUrl = customUrl || state.activeUrl || `https://${state.domain}/`;

    elements.sitemapStatusText.textContent = 'Discovering and extracting sitemaps...';
    elements.sitemapStatusRow.querySelector('.status-indicator').classList.add('loading');
    elements.btnFetchSitemap.disabled = true;

    try {
      chrome.runtime.sendMessage({
        action: 'FETCH_SITEMAP',
        targetUrl: targetUrl,
        customSitemapUrl: customUrl
      }, (res) => {
        elements.sitemapStatusRow.querySelector('.status-indicator').classList.remove('loading');
        elements.btnFetchSitemap.disabled = false;

        if (chrome.runtime.lastError || !res || !res.success) {
          const err = (res && res.error) || (chrome.runtime.lastError && chrome.runtime.lastError.message) || 'Failed to fetch sitemap';
          elements.sitemapStatusText.textContent = `Error: ${err}`;
          elements.sitemapUrlsList.innerHTML = `
            <div class="empty-state">
              <p style="color: var(--accent-rose);">Could not locate XML sitemap automatically.</p>
              <p style="font-size: 11px;">You can paste an exact sitemap URL above (e.g. https://${state.domain}/sitemap.xml) and try again.</p>
            </div>`;
          return;
        }

        state.sitemapData = res;
        elements.badgeSitemap.textContent = res.totalUrls;
        elements.sitemapStatusText.textContent = `Found ${res.totalUrls} URLs across ${res.discoveredSources.length} sitemap(s)!`;
        elements.sitemapMetaBar.style.display = 'flex';
        elements.sitemapCount.textContent = `${res.totalUrls.toLocaleString()} URLs Extracted`;

        renderSitemapUrls(res.urls);
      });
    } catch (e) {
      elements.btnFetchSitemap.disabled = false;
      elements.sitemapStatusText.textContent = `Error: ${e.message}`;
    }
  }

  function renderSitemapUrls(urls) {
    let items = urls || [];
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      items = items.filter(u => u.url.toLowerCase().includes(q));
    }

    if (items.length === 0) {
      elements.sitemapUrlsList.innerHTML = `<div class="empty-state"><p>No URLs matched search.</p></div>`;
      return;
    }

    elements.sitemapUrlsList.innerHTML = items.slice(0, 200).map(u => `
      <div class="list-row">
        <div class="list-row-main">
          <div class="list-row-title selectable">${escapeHtml(u.url)}</div>
          <div class="list-row-subtitle">
            ${u.lastmod ? `Modified: ${escapeHtml(u.lastmod)}` : ''} 
            ${u.priority ? `&bull; Priority: ${escapeHtml(u.priority)}` : ''}
          </div>
        </div>
        <div class="list-row-badges">
          <button class="copy-mini-btn btn-copy-sitemap-url" data-url="${escapeHtml(u.url)}">Copy</button>
        </div>
      </div>
    `).join('');

    elements.sitemapUrlsList.querySelectorAll('.btn-copy-sitemap-url').forEach(btn => {
      btn.addEventListener('click', () => {
        copyToClipboard(btn.dataset.url);
        showToast('Sitemap URL copied!');
      });
    });
  }

  /**
   * =========================================================================
   * SITE SPIDER CRAWLER
   * =========================================================================
   */
  async function startSiteCrawl() {
    const maxPages = parseInt(elements.selectMaxPages.value, 10) || 25;
    elements.btnStartCrawl.style.display = 'none';
    elements.btnStopCrawl.style.display = 'inline-flex';
    elements.crawlProgressContainer.style.display = 'flex';
    elements.crawlProgressFill.style.width = '5%';
    elements.crawlProgressText.textContent = `Starting spider on ${state.domain}...`;

    chrome.runtime.sendMessage({
      action: 'START_CRAWL',
      startUrl: state.activeUrl,
      maxPages: maxPages
    }, (res) => {
      elements.btnStartCrawl.style.display = 'inline-flex';
      elements.btnStopCrawl.style.display = 'none';

      if (res && res.success) {
        state.crawlData = res;
        elements.crawlProgressFill.style.width = '100%';
        elements.crawlProgressText.textContent = `Crawl complete! Visited ${res.pagesCrawled} pages.`;
        renderCrawlResults(res);
      }
    });
  }

  function renderCrawlResults(data) {
    elements.crawlerResultsArea.innerHTML = `
      <div class="section-card">
        <div class="card-header">
          <h3>Crawl Summary</h3>
          <span class="chip chip-blue">${data.pagesCrawled} Pages Spidered</span>
        </div>
        <div class="metrics-grid">
          <div class="metric-box">
            <div class="metric-num">${data.images.length}</div>
            <div class="metric-label">Total Images</div>
          </div>
          <div class="metric-box">
            <div class="metric-num">${data.cloudLinks.length}</div>
            <div class="metric-label">Cloud Links</div>
          </div>
          <div class="metric-box">
            <div class="metric-num">${data.links.length}</div>
            <div class="metric-label">All Links</div>
          </div>
          <div class="metric-box">
            <div class="metric-num">${data.emails.length}</div>
            <div class="metric-label">Emails</div>
          </div>
        </div>
        <div style="margin-top: 12px; display: flex; gap: 8px;">
          <button id="btnExportCrawlJson" class="btn-sm btn-primary">Export Crawled Data (JSON)</button>
          <button id="btnOpenCrawlInViewer" class="btn-sm btn-secondary">Open Full Tree</button>
        </div>
      </div>
    `;

    document.getElementById('btnExportCrawlJson')?.addEventListener('click', () => {
      downloadFile(JSON.stringify(data, null, 2), `${state.domain}-crawl-data.json`, 'application/json');
    });

    document.getElementById('btnOpenCrawlInViewer')?.addEventListener('click', () => {
      openInViewer(data);
    });
  }

  // Real-time synchronization & message listeners
  let liveUpdateDebounceTimer = null;
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'CRAWL_PROGRESS') {
      const pct = Math.round((msg.pagesCrawled / msg.maxPages) * 100);
      elements.crawlProgressFill.style.width = `${pct}%`;
      elements.crawlProgressText.textContent = `Crawled ${msg.pagesCrawled}/${msg.maxPages} pages (${msg.totalImages} images, ${msg.totalCloud} cloud links)`;
    } else if (msg.action === 'DYNAMIC_DOM_UPDATE') {
      // 1. Immediately update header badge numbers & stats
      if (msg.stats) {
        if (elements.badgeImages) elements.badgeImages.textContent = msg.stats.images;
        if (elements.badgeMedia) elements.badgeMedia.textContent = msg.stats.media;
        if (elements.badgeCards) elements.badgeCards.textContent = msg.stats.cards || 0;
        if (elements.badgeCloud) elements.badgeCloud.textContent = msg.stats.cloud;
        if (elements.badgeLinks) elements.badgeLinks.textContent = msg.stats.links;
        if (elements.statImages) elements.statImages.textContent = msg.stats.images;
        if (elements.statCards) elements.statCards.textContent = msg.stats.cards || 0;
        if (elements.statMedia) elements.statMedia.textContent = msg.stats.media;
        if (elements.statCloud) elements.statCloud.textContent = msg.stats.cloud;
      }

      // 2. Debounced background payload fetch to smoothly merge new items without scroll flicker
      clearTimeout(liveUpdateDebounceTimer);
      liveUpdateDebounceTimer = setTimeout(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          if (!tab || !tab.id) return;
          chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_PAGE_DATA' }, (res) => {
            if (chrome.runtime.lastError || !res || !res.success) return;
            state.pageData = res.data;
            
            // Preserve user scroll position inside active container
            let container = null;
            if (state.currentTab === 'tab-images') container = elements.imagesGalleryContainer;
            else if (state.currentTab === 'tab-cards') container = elements.cardsViewContainer;
            else if (state.currentTab === 'tab-media') container = elements.mediaListContainer;

            const prevScroll = container ? container.scrollTop : 0;
            refreshActiveTab();
            if (container) container.scrollTop = prevScroll;
          });
        });
      }, 400);
    } else if (msg.action === 'AUTO_SCROLL_COMPLETE') {
      updateAutoScrollUI(false);
      showToast('🎉 Auto-Scroll complete! All items captured.');
    }
  });

  /**
   * Auto-Scroll Harvester controls
   */
  function checkAutoScrollStatus() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab || !tab.id) return;
      chrome.tabs.sendMessage(tab.id, { action: 'GET_AUTO_SCROLL_STATUS' }, (res) => {
        if (chrome.runtime.lastError) return;
        if (res && res.isActive) {
          updateAutoScrollUI(true);
        }
      });
    });
  }

  function toggleAutoScroll() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab || !tab.id) return;
      const nextAction = state.isAutoScrolling ? 'STOP_AUTO_SCROLL' : 'START_AUTO_SCROLL';
      chrome.tabs.sendMessage(tab.id, { action: nextAction, maxScrolls: 50 }, (res) => {
        if (chrome.runtime.lastError) {
          showToast('Cannot auto-scroll on this page');
          return;
        }
        if (res && res.success) {
          state.isAutoScrolling = res.isScrolling;
          updateAutoScrollUI(state.isAutoScrolling);
          showToast(state.isAutoScrolling ? '⚡ Auto-Scroll Harvesting Active!' : '⏹ Auto-Scroll Stopped');
        }
      });
    });
  }

  function updateAutoScrollUI(active) {
    state.isAutoScrolling = active;
    [elements.btnAutoScroll, elements.btnAutoScrollMedia, elements.btnAutoScrollCards].forEach(btn => {
      if (!btn) return;
      if (active) {
        btn.innerHTML = '⏹ Stop Scroll';
        btn.classList.add('btn-scrolling-active');
      } else {
        btn.innerHTML = '⚡ Auto-Scroll';
        btn.classList.remove('btn-scrolling-active');
      }
    });
  }

  /**
   * =========================================================================
   * LIGHTBOX MODAL SETUP
   * =========================================================================
   */
  function setupLightbox() {
    const close = () => elements.imageLightboxModal.classList.remove('show');
    elements.lightboxCloseBtn.addEventListener('click', close);
    elements.lightboxBackdrop.addEventListener('click', close);

    elements.lightboxCopyBtn.addEventListener('click', () => {
      copyToClipboard(elements.lightboxUrl.textContent);
      showToast('Image URL copied!');
    });

    elements.lightboxDownloadBtn.addEventListener('click', () => {
      downloadUrl(elements.lightboxUrl.textContent);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elements.imageLightboxModal.classList.contains('show')) {
        close();
      }
    });
  }

  function openLightbox(url, dims) {
    elements.lightboxImg.src = url;
    elements.lightboxDims.textContent = dims || 'Full Resolution';
    elements.lightboxUrl.textContent = url;
    elements.imageLightboxModal.classList.add('show');
  }

  /**
   * =========================================================================
   * EVENT LISTENERS SETUP
   * =========================================================================
   */
  function setupEventListeners() {
    // Refresh
    elements.btnRefresh.addEventListener('click', () => {
      elements.btnRefresh.classList.add('spinning');
      setTimeout(() => elements.btnRefresh.classList.remove('spinning'), 700);
      loadActiveTabData();
      showToast('Refreshing extracted data...');
    });

    // Domain copy
    if (elements.currentDomain) {
      elements.currentDomain.style.cursor = 'pointer';
      elements.currentDomain.title = 'Click to copy active URL';
      elements.currentDomain.addEventListener('click', () => {
        if (state.pageData && state.pageData.url) {
          navigator.clipboard.writeText(state.pageData.url).then(() => {
            showToast(`Copied URL: ${state.pageData.url}`);
          });
        }
      });
    }

    // Quick Actions
    elements.btnQuickPick?.addEventListener('click', () => {
      elements.btnPickContainer?.click();
    });

    elements.btnQuickAutoScroll?.addEventListener('click', () => {
      const imgTab = document.querySelector('.tab-btn[data-tab="tab-images"]');
      if (imgTab) imgTab.click();
      setTimeout(toggleAutoScroll, 200);
    });

    elements.btnQuickCopyAi?.addEventListener('click', () => {
      elements.btnCopyMarkdownAi?.click();
    });

    elements.btnQuickViewer?.addEventListener('click', () => {
      elements.btnOpenViewer?.click();
    });

    // Open Viewer
    elements.btnOpenViewer.addEventListener('click', () => openInViewer(state.pageData));

    // Search input
    elements.globalSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      elements.btnClearSearch.classList.toggle('show', state.searchQuery.length > 0);
      refreshActiveTab();
    });

    elements.btnClearSearch.addEventListener('click', () => {
      elements.globalSearchInput.value = '';
      state.searchQuery = '';
      elements.btnClearSearch.classList.remove('show');
      refreshActiveTab();
    });

    // View switcher (Grid vs List)
    elements.btnViewGrid.addEventListener('click', () => {
      elements.btnViewGrid.classList.add('active');
      elements.btnViewList.classList.remove('active');
      state.viewMode = 'grid';
      renderImagesTab();
    });

    elements.btnViewList.addEventListener('click', () => {
      elements.btnViewList.classList.add('active');
      elements.btnViewGrid.classList.remove('active');
      state.viewMode = 'list';
      renderImagesTab();
    });

    // Image format filter pills
    elements.imageFormatFilters.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        elements.imageFormatFilters.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.imageFormatFilter = pill.dataset.format;
        renderImagesTab();
      });
    });

    // Media kind filter pills
    elements.mediaKindFilters.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        elements.mediaKindFilters.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.mediaKindFilter = pill.dataset.kind;
        renderMediaTab();
      });
    });

    // Cloud provider filter pills
    elements.cloudProviderFilters.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        elements.cloudProviderFilters.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.cloudProviderFilter = pill.dataset.provider;
        renderCloudTab();
      });
    });

    // Links type filter pills
    elements.linksTypeFilters.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        elements.linksTypeFilters.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.linksTypeFilter = pill.dataset.type;
        renderLinksTab();
      });
    });

    // Sitemap fetch
    elements.btnFetchSitemap.addEventListener('click', fetchSitemap);
    elements.inputCustomSitemap?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        fetchSitemap();
      }
    });

    elements.btnExportSitemapTxt.addEventListener('click', () => {
      if (!state.sitemapData || !state.sitemapData.urls) return;
      const text = state.sitemapData.urls.map(u => u.url).join('\n');
      downloadFile(text, `${state.domain}-sitemap-urls.txt`, 'text/plain');
    });

    elements.btnExportSitemapCsv.addEventListener('click', () => {
      if (!state.sitemapData || !state.sitemapData.urls) return;
      let csv = 'URL,Last Modified,Change Frequency,Priority\n';
      state.sitemapData.urls.forEach(u => {
        csv += `"${u.url}","${u.lastmod || ''}","${u.changefreq || ''}","${u.priority || ''}"\n`;
      });
      downloadFile(csv, `${state.domain}-sitemap.csv`, 'text/csv');
    });

    // Crawler
    elements.btnStartCrawl.addEventListener('click', startSiteCrawl);
    elements.btnStopCrawl.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'STOP_CRAWL' }, () => {
        elements.btnStartCrawl.style.display = 'inline-flex';
        elements.btnStopCrawl.style.display = 'none';
        showToast('Crawling stopped.');
      });
    });

    // Export dropdown
    elements.btnExport.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.exportMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => elements.exportMenu.classList.remove('show'));

    document.getElementById('exportJson').addEventListener('click', () => exportActiveTab('json'));
    document.getElementById('exportCsv').addEventListener('click', () => exportActiveTab('csv'));
    document.getElementById('exportTxt').addEventListener('click', () => exportActiveTab('txt'));
    document.getElementById('exportAllJson').addEventListener('click', () => {
      if (!state.pageData) return;
      downloadFile(JSON.stringify(state.pageData, null, 2), `${state.domain}-omniextract-full.json`, 'application/json');
    });

    // Copy All Visible Button
    elements.btnCopyAll.addEventListener('click', copyAllVisible);

    // Auto-Scroll Harvesting
    elements.btnAutoScroll?.addEventListener('click', toggleAutoScroll);
    elements.btnAutoScrollMedia?.addEventListener('click', toggleAutoScroll);
    elements.btnAutoScrollCards?.addEventListener('click', toggleAutoScroll);

    // Interactive Element & Card Picker from Page
    elements.btnPickContainer?.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (!tab || !tab.id) return;
        chrome.tabs.sendMessage(tab.id, { action: 'START_PICKER' }, (res) => {
          if (chrome.runtime.lastError || !res || !res.success) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['scripts/content.js']
            }, () => {
              chrome.tabs.sendMessage(tab.id, { action: 'START_PICKER' });
              window.close();
            });
          } else {
            window.close();
          }
        });
      });
    });

    // Cards View Filters (Cards vs JSON)
    elements.cardViewFilters?.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        elements.cardViewFilters.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.cardViewMode = pill.dataset.cardview || 'cards';
        renderCardsTab();
      });
    });

    // Copy All Cards Buttons
    elements.btnCopyAllCardsJson?.addEventListener('click', () => {
      if (!state.pageData || !state.pageData.cards) return;
      const json = JSON.stringify(state.pageData.cards, null, 2);
      copyToClipboard(json);
      showToast(`Copied ${state.pageData.cards.length} cards as JSON array!`);
    });

    elements.btnCopyRawCardsJson?.addEventListener('click', () => {
      if (!state.pageData || !state.pageData.cards) return;
      const json = JSON.stringify(state.pageData.cards, null, 2);
      copyToClipboard(json);
      showToast(`Copied ${state.pageData.cards.length} cards as JSON array!`);
    });

    elements.btnCopyAllCardsText?.addEventListener('click', () => {
      if (!state.pageData || !state.pageData.cards || state.pageData.cards.length === 0) return;
      const text = state.pageData.cards.map(formatCardText).join('\n\n----------------------------------------\n\n');
      copyToClipboard(text);
      showToast(`Copied ${state.pageData.cards.length} cards formatted as text!`);
    });


    // AI Clean Markdown Export
    elements.btnCopyMarkdownAi?.addEventListener('click', () => {
      if (!state.pageData) return;
      const md = state.pageData.cleanMarkdown || `# ${document.title}\n\n${state.activeUrl}`;
      copyToClipboard(md);
      showToast('📋 Copied Clean Markdown ready for AI / LLMs!');
      const origHtml = elements.btnCopyMarkdownAi.innerHTML;
      elements.btnCopyMarkdownAi.innerHTML = '✓ Copied for AI!';
      setTimeout(() => {
        elements.btnCopyMarkdownAi.innerHTML = origHtml;
      }, 2000);
    });

    elements.btnDownloadMarkdownAi?.addEventListener('click', () => {
      if (!state.pageData) return;
      const md = state.pageData.cleanMarkdown || `# ${document.title}\n\n${state.activeUrl}`;
      downloadFile(md, `${state.domain}-article.md`, 'text/markdown');
    });

    // Tables Tab Top Actions
    elements.btnCopyAllTablesMd?.addEventListener('click', () => {
      const tables = (state.pageData && state.pageData.tables) || [];
      if (tables.length === 0) return;
      const allMd = tables.map(t => `### ${t.title}\n\n${t.markdown}`).join('\n\n---\n\n');
      copyToClipboard(allMd);
      showToast(`Copied ${tables.length} tables as Markdown!`);
    });

    elements.btnExportAllTablesCsv?.addEventListener('click', () => {
      const tables = (state.pageData && state.pageData.tables) || [];
      if (tables.length === 0) return;
      const first = tables[0];
      downloadFile(first.csv, `${state.domain}-table-1.csv`, 'text/csv');
    });

    // Leads Tab Top Actions
    elements.btnCopyAllEmails?.addEventListener('click', () => {
      const emails = (state.pageData && state.pageData.contacts && state.pageData.contacts.emails) || [];
      if (emails.length === 0) return;
      copyToClipboard(emails.join('\n'));
      showToast(`Copied ${emails.length} email addresses!`);
    });

    elements.btnCopyAllPhones?.addEventListener('click', () => {
      const phones = (state.pageData && state.pageData.contacts && state.pageData.contacts.phones) || [];
      if (phones.length === 0) return;
      copyToClipboard(phones.join('\n'));
      showToast(`Copied ${phones.length} phone numbers!`);
    });

    elements.btnExportLeadsCsv?.addEventListener('click', () => {
      if (!state.pageData || !state.pageData.contacts) return;
      const contacts = state.pageData.contacts;
      let csv = 'Type,Value,Platform/Notes\n';
      (contacts.emails || []).forEach(e => { csv += `"Email","${e}",""\n`; });
      (contacts.phones || []).forEach(p => { csv += `"Phone","${p}",""\n`; });
      (contacts.socials || []).forEach(s => { csv += `"Social","${s.url}","${s.platform}"\n`; });
      (state.pageData.forms || []).forEach(f => { csv += `"Form","${f.action}","Method: ${f.method}, Fields: ${f.fieldCount}"\n`; });
      downloadFile(csv, `${state.domain}-leads.csv`, 'text/csv');
    });

    // Select All Images
    elements.btnSelectAllImages?.addEventListener('click', () => {
      let items = state.pageData?.images || [];
      if (state.imageFormatFilter !== 'all') {
        if (state.imageFormatFilter === 'highres') {
          items = items.filter(img => (img.width >= 1000 || img.height >= 800));
        } else if (state.imageFormatFilter === 'icons') {
          items = items.filter(img => (img.width > 0 && img.width <= 120 && img.height <= 120));
        } else {
          items = items.filter(img => img.format === state.imageFormatFilter);
        }
      }
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        items = items.filter(img => img.url.toLowerCase().includes(q) || (img.alt && img.alt.toLowerCase().includes(q)));
      }

      items.forEach(img => state.selectedImageUrls.add(img.url));
      renderImagesTab();
      showToast(`Selected ${items.length} images`);
    });

    // Clear Selection
    elements.btnDeselectAllImages?.addEventListener('click', () => {
      state.selectedImageUrls.clear();
      renderImagesTab();
      showToast('Cleared image selection');
    });

    // Copy Selected URLs
    elements.btnCopySelectedImageUrls?.addEventListener('click', () => {
      if (state.selectedImageUrls.size === 0) return;
      const urls = Array.from(state.selectedImageUrls);
      copyToClipboard(urls.join('\n'));
      showToast(`Copied ${urls.length} selected URLs!`);
    });

    // Download Selected (or All) Images
    elements.btnDownloadSelectedImages?.addEventListener('click', () => {
      if (!state.pageData || !state.pageData.images) return;

      if (state.selectedImageUrls.size > 0) {
        const selected = Array.from(state.selectedImageUrls);
        showToast(`Downloading ${selected.length} selected images...`);
        selected.forEach((url, idx) => {
          setTimeout(() => downloadUrl(url), idx * 250);
        });
      } else {
        // Download all images up to 40
        const imgs = state.pageData.images.slice(0, 40);
        showToast(`Downloading all ${imgs.length} images...`);
        imgs.forEach((img, idx) => {
          setTimeout(() => downloadUrl(img.url), idx * 250);
        });
      }
    });

    // Batch download media
    elements.btnDownloadAllMedia.addEventListener('click', () => {
      if (!state.pageData || !state.pageData.media) return;
      const meds = state.pageData.media.filter(m => m.kind !== 'embed').slice(0, 20);
      meds.forEach((m, idx) => {
        setTimeout(() => downloadUrl(m.url), idx * 300);
      });
      showToast(`Downloading ${meds.length} media files...`);
    });
  }

  function setupTabNavigation() {
    const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        state.currentTab = btn.dataset.tab;
        const targetPane = document.getElementById(state.currentTab);
        if (targetPane) targetPane.classList.add('active');

        // Show/hide view toggle for Images
        elements.viewToggleWrapper.style.display = (state.currentTab === 'tab-images') ? 'flex' : 'none';

        refreshActiveTab();
      });
    });

    // Keyboard Shortcuts: Alt+1..9,0 or ArrowLeft / ArrowRight
    document.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

      const tabOrder = [
        'tab-overview', 'tab-images', 'tab-media', 'tab-cards', 'tab-tables',
        'tab-leads', 'tab-cloud', 'tab-links', 'tab-sitemap', 'tab-crawler'
      ];

      if (e.altKey && e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        const num = parseInt(e.key);
        const targetId = num === 0 ? tabOrder[9] : tabOrder[num - 1];
        const targetBtn = document.querySelector(`.tab-btn[data-tab="${targetId}"]`);
        if (targetBtn) targetBtn.click();
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const activeIdx = tabOrder.indexOf(state.currentTab);
        if (activeIdx !== -1) {
          let nextIdx = e.key === 'ArrowRight' ? activeIdx + 1 : activeIdx - 1;
          if (nextIdx >= tabOrder.length) nextIdx = 0;
          if (nextIdx < 0) nextIdx = tabOrder.length - 1;
          const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabOrder[nextIdx]}"]`);
          if (targetBtn) targetBtn.click();
        }
      }
    });
  }

  function refreshActiveTab() {
    if (state.currentTab === 'tab-images') renderImagesTab();
    else if (state.currentTab === 'tab-media') renderMediaTab();
    else if (state.currentTab === 'tab-cards') renderCardsTab();
    else if (state.currentTab === 'tab-tables') renderTablesTab();
    else if (state.currentTab === 'tab-leads') renderLeadsTab();
    else if (state.currentTab === 'tab-cloud') renderCloudTab();
    else if (state.currentTab === 'tab-links') renderLinksTab();
    else if (state.currentTab === 'tab-sitemap' && state.sitemapData) renderSitemapUrls(state.sitemapData.urls);
  }

  function exportActiveTab(format) {
    if (!state.pageData) return;
    let dataToExport = [];
    let filename = `${state.domain}-${state.currentTab}`;

    if (state.currentTab === 'tab-images') dataToExport = state.pageData.images;
    else if (state.currentTab === 'tab-media') dataToExport = state.pageData.media;
    else if (state.currentTab === 'tab-cards') dataToExport = state.pageData.cards;
    else if (state.currentTab === 'tab-tables') dataToExport = state.pageData.tables;
    else if (state.currentTab === 'tab-leads') dataToExport = state.pageData.contacts;
    else if (state.currentTab === 'tab-cloud') dataToExport = state.pageData.cloudLinks;
    else if (state.currentTab === 'tab-links') dataToExport = state.pageData.links;
    else if (state.currentTab === 'tab-sitemap' && state.sitemapData) dataToExport = state.sitemapData.urls;
    else dataToExport = state.pageData;

    if (format === 'json') {
      downloadFile(JSON.stringify(dataToExport, null, 2), `${filename}.json`, 'application/json');
    } else if (format === 'csv') {
      let csv = '';
      if (Array.isArray(dataToExport) && dataToExport.length > 0) {
        const headers = Object.keys(dataToExport[0]).filter(k => typeof dataToExport[0][k] !== 'object');
        csv += headers.join(',') + '\n';
        dataToExport.forEach(item => {
          csv += headers.map(h => `"${(item[h] || '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
        });
      }
      downloadFile(csv, `${filename}.csv`, 'text/csv');
    } else if (format === 'txt') {
      let txt = '';
      if (Array.isArray(dataToExport)) {
        if (state.currentTab === 'tab-cards') {
          txt = dataToExport.map(formatCardText).join('\n\n-------------------------\n\n');
        } else {
          txt = dataToExport.map(item => item.url || item.link || '').filter(Boolean).join('\n');
        }
      }
      downloadFile(txt, `${filename}.txt`, 'text/plain');
    }
  }

  function copyAllVisible() {
    let urls = [];
    if (state.currentTab === 'tab-images') {
      urls = Array.from(elements.imagesGallery.querySelectorAll('[data-url]')).map(c => c.dataset.url);
    } else if (state.currentTab === 'tab-media') {
      urls = Array.from(elements.mediaListContainer.querySelectorAll('.media-card')).map(c => c.dataset.url);
    } else if (state.currentTab === 'tab-cards') {
      if (state.pageData && state.pageData.cards && state.pageData.cards.length > 0) {
        const text = state.pageData.cards.map(formatCardText).join('\n\n----------------------------------------\n\n');
        copyToClipboard(text);
        showToast(`Copied ${state.pageData.cards.length} cards with full details!`);
        return;
      }
    } else if (state.currentTab === 'tab-cloud') {
      urls = Array.from(elements.cloudLinksList.querySelectorAll('.btn-copy-item')).map(b => b.dataset.val);
    } else if (state.currentTab === 'tab-links') {
      urls = Array.from(elements.allLinksList.querySelectorAll('.btn-copy-link')).map(b => b.dataset.url);
    } else if (state.currentTab === 'tab-sitemap') {
      urls = Array.from(elements.sitemapUrlsList.querySelectorAll('.btn-copy-sitemap-url')).map(b => b.dataset.url);
    } else {
      urls = [state.activeUrl];
    }

    if (urls.length > 0) {
      copyToClipboard(Array.from(new Set(urls)).join('\n'));
      showToast(`Copied ${urls.length} URLs!`);
    } else {
      showToast('No items to copy');
    }
  }

  function copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!'));
  }

  function downloadUrl(url) {
    if (!url) return;
    chrome.runtime.sendMessage({ action: 'DOWNLOAD_FILE', url: url }, (res) => {
      if (res && res.success) showToast('Download started');
    });
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({ url: url, filename: filename, saveAs: true }, () => {
      URL.revokeObjectURL(url);
      showToast(`Exported ${filename}`);
    });
  }

  function openInViewer(data) {
    chrome.runtime.sendMessage({ action: 'OPEN_VIEWER', data: data || state.pageData });
  }

  function showToast(msg) {
    elements.toast.textContent = msg;
    elements.toast.classList.add('show');
    setTimeout(() => elements.toast.classList.remove('show'), 2200);
  }

  function getUrlFilename(url) {
    try {
      const pathname = new URL(url).pathname;
      const fn = pathname.substring(pathname.lastIndexOf('/') + 1);
      return fn ? decodeURIComponent(fn) : url;
    } catch (e) {
      return url;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
