import DocsAPI from '../../services/api.js';
import URLUtils from '../../services/urlUtils.js';
import { TabManager } from '../check/tabManager.js';
import { getActiveLanguage } from '../../../shared/localization.js';

const TEXTS = {
  cn: {
    preparingSearch: '正在准备搜索...',
    productIdMissing: '无法获取产品ID，请确保在文档编辑页面使用此扩展',
    fetchingDocumentList: '正在获取文档列表...',
    foundDocuments: '找到 {count} 个文档，开始处理...',
    invalidDocumentContent: '无效的文档内容',
    completed: '处理完成！成功：{success}，失败：{failed}',
    cancelled: '操作已取消',
    operationError: '操作出错：{message}',
    operationFailed: '操作失败：{message}',
    errorTab: '错误',
    docUrlFormatError: '文档站 API URL 格式不正确',
    apiUrlMissing: '请在扩展配置页填写文档站 API URL，或先打开一个 DocSite 页面',
    copyLink: '复制链接',
    linkCopied: '链接已复制到剪贴板',
    copyFailed: '复制链接失败：{message}'
  },
  en: {
    preparingSearch: 'Preparing search...',
    productIdMissing: 'Unable to get the product ID. Please use this extension on a documentation editor page.',
    fetchingDocumentList: 'Fetching document list...',
    foundDocuments: 'Found {count} documents. Starting processing...',
    invalidDocumentContent: 'Invalid document content',
    completed: 'Done. Success: {success}, failed: {failed}',
    cancelled: 'Operation canceled',
    operationError: 'Operation error: {message}',
    operationFailed: 'Operation failed: {message}',
    errorTab: 'Error',
    docUrlFormatError: 'Invalid Docs API URL format',
    apiUrlMissing: 'Please fill in the Docs API URL in the extension settings, or open a DocSite page first',
    copyLink: 'Copy link',
    linkCopied: 'Link copied to clipboard',
    copyFailed: 'Failed to copy link: {message}'
  }
};

