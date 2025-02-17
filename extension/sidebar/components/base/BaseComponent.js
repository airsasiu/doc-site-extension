import DocsAPI from '../../services/api.js';
import URLUtils from '../../services/urlUtils.js';
import { TabManager } from '../check/tabManager.js';

class BaseComponent {
  constructor(progressBar) {
    this.progressBar = progressBar;
    this.tabManager = new TabManager();
    this.currentOperation = null;
  }

  async processDocuments(callback) {
    if (this.currentOperation) {
      this.currentOperation.abort = true;
    }
    
    this.currentOperation = { abort: false };
    const thisOperation = this.currentOperation;
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

      for (const item of versions.toc.tocItemDrafts) {
        if (thisOperation.abort) break;
        
        if (item.id && item.hasDoc) {
          try {
            const docContent = await DocsAPI.getDocContent(item.id);
            processedCount++;
            this.progressBar.updateProgress(processedCount, totalCount);
            
            if (docContent?.markdownContent) {
              await callback({
                content: docContent,
                item,
                productID
              });
            }
          } catch (error) {
            console.error(`处理文档 ${item.id} 时出错:`, error);
          }
        }
      }
    } catch (error) {
      this.showError(`操作出错：${error.message}`);
      throw error;
    }
  }

  addResultItem(tab, result) {
    const resultElement = document.createElement('div');
    resultElement.className = 'result-item';
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
    const errorTab = this.tabManager.createTab('error', '错误');
    errorTab.innerHTML = `<div class="error">${message}</div>`;
    errorTab.classList.add('active');
  }

  clearResults() {
    this.tabManager.clearTabs();
  }

  getDocUrl(productID, docId, tocItemId) {
    return `https://docs.grapecity.com.cn/manage/ArticleEdit/${productID}?tocItemId=${tocItemId}`;
  }
}

export default BaseComponent; 