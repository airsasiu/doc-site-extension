import DocumentSearchComponent from '../base/DocumentSearchComponent.js';
import DocsAPI from '../../services/api.js';
import URLUtils from '../../services/urlUtils.js';
import { searchInMarkdown, extractContext, countSearchMatches } from '../../utils/markdownUtils.js';
import { getActiveLanguage } from '../../../shared/localization.js';

const TEXTS = {
  cn: {
    searchResultLabel: '搜索结果',
    pageLinkResultLabel: '页面链接',
    searching: '搜索中...',
    search: '搜索',
    loadingPageLinks: '正在读取当前版本的页面...',
    pageLinkIdle: '输入内容后会自动筛选当前版本的页面。',
    pageLinkReady: '已找到 {count} 个匹配页面。',
    pageLinkLimited: '已找到 {count} 个匹配页面，先显示前 {limit} 个。',
    pageLinkNoResults: '没有找到匹配页面',
    pageMatchSummary: '匹配字段：{fields}'
  },
  en: {
    searchResultLabel: 'Search results',
    pageLinkResultLabel: 'Page links',
    searching: 'Searching...',
    search: 'Search',
    loadingPageLinks: 'Loading pages from the current version...',
    pageLinkIdle: 'Type to filter pages in the current version.',
    pageLinkReady: 'Found {count} matching pages.',
    pageLinkLimited: 'Found {count} matching pages. Showing the first {limit}.',
    pageLinkNoResults: 'No matching pages found',
    pageMatchSummary: 'Matched fields: {fields}'
  }
};

function t(key, params = {}) {
  const language = getActiveLanguage();
  const template = TEXTS[language]?.[key] || TEXTS.cn[key] || key;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => {
    const value = params[name];
    return value === undefined || value === null ? '' : String(value);
  });
}

function normalizeQuery(value) {
  return String(value || '').trim().toLowerCase();
}

function expandSearchTerm(value) {
  const normalized = normalizeQuery(value);
  if (!normalized) {
    return [];
  }

  const terms = [normalized];

  try {
    const parsed = new URL(String(value).trim());
    if (parsed.pathname) {
      terms.push(normalizeQuery(parsed.pathname));
    }
  } catch (error) {
    // not a full URL
  }

  const normalizedPath = URLUtils.normalizeDocumentPath(String(value));
  if (normalizedPath) {
    terms.push(normalizeQuery(normalizedPath));
  }

  return Array.from(new Set(terms.filter(Boolean)));
}

function splitSearchTerms(searchText, isMultiline) {
  if (!isMultiline) {
    return expandSearchTerm(searchText);
  }

  return String(searchText)
    .split(/\r?\n+/)
    .flatMap(line => expandSearchTerm(line))
    .filter(Boolean);
}

function getTocRoots(tocData) {
  if (Array.isArray(tocData)) {
    return tocData;
  }

  if (!tocData || typeof tocData !== 'object') {
    return [];
  }

  return tocData.tocItemDrafts ||
    tocData.children ||
    tocData.items ||
    tocData.toc?.tocItemDrafts ||
    tocData.demoToc?.tocItemDrafts ||
    [];
}

function collectTocItems(tocData) {
  const items = [];
  const roots = getTocRoots(tocData);

  const visit = (item) => {
    if (!item || typeof item !== 'object') {
      return;
    }

    const id = String(item.tocItemId || item.id || item.guid || '').trim();
    const documentPath = String(item.documentPath || item.path || '').trim();
    if (id && documentPath) {
      items.push({
        id,
        documentPath,
        title: String(item.text || item.displayName || item.title || item.name || '').trim()
      });
    }

    ['tocItemDrafts', 'children', 'items', 'subItems', 'subsections']
      .flatMap(key => Array.isArray(item[key]) ? item[key] : [])
      .forEach(visit);
  };

  roots.forEach(visit);
  return items;
}