function formatMessage(template, params = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

class BaseComponent {
  constructor(progressBar) {
    this.progressBar = progressBar;
    this.tabManager = new TabManager();
    this.currentOperation = null;
  }

  getText(key, params = {}) {
    const language = getActiveLanguage();
    const template = TEXTS[language]?.[key] || TEXTS.cn[key] || key;
    return formatMessage(template, params);
  }

  collapseSidebarForWork() {
    document.querySelector('.sidebar-shell')?.classList.add('is-compact');
    window.dispatchEvent(new CustomEvent('docsite-sidebar-compact', {
      detail: { compact: true }
    }));
  }

  async processDocuments(callback) {
    if (this.currentOperation) {
      this.currentOperation.abort = true;
      this.progressBar.reset();
    }
    
    this.currentOperation = { abort: false };
    const thisOperation = this.currentOperation;
    this.tabManager.clearTabs();
    this.collapseSidebarForWork();
    
    try {
      // 显示加载状态
      this.showStatus(this.getText('preparingSearch'), 'info');
      
      const currentUrl = await URLUtils.getCurrentTabUrl();
      const productID = URLUtils.getProductIDFromURL(currentUrl);
      const pageType = URLUtils.getPageTypeFromURL(currentUrl);
      
      if (!productID) {
        throw new Error(this.getText('productIdMissing'));
      }

      // 存储当前页面类型
      this.currentPageType = pageType;

      // 显示获取文档列表状态
      this.showStatus(this.getText('fetchingDocumentList'), 'info');
      const versions = await DocsAPI.getDocVersions(productID);
      
      // 根据页面类型选择正确的 TOC 对象
      let tocData;
      if (pageType === 'DemoEdit' && versions.demoToc && versions.demoToc.tocItemDrafts) {
        tocData = versions.demoToc.tocItemDrafts;
      } else {
        // 默认使用 helpdoc 的 TOC
        tocData = versions.toc.tocItemDrafts;
      }
      
      // 过滤出需要处理的文档项
      const docItems = tocData.filter(item => 
        item.id && item.hasDoc
      );
      
      const totalCount = docItems.length;
      let processedCount = 0;
      
      // 开始进度跟踪
      this.progressBar.start(totalCount);
      this.showStatus(this.getText('foundDocuments', { count: totalCount }), 'info');

      // 并发控制：每次最多处理 5 个文档
      const CONCURRENCY_LIMIT = 5;
      const results = [];
      
      // 统计信息
      const stats = {
        success: 0,
        failed: 0
      };

      // 并行处理文档项
      for (let i = 0; i < docItems.length; i += CONCURRENCY_LIMIT) {
        if (thisOperation.abort) break;
        
        const batch = docItems.slice(i, i + CONCURRENCY_LIMIT);
        const batchPromises = batch.map(async (item) => {
          if (thisOperation.abort) return;
          
          try {
            const docContent = await DocsAPI.getDocContent(item.id);
            processedCount++;
            this.progressBar.updateProgress(processedCount, totalCount);
            
            if (docContent?.markdownContent) {
              await callback({
                content: docContent,
                item,
                productID,
                pageType: this.currentPageType
              });
              stats.success++;
              return { success: true };
            } else {
              stats.failed++;
              return { success: false, error: this.getText('invalidDocumentContent') };
            }
          } catch (error) {
            processedCount++;
            this.progressBar.updateProgress(processedCount, totalCount);
            stats.failed++;
            console.error(`处理文档 ${item.id} 时出错:`, error);
            return { success: false, error: error.message };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      if (!thisOperation.abort) {
        // 显示完成状态
        this.showStatus(this.getText('completed', { success: stats.success, failed: stats.failed }), 'success');
      } else {
        // 显示取消状态
        this.showStatus(this.getText('cancelled'), 'warning');
      }
      
      this.progressBar.reset();
      return results;
    } catch (error) {
      this.progressBar.reset();
      this.showError(this.getText('operationError', { message: error.message }));
      this.showStatus(this.getText('operationFailed', { message: error.message }), 'error');
      throw error;
    }
  }
  
  // 显示状态消息
  showStatus(message, type = 'info') {
    // 检查是否已有状态容器
    let statusContainer = document.querySelector('.status-message');
    if (!statusContainer) {
      statusContainer = document.createElement('div');
      statusContainer.className = 'status-message';
      // 添加到搜索进度容器下方
      const progressContainer = document.querySelector('.search-progress-container');
      if (progressContainer) {
        progressContainer.parentNode.insertBefore(statusContainer, progressContainer.nextSibling);
      }
    }
    
    // 设置状态消息
    statusContainer.textContent = message;
    statusContainer.className = `status-message motion-leave ${type}`;
    
    // 显示状态容器
    statusContainer.style.display = 'block';
    statusContainer.classList.remove('is-leaving');
    
    // 自动隐藏非错误状态消息
    if (type !== 'error') {
      clearTimeout(statusContainer._hideTimer);
      statusContainer._hideTimer = setTimeout(() => {
        statusContainer.classList.add('is-leaving');
        setTimeout(() => {
          if (statusContainer.classList.contains('is-leaving')) {
            statusContainer.style.display = 'none';
          }
        }, 160);
      }, 3000);
    }
  }

  addResultItem(tab, result) {
    const resultElement = document.createElement('div');
    resultElement.className = 'result-item motion-leave';
    resultElement.innerHTML = `
      <div class="result-title">${result.title}</div>
      <div class="result-content">${result.message}</div>
      <div class="result-path">${result.path}</div>
    `;
    resultElement.addEventListener('click', async () => {
        await URLUtils.navigateCurrentTab(result.url);
      });
    tab.appendChild(resultElement);
  }

  showError(message) {
    const errorTab = this.tabManager.createTab('error', this.getText('errorTab'));
    errorTab.innerHTML = `<div class="error">${message}</div>`;
    errorTab.classList.add('active');
  }

  clearResults() {
    this.tabManager.clearTabs();
  }

  async getDocUrl(productID, docId, tocItemId) {
    const pageType = this.currentPageType || 'ArticleEdit';
    const baseUrl = await this.getDocSiteOrigin();
    return `${baseUrl}/manage/${pageType}/${productID}?tocItemId=${tocItemId}`;
  }

  async getDocSiteOrigin() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(['docSiteHelperConfig'], (result) => {
        const apiUrl = result.docSiteHelperConfig?.docApiUrl;
        if (apiUrl) {
          try {
            resolve(new URL(apiUrl).origin);
          } catch (error) {
            reject(new Error(this.getText('docUrlFormatError')));
          }
          return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          try {
            resolve(new URL(tabs[0]?.url).origin);
          } catch (error) {
            reject(new Error(this.getText('apiUrlMissing')));
          }
        });
      });
    });
  }

  async copyToClipboard(text) {
    const value = String(text || '');
    if (!value) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand('copy');
        textarea.remove();
        return success;
      } catch (fallbackError) {
        console.error('复制到剪贴板失败:', fallbackError);
        return false;
      }
    }
  }
}

export default BaseComponent;
