import SearchComponent from './components/search/SearchComponent.js';
import CheckComponent from './components/check/CheckComponent.js';
import ProgressBar from './components/progress/ProgressBar.js';
import BatchAddComponent from './components/BatchAddComponent.js';
import ExportMarkdownComponent from './components/export/ExportMarkdownComponent.js';
import URLUtils from './services/urlUtils.js';
import DocsAPI from './services/api.js';
import { getStoredLanguage, normalizeLanguage, setActiveLanguage, setText } from '../shared/localization.js';

const COMPACT_MODE_STORAGE_KEY = 'docSiteHelperSidebarCompact';

const TEXTS = {
  cn: {
    brand: '文档工作台',
    compactLabel: '工作模式',
    compactCollapse: '收起',
    compactExpand: '展开',
    compactCollapseTitle: '收起工作区',
    compactExpandTitle: '展开工作区',
    tabSearch: '搜索',
    tabDocument: '文档操作',
    tabPage: '页面操作',
    contentSearchTool: '内容搜索',
    pageLinkTool: '页面链接',
    searchPlaceholderContent: '搜索文档内容...',
    pageLinkTitle: 'Page Link',
    pageLinkHeading: '查找页面链接',
    pageLinkPlaceholder: '输入页面标题、路径或 URL 自动筛选...',
    pageLinkIdle: '输入内容后会自动筛选当前版本的页面。',
    multiline: '多行匹配',
    multilineHelp: '勾选时，搜索内容将按换行分割为多个匹配项；不勾选时，所有内容作为一个匹配项',
    searchButton: '搜索',
    checkButton: '常规检查',
    listView: '列表视图',
    treeView: '路径分组'
  },
  en: {
    brand: 'Document workspace',
    compactLabel: 'Work mode',
    compactCollapse: 'Compact',
    compactExpand: 'Expand',
    compactCollapseTitle: 'Collapse the workspace',
    compactExpandTitle: 'Expand the workspace',
    tabSearch: 'Search',
    tabDocument: 'Doc tools',
    tabPage: 'Page tools',
    contentSearchTool: 'Content Search',
    pageLinkTool: 'Page Links',
    searchPlaceholderContent: 'Search document content...',
    pageLinkTitle: 'Page Link',
    pageLinkHeading: 'Find Page Links',
    pageLinkPlaceholder: 'Type a page title, path, or URL to filter...',
    pageLinkIdle: 'Type to filter pages in the current version.',
    multiline: 'Multiline match',
    multilineHelp: 'When enabled, each line is matched separately; when disabled, the full text is treated as one query.',
    searchButton: 'Search',
    checkButton: 'Routine check',
    listView: 'List view',
    treeView: 'Path grouping'
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  let currentLanguage = normalizeLanguage(await getStoredLanguage());
  let text = TEXTS[currentLanguage] || TEXTS.cn;

  const applySidebarLanguage = (language) => {
    currentLanguage = normalizeLanguage(language);
    text = TEXTS[currentLanguage] || TEXTS.cn;
    setActiveLanguage(currentLanguage);
    document.documentElement.lang = currentLanguage === 'en' ? 'en-US' : 'zh-CN';

    setText('.sidebar-brand h1', text.brand);
    setText('.sidebar-compact-label', text.compactLabel);

    const searchTabBtn = document.querySelector('.main-tab-btn[data-tab="search"]');
    const documentTabBtn = document.querySelector('.main-tab-btn[data-tab="document-operations"]');
    const pageTabBtn = document.querySelector('.main-tab-btn[data-tab="page-operations"]');
    if (searchTabBtn) {
      searchTabBtn.title = text.tabSearch;
      searchTabBtn.textContent = currentLanguage === 'en' ? 'S' : '搜';
    }
    if (documentTabBtn) {
      documentTabBtn.title = text.tabDocument;
      documentTabBtn.textContent = currentLanguage === 'en' ? 'D' : '文';
    }
    if (pageTabBtn) {
      pageTabBtn.title = text.tabPage;
      pageTabBtn.textContent = currentLanguage === 'en' ? 'P' : '页';
    }

    const searchInput = document.querySelector('.search-input');
    const multilineLabel = document.querySelector('.multiline-option span');
    const helpIcon = document.querySelector('.help-icon');
    const searchButton = document.querySelector('.search-button');
    const checkButton = document.querySelector('.routine-check-button');
    const listViewButton = document.querySelector('.view-toggle-btn[data-view="list"]');
    const treeViewButton = document.querySelector('.view-toggle-btn[data-view="tree"]');
    const contentSearchToolBtn = document.querySelector('.search-workspace-tab[data-search-panel="content-search-panel"]');
    const pageLinkToolBtn = document.querySelector('.search-workspace-tab[data-search-panel="page-link-panel"]');
    const pageLinkTitle = document.querySelector('.page-link-lookup-title');
    const pageLinkHeading = document.querySelector('.page-link-lookup-heading');
    const pageLinkInput = document.querySelector('.page-link-input');
    const pageLinkStatus = document.querySelector('.page-link-lookup-status');
    if (contentSearchToolBtn) contentSearchToolBtn.textContent = text.contentSearchTool;
    if (pageLinkToolBtn) pageLinkToolBtn.textContent = text.pageLinkTool;
    if (searchInput) searchInput.placeholder = text.searchPlaceholderContent;
    if (pageLinkTitle) pageLinkTitle.textContent = text.pageLinkTitle;
    if (pageLinkHeading) pageLinkHeading.textContent = text.pageLinkHeading;
    if (pageLinkInput) pageLinkInput.placeholder = text.pageLinkPlaceholder;
    if (pageLinkStatus && !pageLinkInput?.value?.trim()) pageLinkStatus.textContent = text.pageLinkIdle;
    if (multilineLabel) multilineLabel.textContent = text.multiline;
    if (helpIcon) helpIcon.title = text.multilineHelp;
    if (searchButton) searchButton.textContent = text.searchButton;
    if (checkButton) checkButton.textContent = text.checkButton;
    if (listViewButton) listViewButton.textContent = text.listView;
    if (treeViewButton) treeViewButton.textContent = text.treeView;

    window.dispatchEvent(new CustomEvent('docsite-language-changed', {
      detail: { language: currentLanguage }
    }));
  };

  const sidebarShell = document.querySelector('.sidebar-shell');
  const compactToggle = document.querySelector('.sidebar-compact-toggle');
  let exportMarkdownComponent;
  let batchAddComponent;

  const setCompactMode = (compact, { persist = true } = {}) => {
    if (!sidebarShell || !compactToggle) {
      return;
    }

    sidebarShell.classList.toggle('is-compact', compact);
    compactToggle.setAttribute('aria-pressed', String(compact));
    compactToggle.textContent = compact ? text.compactExpand : text.compactCollapse;
    compactToggle.title = compact ? text.compactExpandTitle : text.compactCollapseTitle;

    if (persist) {
      try {
        localStorage.setItem(COMPACT_MODE_STORAGE_KEY, compact ? '1' : '0');
      } catch (error) {
        console.warn('无法保存 sidebar 紧凑模式状态:', error);
      }
    }
  };

  const getStoredCompactMode = () => {
    try {
      return localStorage.getItem(COMPACT_MODE_STORAGE_KEY) === '1';
    } catch (error) {
      return false;
    }
  };

  window.addEventListener('docsite-sidebar-compact', (event) => {
    const compact = Boolean(event.detail?.compact);
    setCompactMode(compact);
  });

  if (compactToggle) {
    compactToggle.addEventListener('click', () => {
      const nextCompact = !sidebarShell?.classList.contains('is-compact');
      setCompactMode(nextCompact);
    });
  }

  applySidebarLanguage(currentLanguage);
  setCompactMode(getStoredCompactMode(), { persist: false });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync' || !changes.docSiteHelperConfig?.newValue) {
      return;
    }

    const nextLanguage = changes.docSiteHelperConfig.newValue.language;
    if (nextLanguage) {
      applySidebarLanguage(nextLanguage);
      exportMarkdownComponent?.applyLanguage?.();
      batchAddComponent?.applyLanguage?.();
      setCompactMode(sidebarShell?.classList.contains('is-compact') ?? false, { persist: false });
    }
  });

  // 为每个tab创建独立的进度条
  const searchProgressBar = new ProgressBar('#search-tab .search-progress-container');
  const documentOperationsProgressBar = new ProgressBar('#document-operations-tab .document-progress-container');
  const pageOperationsProgressBar = new ProgressBar('#page-operations-tab .batch-progress-container');
  
  // 使用对应的进度条初始化组件
  const searchComponent = new SearchComponent(searchProgressBar);
  const checkComponent = new CheckComponent(searchProgressBar);
  exportMarkdownComponent = new ExportMarkdownComponent(documentOperationsProgressBar);
  batchAddComponent = new BatchAddComponent(pageOperationsProgressBar);
  
  // 主要Tab切换功能
  const mainTabs = document.querySelectorAll('.main-tab-btn');
  const mainTabContents = document.querySelectorAll('.main-tab-content');
  
  mainTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      
      // 移除所有active类
      mainTabs.forEach(t => t.classList.remove('active'));
      mainTabContents.forEach(c => c.classList.remove('active'));
      
      // 添加当前tab的active类
      tab.classList.add('active');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });

  const searchWorkspaceTabs = document.querySelectorAll('.search-workspace-tab');
  const searchWorkspacePanels = document.querySelectorAll('.search-workspace-panel');

  searchWorkspaceTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const panelId = tab.dataset.searchPanel;
      searchWorkspaceTabs.forEach(item => item.classList.remove('active'));
      searchWorkspacePanels.forEach(panel => panel.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(panelId)?.classList.add('active');
    });
  });
  
  // 绑定事件监听
  document.querySelector('.search-button')
    .addEventListener('click', () => searchComponent.handleSearch());
    
  document.querySelector('.routine-check-button')
    .addEventListener('click', () => checkComponent.handleCheck());
    

  
  // 监听来自 content script 的消息
  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.type === 'copyEnglishDoc') {
      console.log('收到复制英文文档请求:', request);
      await handleCopyEnglishDoc(request, sendResponse);
      return true; // 保持消息通道打开
    }
  });
}); 