function collectVersionTocItems(versions, pageType) {
  const tocSources = [];

  if (pageType === 'DemoEdit' && versions.demoToc) {
    tocSources.push(versions.demoToc);
  }

  if (versions.toc) {
    tocSources.push(versions.toc);
  }

  if (pageType !== 'DemoEdit' && versions.demoToc) {
    tocSources.push(versions.demoToc);
  }

  const seen = new Set();
  return tocSources
    .flatMap(source => collectTocItems(source))
    .filter(item => {
      const key = item.id || item.documentPath;
      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function formatMatchedFieldNames(matchedFields) {
  const language = getActiveLanguage();
  const labels = language === 'en'
    ? { title: 'Title', path: 'Path', url: 'URL' }
    : { title: '标题', path: '路径', url: 'URL' };

  return matchedFields.map(field => labels[field] || field).join(' / ');
}

class SearchComponent extends DocumentSearchComponent {
  constructor(progressBar) {
    super(progressBar);
    this.searchInput = document.querySelector('.search-input');
    this.searchButton = document.querySelector('.search-button');
    this.multilineCheckbox = document.querySelector('.multiline-checkbox');
    this.pageLinkInput = document.querySelector('.page-link-input');
    this.pageLinkResults = document.querySelector('.page-link-results');
    this.pageLinkStatus = document.querySelector('.page-link-lookup-status');
    this.pageLinkCount = document.querySelector('.page-link-lookup-count');
    this.pageLinkItems = [];
    this.pageLinkContextKey = '';
    this.pageLinkLoadedContextKey = '';
    this.pageLinkLoadPromise = null;
    this.pageLinkFilterTimer = null;
    this.pageLinkVisibleLimit = 50;

    this.bindPageLinkEvents();
    window.addEventListener('docsite-language-changed', () => {
      this.refreshPageLinkLookup();
    });
  }

  bindPageLinkEvents() {
    if (!this.pageLinkInput) {
      return;
    }

    this.pageLinkInput.addEventListener('input', () => {
      this.schedulePageLinkLookup();
    });
  }

  async handleSearch() {
    const searchText = this.searchInput.value.trim();
    if (!searchText) return;

    await this.handleContentSearch(searchText);
  }

  async handleContentSearch(searchText) {
    this.collapseSidebarForWork();
    this.setLoadingState(true);

    try {
      const isMultiline = this.multilineCheckbox.checked;
      const searchConfigs = [{
        id: 'content-search',
        label: t('searchResultLabel'),
        check: (content) => searchInMarkdown(content, searchText, isMultiline),
        getContent: (content) => extractContext(content, searchText, 100, isMultiline),
        getMatchCount: (content) => countSearchMatches(content, searchText, isMultiline),
        actionType: 'mark'
      }];

      await this.performSearch(searchConfigs);
    } finally {
      this.setLoadingState(false);
    }
  }

  schedulePageLinkLookup(delay = 150) {
    clearTimeout(this.pageLinkFilterTimer);
    this.pageLinkFilterTimer = window.setTimeout(() => {
      this.refreshPageLinkLookup();
    }, delay);
  }

  async refreshPageLinkLookup() {
    if (!this.pageLinkInput || !this.pageLinkResults) {
      return;
    }

    const searchText = this.pageLinkInput.value.trim();
    const searchTerms = splitSearchTerms(searchText, true);
    if (searchTerms.length === 0) {
      this.renderPageLinkResults([], { total: 0 });
      this.setPageLinkStatus(t('pageLinkIdle'));
      return;
    }

    this.setPageLinkStatus(t('loadingPageLinks'));

    try {
      const pageItems = await this.ensurePageLinkItems();
      const latestSearchText = this.pageLinkInput.value.trim();
      const latestSearchTerms = splitSearchTerms(latestSearchText, true);
      if (latestSearchTerms.length === 0) {
        this.renderPageLinkResults([], { total: 0 });
        this.setPageLinkStatus(t('pageLinkIdle'));
        return;
      }

      const lookupResults = pageItems
        .map((item, index) => this.buildPageLookupResult(item, latestSearchTerms, index))
        .filter(Boolean)
        .sort((a, b) => a.documentPath.localeCompare(b.documentPath));

      this.renderPageLinkResults(lookupResults, { total: lookupResults.length });
    } catch (error) {
      console.error('页面链接查找失败:', error);
      this.renderPageLinkResults([], { total: 0 });
      this.setPageLinkStatus(this.getText('operationFailed', { message: error.message }), 'error');
    }
  }

  async ensurePageLinkItems() {
    const currentUrl = await URLUtils.getCurrentTabUrl();
    const productID = URLUtils.getProductIDFromURL(currentUrl);
    const pageType = URLUtils.getPageTypeFromURL(currentUrl);

    if (!productID) {
      throw new Error(this.getText('productIdMissing'));
    }

    const origin = new URL(currentUrl).origin;
    const contextKey = `${origin}|${productID}|${pageType || ''}`;
    if (this.pageLinkLoadedContextKey === contextKey) {
      return this.pageLinkItems;
    }

    if (this.pageLinkLoadPromise && this.pageLinkContextKey === contextKey) {
      return this.pageLinkLoadPromise;
    }

    this.pageLinkContextKey = contextKey;
    this.pageLinkLoadPromise = (async () => {
      const versions = await DocsAPI.getDocVersions(productID);
      this.pageLinkItems = collectVersionTocItems(versions, pageType)
        .map((item, index) => this.buildPageLinkItem(item, origin, index))
        .filter(Boolean);
      this.pageLinkLoadedContextKey = contextKey;
      return this.pageLinkItems;
    })();

    try {
      return await this.pageLinkLoadPromise;
    } finally {
      this.pageLinkLoadPromise = null;
    }
  }

  buildPageLinkItem(item, origin, index) {
    const documentPath = URLUtils.normalizeDocumentPath(item.documentPath || item.path || '');
    if (!documentPath) {
      return null;
    }

    const title = String(item.title || item.displayName || item.text || item.name || documentPath).trim();
    const pageUrl = URLUtils.buildDocumentUrl(origin, documentPath);

    return {
      id: item.id || item.tocItemId || item.documentPath || `${index}`,
      title,
      documentPath,
      pageUrl
    };
  }

  buildPageLookupResult(item, searchTerms, index) {
    const searchFields = [
      { key: 'title', value: item.title },
      { key: 'path', value: item.documentPath },
      { key: 'url', value: item.pageUrl }
    ];

    const matchedFields = searchFields
      .filter(field => {
        const normalizedValue = normalizeQuery(field.value);
        return searchTerms.some(term => normalizedValue.includes(term));
      })
      .map(field => field.key);

    if (matchedFields.length === 0) {
      return null;
    }

    return {
      title: item.title,
      content: t('pageMatchSummary', { fields: formatMatchedFieldNames(matchedFields) }),
      path: item.pageUrl,
      url: item.pageUrl,
      tocItemId: item.id,
      documentPath: item.documentPath,
      productID: '',
      itemId: item.id,
      configId: 'page-link',
      actionType: 'copy-link',
      matchCount: matchedFields.length,
      enterOrder: index
    };
  }

  renderPageLinkResults(results, { total } = {}) {
    if (!this.pageLinkResults) {
      return;
    }

    this.pageLinkResults.innerHTML = '';

    const safeTotal = Number.isFinite(total) ? total : results.length;
    if (this.pageLinkCount) {
      this.pageLinkCount.textContent = String(safeTotal);
    }

    if (safeTotal === 0) {
      const hasQuery = Boolean(this.pageLinkInput?.value.trim());
      if (hasQuery) {
        const empty = document.createElement('div');
        empty.className = 'no-results';
        empty.textContent = t('pageLinkNoResults');
        this.pageLinkResults.appendChild(empty);
        this.setPageLinkStatus(t('pageLinkNoResults'));
      }
      return;
    }

    const visibleResults = results.slice(0, this.pageLinkVisibleLimit);
    visibleResults.forEach((result, index) => {
      this.pageLinkResults.appendChild(this.createResultItem(result, index));
    });

    this.setPageLinkStatus(safeTotal > visibleResults.length
      ? t('pageLinkLimited', { count: safeTotal, limit: visibleResults.length })
      : t('pageLinkReady', { count: safeTotal }));
  }

  setPageLinkStatus(message, type = 'info') {
    if (!this.pageLinkStatus) {
      return;
    }

    this.pageLinkStatus.textContent = message;
    this.pageLinkStatus.classList.toggle('error', type === 'error');
  }

  setLoadingState(isLoading) {
    if (this.searchButton) {
      this.searchButton.disabled = isLoading;
      this.searchButton.textContent = isLoading ? t('searching') : t('search');
    }

    if (this.searchInput) {
      this.searchInput.disabled = isLoading;
    }
  }
}

export default SearchComponent;
