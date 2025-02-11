import DocsAPI from '../../services/api.js';
import URLUtils from '../../services/urlUtils.js';
import { CHECK_ITEMS } from './checkItems.js';
import { TabManager } from './tabManager.js';

class CheckComponent {
  constructor(progressBar) {
    this.progressBar = progressBar;
    this.tabManager = new TabManager();
    this.checkResults = new Map(); // 存储不同类型的检查结果
    this.currentSearch = null;
  }

  async handleCheck() {
    const button = document.querySelector('.routine-check-button');
    button.disabled = true;
    button.textContent = '检查中...';

    try {
      await this.performRoutineCheck();
    } finally {
      button.disabled = false;
      button.textContent = '常规检查';
    }
  }

  async performRoutineCheck() {
    if (this.currentSearch) {
      this.currentSearch.abort = true;
    }
    
    this.currentSearch = { abort: false };
    const thisSearch = this.currentSearch;
    this.tabManager.clearTabs();
    
    try {
      const currentUrl = await URLUtils.getCurrentTabUrl();
      const productID = URLUtils.getProductIDFromURL(currentUrl);
      
      if (!productID) {
        throw new Error('无法获取产品ID');
      }

      const versions = await DocsAPI.getDocVersions(productID);
      let processedCount = 0;
      const totalCount = versions.toc.tocItemDrafts.length;
      
      this.progressBar.updateProgress(processedCount, totalCount);

      Object.keys(CHECK_ITEMS).forEach(key => {
        this.checkResults.set(key, new Map());
      });

      for (const item of versions.toc.tocItemDrafts) {
        if (thisSearch.abort) break;

        try {
          const docContent = await DocsAPI.getDocContent(item.id);
          
          if (docContent?.markdownContent) {
            Object.entries(CHECK_ITEMS).forEach(([key, config]) => {
              if (config.check(docContent.markdownContent)) {
                const result = {
                  docId: item.id,
                  title: item.title || docContent.title,
                  message: typeof config.message === 'function' ? 
                    config.message(docContent.markdownContent) : config.message,
                  url: `https://docs.grapecity.com.cn/documentsite/#/ArticleEdit/${productID}/${item.id}`,
                  productID,
                  tocItemId: item.tocItemId
                };
                
                const typeResults = this.checkResults.get(key);
                const resultId = `${item.id}-${key}`;
                if (!typeResults.has(resultId)) {
                  typeResults.set(resultId, result);
                  this.updateTypeTab(key, Array.from(typeResults.values()));
                }
              }
            });
          } else {
            console.warn(`文档 ${item.id} 的 markdown 内容为空`);
          }
        } catch (error) {
          console.error(`检查文档 ${item.id} 时出错:`, error);
        }

        processedCount++;
        this.progressBar.updateProgress(processedCount, totalCount);
      }

      this.updateRecheckButton();
    } catch (error) {
      console.error('执行常规检查时出错:', error);
      throw error;
    }
  }

  updateTypeTab(checkType, results) {
    if (results.length === 0) return;

    const tab = this.tabManager.getTab(checkType) || 
      this.tabManager.createTab(checkType, CHECK_ITEMS[checkType].name);

    tab.innerHTML = '';
    
    const statsDiv = document.createElement('div');
    statsDiv.className = 'type-stats';
    statsDiv.textContent = `发现 ${results.length} 个问题`;
    tab.appendChild(statsDiv);

    results.forEach(result => {
      const resultElement = document.createElement('div');
      resultElement.className = 'check-result-item';
      resultElement.innerHTML = `
        <h3>${result.title}</h3>
        <div class="result-message">${result.message}</div>
        <a href="${result.url}" target="_blank">查看文档</a>
      `;
      tab.appendChild(resultElement);
    });
  }

  updateRecheckButton() {
    let totalIssues = 0;
    let uniquePages = new Set();
    
    this.checkResults.forEach(typeResults => {
      typeResults.forEach(result => {
        totalIssues++;
        uniquePages.add(result.docId);
      });
    });

    const button = document.querySelector('.recheck-button');
    const stats = document.querySelector('.recheck-stats');
    
    button.textContent = `重新检查错误页面 (${uniquePages.size})`;
    button.disabled = uniquePages.size === 0;
    
    if (uniquePages.size > 0) {
      stats.textContent = `共 ${uniquePages.size} 个页面，${totalIssues} 个问题`;
    } else {
      stats.textContent = '';
    }
  }

  async recheckErrorPages() {
    const button = document.querySelector('.recheck-button');
    button.disabled = true;
    button.textContent = '重新检查中...';

    try {
      if (this.currentSearch) {
        this.currentSearch.abort = true;
      }

      this.currentSearch = { abort: false };
      const thisSearch = this.currentSearch;

      const errorPages = Array.from(this.checkResults.values());
      let processedCount = 0;
      const totalCount = errorPages.length;

      this.progressBar.updateProgress(processedCount, totalCount);
      this.checkResults.clear();

      for (const result of errorPages) {
        if (thisSearch.abort) break;

        try {
          const docContent = await DocsAPI.getDocContent(result.docId);
          if (docContent?.content) {
            const errors = this.checkDocument(docContent.content);
            if (errors.length > 0) {
              this.addErrorResult({
                docId: result.docId,
                title: result.title,
                errors,
                url: result.url
              });
            }
          }
          processedCount++;
          this.progressBar.updateProgress(processedCount, totalCount);
        } catch (error) {
          console.error(`重新检查文档 ${result.docId} 时出错:`, error);
        }
      }

      this.updateRecheckButton();
    } finally {
      button.disabled = false;
      button.textContent = '重新检查错误页面';
    }
  }

  clearResults() {
    this.checkResults.clear();
    this.tabManager.clearTabs();
    this.updateRecheckButton();
  }
}

export default CheckComponent;
