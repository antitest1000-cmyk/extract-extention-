/**
 * OmniExtract Pro - Viewer Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    data: null,
    activeView: 'view-overview',
    searchQuery: '',
    imageFormatFilter: 'all',
    sitemapUrls: []
  };

  const elements = {
    // Navigation
    navItems: document.querySelectorAll('.nav-item'),
    viewSections: document.querySelectorAll('.view-section'),
    targetSiteUrl: document.getElementById('targetSiteUrl'),
    viewerSearchInput: document.getElementById('viewerSearchInput'),

    // Top buttons
    btnViewerExportJson: document.getElementById('btnViewerExportJson'),
    btnViewerExportCsv: document.getElementById('btnViewerExportCsv'),
    btnViewerCopyUrls: document.getElementById('btnViewerCopyUrls'),

    // Sidebar counts
    sideCountImages: document.getElementById('sideCountImages'),
    sideCountMedia: document.getElementById('sideCountMedia'),
    sideCountCards: document.getElementById('sideCountCards'),
    sideCountTables: document.getElementById('sideCountTables'),
    sideCountLeads: document.getElementById('sideCountLeads'),
    viewerTablesCount: document.getElementById('viewerTablesCount'),
    viewerTablesContainer: document.getElementById('viewerTablesContainer'),
    viewerLeadsCount: document.getElementById('viewerLeadsCount'),
    viewerLeadsContainer: document.getElementById('viewerLeadsContainer'),
    btnCopyAllViewerTablesMd: document.getElementById('btnCopyAllViewerTablesMd'),
    btnDownloadAllViewerTablesCsv: document.getElementById('btnDownloadAllViewerTablesCsv'),
    btnCopyAllViewerEmails: document.getElementById('btnCopyAllViewerEmails'),
    btnCopyAllViewerPhones: document.getElementById('btnCopyAllViewerPhones'),
    btnDownloadLeadsCsv: document.getElementById('btnDownloadLeadsCsv'),
    sideCountCloud: document.getElementById('sideCountCloud'),
    sideCountSitemap: document.getElementById('sideCountSitemap'),
    sideCountLinks: document.getElementById('sideCountLinks'),

    // Cards View
    viewerCardsCountText: document.getElementById('viewerCardsCountText'),
    btnCopyAllViewerCardsJson: document.getElementById('btnCopyAllViewerCardsJson'),
    btnDownloadCardsCsv: document.getElementById('btnDownloadCardsCsv'),
    viewerCardsGrid: document.getElementById('viewerCardsGrid'),

    // Overview View
    dashPageTitle: document.getElementById('dashPageTitle'),
    dashPageUrl: document.getElementById('dashPageUrl'),
    statImageCount: document.getElementById('statImageCount'),
    statCloudCount: document.getElementById('statCloudCount'),
    statLinksCount: document.getElementById('statLinksCount'),
    statSitemapCount: document.getElementById('statSitemapCount'),
    seoMetadataTable: document.getElementById('seoMetadataTable'),
    cloudSummaryList: document.getElementById('cloudSummaryList'),

    // Images View
    viewerImageFilter: document.getElementById('viewerImageFilter'),
    btnDownloadAllImages: document.getElementById('btnDownloadAllImages'),
    fullImageGrid: document.getElementById('fullImageGrid'),

    // Media View
    viewerMediaFilter: document.getElementById('viewerMediaFilter'),
    btnViewerDownloadAllMedia: document.getElementById('btnViewerDownloadAllMedia'),
    viewerMediaTableBody: document.getElementById('viewerMediaTableBody'),

    // Cloud View
    cloudTableBody: document.getElementById('cloudTableBody'),

    // Sitemap View
    viewerSitemapInput: document.getElementById('viewerSitemapInput'),
    btnViewerFetchSitemap: document.getElementById('btnViewerFetchSitemap'),
    sitemapTableBody: document.getElementById('sitemapTableBody'),

    // Links View
    linksTableBody: document.getElementById('linksTableBody'),

    // JSON View
    jsonCodeBox: document.getElementById('jsonCodeBox'),
    btnCopyJsonRaw: document.getElementById('btnCopyJsonRaw'),

    toast: document.getElementById('viewerToast')
  };

  init();

  function init() {
    setupNavigation();
    setupEventListeners();
    loadStoredData();
  }

  /**
   * Load data from chrome.storage.local
   */
  function loadStoredData() {
    chrome.storage.local.get(['omniExtractActiveData'], (res) => {
      if (res && res.omniExtractActiveData) {
        state.data = res.omniExtractActiveData;
        populateDashboard(state.data);
      } else {
        elements.dashPageTitle.textContent = 'No Data Extracted Yet';
        elements.dashPageUrl.textContent = 'Open OmniExtract popup on any webpage and click "Open Full Dashboard".';
      }
    });
  }

  function populateDashboard(data) {
    elements.targetSiteUrl.textContent = data.domain || data.url || 'Active Page';
    elements.dashPageTitle.textContent = (data.metadata && data.metadata.title) || data.title || 'Extracted Website';
    elements.dashPageUrl.textContent = data.url || '—';

    // Counts
    const imgCount = (data.images && data.images.length) || 0;
    const mediaCount = (data.media && data.media.length) || 0;
    const cardCount = (data.cards && data.cards.length) || 0;
    const cloudCount = (data.cloudLinks && data.cloudLinks.length) || 0;
    const linksCount = (data.links && data.links.length) || 0;

    const tableCount = (data.tables && data.tables.length) || 0;
    const emailCount = (data.contacts && data.contacts.emails && data.contacts.emails.length) || 0;
    const phoneCount = (data.contacts && data.contacts.phones && data.contacts.phones.length) || 0;
    const socialCount = (data.contacts && data.contacts.socials && data.contacts.socials.length) || 0;
    const leadsTotal = emailCount + phoneCount + socialCount;

    elements.sideCountImages.textContent = imgCount;
    elements.sideCountMedia.textContent = mediaCount;
    if (elements.sideCountCards) elements.sideCountCards.textContent = cardCount;
    if (elements.sideCountTables) elements.sideCountTables.textContent = tableCount;
    if (elements.sideCountLeads) elements.sideCountLeads.textContent = leadsTotal;
    elements.sideCountCloud.textContent = cloudCount;
    elements.sideCountLinks.textContent = linksCount;

    if (elements.viewerCardsCountText) elements.viewerCardsCountText.textContent = `${cardCount} structured components detected`;

    elements.statImageCount.textContent = imgCount;
    elements.statCloudCount.textContent = cloudCount;
    elements.statLinksCount.textContent = linksCount;

    // Overview Metadata
    renderOverviewMetadata(data);
    renderCloudSummary(data);

    // Other Tabs
    renderImagesGrid();
    renderMediaTable();
    renderCardsView();
    renderTablesViewer();
    renderLeadsViewer();
    renderCloudTable();
    renderLinksTable();
    renderJsonTree();

    // Default sitemap input
    if (data.origin) {
      elements.viewerSitemapInput.value = `${data.origin}/sitemap.xml`;
    }
  }

  function renderOverviewMetadata(data) {
    const meta = data.metadata || {};
    const rows = [
      { key: 'Page Title', val: meta.title || data.title || '—' },
      { key: 'Meta Description', val: meta.description || data.description || '—' },
      { key: 'Canonical URL', val: meta.canonical || data.url || '—' },
      { key: 'Language / Charset', val: `${meta.language || 'en'} / ${meta.charset || 'UTF-8'}` },
      { key: 'Word Count', val: (data.stats && data.stats.wordCount) || '—' },
      { key: 'Estimated Reading Time', val: (data.stats && data.stats.readingTime) || '—' }
    ];

    elements.seoMetadataTable.innerHTML = rows.map(r => `
      <div class="kv-row">
        <span class="kv-key">${escapeHtml(r.key)}</span>
        <span class="kv-val">${escapeHtml(r.val)}</span>
      </div>
    `).join('');
  }

  function renderCloudSummary(data) {
    const clouds = data.cloudLinks || [];
    if (clouds.length === 0) {
      elements.cloudSummaryList.innerHTML = `<div class="empty-state">No cloud infrastructure endpoints detected.</div>`;
      return;
    }

    // Group by provider
    const counts = {};
    clouds.forEach(c => {
      counts[c.provider] = (counts[c.provider] || 0) + 1;
    });

    elements.cloudSummaryList.innerHTML = Object.entries(counts).map(([provider, count]) => `
      <div class="kv-row">
        <span class="kv-key">${escapeHtml(provider)}</span>
        <span class="kv-val" style="color: var(--accent-cyan); font-weight: 700;">${count} resources</span>
      </div>
    `).join('');
  }

  /**
   * Images Grid
   */
  function renderImagesGrid() {
    if (!state.data || !state.data.images) return;
    let items = state.data.images;

    if (state.imageFormatFilter !== 'all') {
      items = items.filter(img => img.format === state.imageFormatFilter);
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      items = items.filter(img => img.url.toLowerCase().includes(q));
    }

    if (items.length === 0) {
      elements.fullImageGrid.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-dim);">No images matched filter.</div>`;
      return;
    }

    elements.fullImageGrid.innerHTML = items.map(img => `
      <div class="viewer-img-card">
        <div class="viewer-thumb-box">
          <img src="${escapeHtml(img.url)}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%2250%%22 x=%2250%%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2212%22>Broken</text></svg>'">
        </div>
        <div class="viewer-img-info">
          <div class="viewer-img-url" title="${escapeHtml(img.url)}">${escapeHtml(img.url)}</div>
          <div class="viewer-img-actions">
            <a href="${escapeHtml(img.url)}" target="_blank" rel="noopener">Preview</a>
            <button class="btn-copy-url" data-url="${escapeHtml(img.url)}">Copy Link</button>
            <button class="btn-dl-img" data-url="${escapeHtml(img.url)}">Download</button>
          </div>
        </div>
      </div>
    `).join('');

    elements.fullImageGrid.querySelectorAll('.btn-copy-url').forEach(b => {
      b.addEventListener('click', () => copyToClipboard(b.dataset.url));
    });
    elements.fullImageGrid.querySelectorAll('.btn-dl-img').forEach(b => {
      b.addEventListener('click', () => downloadUrl(b.dataset.url));
    });
  }

  /**
   * Media (Video & Audio) Table
   */
  function renderMediaTable() {
    if (!state.data || !state.data.media) return;
    let items = state.data.media;

    if (elements.viewerMediaFilter && elements.viewerMediaFilter.value !== 'all') {
      items = items.filter(m => m.kind === elements.viewerMediaFilter.value);
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      items = items.filter(m => m.url.toLowerCase().includes(q) || (m.title && m.title.toLowerCase().includes(q)));
    }

    if (items.length === 0) {
      elements.viewerMediaTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--text-dim);">No video or audio assets found.</td></tr>`;
      return;
    }

    elements.viewerMediaTableBody.innerHTML = items.map(m => `
      <tr>
        <td><strong>${escapeHtml(m.kind.toUpperCase())} (${escapeHtml(m.format)})</strong></td>
        <td>${escapeHtml(m.title || 'Media File')}</td>
        <td class="url-cell" title="${escapeHtml(m.url)}">${escapeHtml(m.url)}</td>
        <td>
          <a href="${escapeHtml(m.url)}" target="_blank" rel="noopener" class="btn btn-secondary" style="font-size:11px; padding:4px 8px;">Open</a>
          <button class="btn btn-secondary btn-copy-tbl" data-val="${escapeHtml(m.url)}" style="font-size:11px; padding:4px 8px;">Copy</button>
          <button class="btn btn-primary btn-dl-tbl" data-val="${escapeHtml(m.url)}" style="font-size:11px; padding:4px 8px;">Save</button>
        </td>
      </tr>
    `).join('');

    elements.viewerMediaTableBody.querySelectorAll('.btn-copy-tbl').forEach(b => {
      b.addEventListener('click', () => copyToClipboard(b.dataset.val));
    });
    elements.viewerMediaTableBody.querySelectorAll('.btn-dl-tbl').forEach(b => {
      b.addEventListener('click', () => downloadUrl(b.dataset.val));
    });
  }

  /**
   * Cloud Infrastructure Table
   */
  function renderCloudTable() {
    if (!state.data || !state.data.cloudLinks) return;
    let items = state.data.cloudLinks;

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      items = items.filter(c => c.url.toLowerCase().includes(q) || c.provider.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    }

    if (items.length === 0) {
      elements.cloudTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--text-dim);">No cloud links found.</td></tr>`;
      return;
    }

    elements.cloudTableBody.innerHTML = items.map(c => `
      <tr>
        <td><strong>${escapeHtml(c.provider)}</strong></td>
        <td>${escapeHtml(c.category)}</td>
        <td class="url-cell" title="${escapeHtml(c.url)}">${escapeHtml(c.url)}</td>
        <td>
          <button class="btn btn-secondary btn-copy-tbl" data-val="${escapeHtml(c.url)}">Copy</button>
        </td>
      </tr>
    `).join('');

    elements.cloudTableBody.querySelectorAll('.btn-copy-tbl').forEach(b => {
      b.addEventListener('click', () => copyToClipboard(b.dataset.val));
    });
  }

  /**
   * Structured Cards View
   */

  function renderTablesViewer() {
    if (!state.data) return;
    const tables = state.data.tables || [];
    if (elements.viewerTablesCount) elements.viewerTablesCount.textContent = `${tables.length} Tables Discovered`;

    if (tables.length === 0) {
      elements.viewerTablesContainer.innerHTML = '<div class="empty-state">No tables detected on page.</div>';
      return;
    }

    elements.viewerTablesContainer.innerHTML = tables.map((tbl, idx) => {
      const headerRowHtml = (tbl.headers && tbl.headers.length > 0)
        ? `<tr>${tbl.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`
        : '';

      const bodyRowsHtml = (tbl.rows || []).slice(0, 10).map(row => {
        return `<tr>${row.map(cell => `<td title="${escapeHtml(cell)}">${escapeHtml(cell)}</td>`).join('')}</tr>`;
      }).join('');

      return `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">📊 ${escapeHtml(tbl.title)}</div>
            <span style="font-size: 11px; padding: 2px 8px; border-radius: 10px; background: rgba(16,185,129,0.15); color: #34d399; font-weight: 600;">${tbl.rowCount} Rows × ${tbl.colCount} Cols</span>
          </div>
          <div style="overflow-x: auto; max-height: 250px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px; margin: 10px 0;">
            <table class="data-table" style="font-size: 12px;">
              <thead>${headerRowHtml}</thead>
              <tbody>${bodyRowsHtml}</tbody>
            </table>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;">
            <button class="btn btn-secondary btn-copy-tbl-md" data-idx="${idx}">Copy Markdown</button>
            <button class="btn btn-secondary btn-copy-tbl-json" data-idx="${idx}">Copy JSON</button>
            <button class="btn btn-primary btn-save-tbl-csv" data-idx="${idx}">Export CSV</button>
          </div>
        </div>
      `;
    }).join('');

    elements.viewerTablesContainer.querySelectorAll('.btn-copy-tbl-md').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = tables[Number(btn.dataset.idx)];
        if (t && t.markdown) { copyToClipboard(t.markdown); showToast('Copied Markdown table!'); }
      });
    });

    elements.viewerTablesContainer.querySelectorAll('.btn-copy-tbl-json').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = tables[Number(btn.dataset.idx)];
        if (t && t.json) { copyToClipboard(JSON.stringify(t.json, null, 2)); showToast('Copied JSON array!'); }
      });
    });

    elements.viewerTablesContainer.querySelectorAll('.btn-save-tbl-csv').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = tables[Number(btn.dataset.idx)];
        if (t && t.csv) downloadFile(t.csv, `${state.data.domain || 'extracted'}-table-${Number(btn.dataset.idx) + 1}.csv`, 'text/csv');
      });
    });
  }

  function renderLeadsViewer() {
    if (!state.data) return;
    const contacts = state.data.contacts || { emails: [], phones: [], socials: [] };
    const emails = contacts.emails || [];
    const phones = contacts.phones || [];
    const socials = contacts.socials || [];
    const forms = state.data.forms || [];

    const total = emails.length + phones.length + socials.length;
    if (elements.viewerLeadsCount) elements.viewerLeadsCount.textContent = `${total} Contacts & Leads (${emails.length} Emails • ${phones.length} Phones • ${socials.length} Socials)`;

    let html = '';
    if (emails.length > 0) {
      html += `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
          <h3 style="font-size: 13px; color: var(--text-primary); margin-bottom: 10px;">✉️ Discovered Email Addresses (${emails.length})</h3>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${emails.map(e => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-secondary); border-radius: 6px;">
                <span style="font-family: monospace; color: var(--text-primary);">${escapeHtml(e)}</span>
                <a href="mailto:${escapeHtml(e)}" class="btn btn-secondary" style="padding: 3px 10px; font-size: 11px; text-decoration: none;">Send Email</a>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (phones.length > 0) {
      html += `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
          <h3 style="font-size: 13px; color: var(--text-primary); margin-bottom: 10px;">📞 Phone Numbers (${phones.length})</h3>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${phones.map(p => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-secondary); border-radius: 6px;">
                <span style="font-family: monospace; color: var(--text-primary);">${escapeHtml(p)}</span>
                <a href="tel:${escapeHtml(p)}" class="btn btn-secondary" style="padding: 3px 10px; font-size: 11px; text-decoration: none;">Call</a>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (socials.length > 0) {
      html += `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
          <h3 style="font-size: 13px; color: var(--text-primary); margin-bottom: 10px;">🌐 Social & Community Profiles (${socials.length})</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
            ${socials.map(s => `
              <a href="${escapeHtml(s.url)}" target="_blank" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; text-decoration: none; color: var(--text-primary);">
                <strong style="color: #38bdf8;">${escapeHtml(s.platform)}</strong>
                <span style="font-size: 11px; color: var(--text-secondary);">↗ Visit</span>
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }

    elements.viewerLeadsContainer.innerHTML = html || '<div class="empty-state">No contacts or leads detected.</div>';
  }

  function renderCardsView() {
    if (!state.data || !state.data.cards) return;
    let items = state.data.cards;
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

    if (items.length === 0) {
      elements.viewerCardsGrid.innerHTML = `
        <div class="empty-state">
          <p>No structured cards match current search.</p>
        </div>`;
      return;
    }

    elements.viewerCardsGrid.innerHTML = items.map(c => `
      <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:14px; display:flex; gap:16px;">
        <div style="width:110px; height:90px; border-radius:6px; background:var(--bg-card); overflow:hidden; flex-shrink:0;">
          ${c.image ? `<img src="${escapeHtml(c.image)}" referrerpolicy="no-referrer" style="width:100%; height:100%; object-fit:cover;">` : '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px;">No Image</div>'}
        </div>
        <div style="flex:1; min-width:0; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
              <h4 style="font-size:14px; color:var(--text-primary); font-weight:700;">${escapeHtml(c.title)}</h4>
              <div style="display:flex; gap:6px;">
                ${c.price ? `<span style="font-size:11px; font-weight:700; background:rgba(16,185,129,0.15); color:#10b981; padding:2px 6px; border-radius:4px;">${escapeHtml(c.price)}</span>` : ''}
                ${c.badge ? `<span style="font-size:10.5px; font-weight:700; background:rgba(245,158,11,0.15); color:#f59e0b; padding:2px 6px; border-radius:4px;">${escapeHtml(c.badge)}</span>` : ''}
              </div>
            </div>
            <p style="font-size:12px; color:var(--text-secondary); margin-top:6px; line-height:1.4;">${escapeHtml(c.description || 'No description')}</p>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:8px; border-top:1px dashed var(--border-color);">
            <a href="${escapeHtml(c.link)}" target="_blank" style="font-size:11px; color:#38bdf8; text-decoration:none; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:400px;">
              🔗 ${escapeHtml(c.linkText || c.link || 'Inline Element')}
            </a>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-secondary btn-copy-card-str" data-title="${escapeHtml(c.title)}" data-img="${escapeHtml(c.image)}" data-desc="${escapeHtml(c.description)}" data-link="${escapeHtml(c.link)}">Copy All</button>
              <button class="btn btn-secondary btn-copy-one-card" data-json='${escapeHtml(JSON.stringify(c))}'>JSON</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    elements.viewerCardsGrid.querySelectorAll('.btn-copy-card-str').forEach(b => {
      b.addEventListener('click', () => {
        const text = `Title: ${b.dataset.title}\nImage: ${b.dataset.img}\nDescription: ${b.dataset.desc}\nLink: ${b.dataset.link}`;
        copyToClipboard(text);
        showToast('Card copied (Title, Image, Desc & Link)!');
      });
    });

    elements.viewerCardsGrid.querySelectorAll('.btn-copy-one-card').forEach(b => {
      b.addEventListener('click', () => {
        copyToClipboard(b.dataset.json);
        showToast('Card copied as JSON!');
      });
    });
  }

  /**
   * All Links Table
   */
  function renderLinksTable() {
    if (!state.data || !state.data.links) return;
    let items = state.data.links;

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      items = items.filter(l => l.url.toLowerCase().includes(q) || (l.text && l.text.toLowerCase().includes(q)));
    }

    if (items.length === 0) {
      elements.linksTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--text-dim);">No links found.</td></tr>`;
      return;
    }

    elements.linksTableBody.innerHTML = items.slice(0, 500).map(l => `
      <tr>
        <td>${l.isDocument ? `<strong>FILE (${escapeHtml(l.docType)})</strong>` : (l.isInternal ? 'Internal' : 'External')}</td>
        <td>${escapeHtml(l.text || '—')}</td>
        <td class="url-cell" title="${escapeHtml(l.url)}">${escapeHtml(l.url)}</td>
        <td>
          <button class="btn btn-secondary btn-copy-tbl" data-val="${escapeHtml(l.url)}">Copy</button>
        </td>
      </tr>
    `).join('');

    elements.linksTableBody.querySelectorAll('.btn-copy-tbl').forEach(b => {
      b.addEventListener('click', () => copyToClipboard(b.dataset.val));
    });
  }

  /**
   * Sitemap Table
   */
  function renderSitemapTable(urls) {
    state.sitemapUrls = urls || [];
    let items = state.sitemapUrls;

    elements.sideCountSitemap.textContent = items.length;
    elements.statSitemapCount.textContent = items.length;

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      items = items.filter(u => u.url.toLowerCase().includes(q));
    }

    if (items.length === 0) {
      elements.sitemapTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-dim);">No sitemap URLs loaded. Click "Fetch & Parse" above.</td></tr>`;
      return;
    }

    elements.sitemapTableBody.innerHTML = items.slice(0, 1000).map(u => `
      <tr>
        <td class="url-cell" title="${escapeHtml(u.url)}">${escapeHtml(u.url)}</td>
        <td>${escapeHtml(u.lastmod || '—')}</td>
        <td>${escapeHtml(u.changefreq || '—')}</td>
        <td>${escapeHtml(u.priority || '—')}</td>
        <td>
          <button class="btn btn-secondary btn-copy-tbl" data-val="${escapeHtml(u.url)}">Copy</button>
        </td>
      </tr>
    `).join('');

    elements.sitemapTableBody.querySelectorAll('.btn-copy-tbl').forEach(b => {
      b.addEventListener('click', () => copyToClipboard(b.dataset.val));
    });
  }

  /**
   * JSON Tree
   */
  function renderJsonTree() {
    if (!state.data) return;
    elements.jsonCodeBox.textContent = JSON.stringify(state.data, null, 2);
  }

  /**
   * Fetch Sitemap in Viewer
   */
  function fetchSitemapDirectly() {
    const sitemapUrl = elements.viewerSitemapInput.value.trim();
    if (!sitemapUrl) return;

    elements.btnViewerFetchSitemap.disabled = true;
    elements.btnViewerFetchSitemap.textContent = 'Parsing...';

    chrome.runtime.sendMessage({
      action: 'FETCH_SITEMAP',
      targetUrl: (state.data && state.data.url) || sitemapUrl,
      customSitemapUrl: sitemapUrl
    }, (res) => {
      elements.btnViewerFetchSitemap.disabled = false;
      elements.btnViewerFetchSitemap.textContent = 'Fetch & Parse';

      if (res && res.success && res.urls) {
        showToast(`Parsed ${res.totalUrls} URLs from sitemap!`);
        renderSitemapTable(res.urls);
      } else {
        showToast(`Sitemap error: ${(res && res.error) || 'Failed'}`);
      }
    });
  }

  /**
   * Event listeners
   */
  function setupNavigation() {
    elements.navItems.forEach(item => {
      item.addEventListener('click', () => {
        elements.navItems.forEach(i => i.classList.remove('active'));
        elements.viewSections.forEach(s => s.classList.remove('active'));

        item.classList.add('active');
        state.activeView = item.dataset.view;
        const targetSection = document.getElementById(state.activeView);
        if (targetSection) targetSection.classList.add('active');
      });
    });
  }

  function setupEventListeners() {
    // Instant search filter
    elements.viewerSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      renderImagesGrid();
      renderMediaTable();
      renderCardsView();
      renderCloudTable();
      renderLinksTable();
      if (state.sitemapUrls.length > 0) renderSitemapTable(state.sitemapUrls);
    });

    // Cards actions
    elements.btnCopyAllViewerCardsJson?.addEventListener('click', () => {
      if (!state.data || !state.data.cards) return;
      copyToClipboard(JSON.stringify(state.data.cards, null, 2));
      showToast(`Copied ${state.data.cards.length} structured cards as JSON!`);
    });

    elements.btnDownloadCardsCsv?.addEventListener('click', () => {
      if (!state.data || !state.data.cards || state.data.cards.length === 0) return;
      let csv = 'Title,Price,Badge,Image,Description,Link\n';
      state.data.cards.forEach(c => {
        csv += `"${(c.title || '').replace(/"/g, '""')}","${(c.price || '').replace(/"/g, '""')}","${(c.badge || '').replace(/"/g, '""')}","${(c.image || '').replace(/"/g, '""')}","${(c.description || '').replace(/"/g, '""')}","${(c.link || '').replace(/"/g, '""')}"\n`;
      });
      downloadFile(csv, `${state.data.domain || 'extracted'}-cards.csv`, 'text/csv');
    });

    // Image filter
    elements.viewerImageFilter.addEventListener('change', (e) => {
      state.imageFormatFilter = e.target.value;
      renderImagesGrid();
    });

    // Media filter
    if (elements.viewerMediaFilter) {
      elements.viewerMediaFilter.addEventListener('change', () => {
        renderMediaTable();
      });
    }

    if (elements.btnViewerDownloadAllMedia) {
      elements.btnViewerDownloadAllMedia.addEventListener('click', () => {
        if (!state.data || !state.data.media) return;
        const meds = state.data.media.filter(m => m.kind !== 'embed').slice(0, 25);
        meds.forEach((m, idx) => {
          setTimeout(() => downloadUrl(m.url), idx * 300);
        });
        showToast(`Downloading ${meds.length} media files...`);
      });
    }

    // Sitemap fetch
    elements.btnViewerFetchSitemap.addEventListener('click', fetchSitemapDirectly);

    // Top actions
    elements.btnViewerExportJson.addEventListener('click', () => {
      if (!state.data) return;
      downloadFile(JSON.stringify(state.data, null, 2), `${state.data.domain || 'extracted'}-data.json`, 'application/json');
    });

    elements.btnViewerExportCsv.addEventListener('click', () => {
      if (!state.data) return;
      let csv = 'Type,Category,URL,Extra\n';
      (state.data.images || []).forEach(img => {
        csv += `"Image","${img.format || ''}","${img.url}","${img.alt || ''}"\n`;
      });
      (state.data.media || []).forEach(m => {
        csv += `"Media (${m.kind})","${m.format || ''}","${m.url}","${(m.title || '').replace(/"/g, '""')}"\n`;
      });
      (state.data.cloudLinks || []).forEach(c => {
        csv += `"Cloud","${c.provider} - ${c.category}","${c.url}",""\n`;
      });
      (state.data.links || []).forEach(l => {
        csv += `"Link","${l.isInternal ? 'Internal' : 'External'}","${l.url}","${(l.text || '').replace(/"/g, '""')}"\n`;
      });
      state.sitemapUrls.forEach(s => {
        csv += `"Sitemap","${s.changefreq || ''}","${s.url}","${s.lastmod || ''}"\n`;
      });
      downloadFile(csv, `${state.data.domain || 'extracted'}-summary.csv`, 'text/csv');
    });

    elements.btnViewerCopyUrls.addEventListener('click', () => {
      const urls = [];
      if (state.data) {
        (state.data.images || []).forEach(i => urls.push(i.url));
        (state.data.media || []).forEach(m => urls.push(m.url));
        (state.data.cloudLinks || []).forEach(c => urls.push(c.url));
        (state.data.links || []).forEach(l => urls.push(l.url));
        state.sitemapUrls.forEach(s => urls.push(s.url));
      }
      if (urls.length > 0) {
        copyToClipboard(Array.from(new Set(urls)).join('\n'));
        showToast(`Copied ${urls.length} URLs!`);
      }
    });

    elements.btnCopyJsonRaw.addEventListener('click', () => {
      if (state.data) {
        copyToClipboard(JSON.stringify(state.data, null, 2));
      }
    });

    elements.btnDownloadAllImages.addEventListener('click', () => {
      if (!state.data || !state.data.images) return;
      const imgs = state.data.images.slice(0, 50);
      imgs.forEach((img, idx) => {
        setTimeout(() => downloadUrl(img.url), idx * 250);
      });
      showToast(`Downloading ${imgs.length} images...`);
    });
  }

  function copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!'));
  }

  function downloadUrl(url) {
    chrome.runtime.sendMessage({ action: 'DOWNLOAD_FILE', url: url });
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({ url: url, filename: filename, saveAs: true }, () => {
      URL.revokeObjectURL(url);
      showToast(`Exported ${filename}`);
    });
  }

  function showToast(msg) {
    elements.toast.textContent = msg;
    elements.toast.classList.add('show');
    setTimeout(() => elements.toast.classList.remove('show'), 2200);
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

