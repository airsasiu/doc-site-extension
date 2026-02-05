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
      this.progressBar.reset();
    }
    
    this.currentOperation = { abort: false };
    const thisOperation = this.currentOperation;
    this.tabManager.clearTabs();
    
    try {
      // 显示加载状态
      this.showStatus('正在准备搜索...', 'info');
      
      const currentUrl = await URLUtils.getCurrentTabUrl();
      const productID = URLUtils.getProductIDFromURL(currentUrl);
      const pageType = URLUtils.getPageTypeFromURL(currentUrl);
      
      if (!productID) {
        throw new Error('无法获取产品ID，请确保在文档编辑页面使用此扩展');
      }

      // 显示获取文档列表状态
      this.showStatus('正在获取文档列表...', 'info');
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
      this.showStatus(`找到 ${totalCount} 个文档，开始处理...`, 'info');

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
                productID
              });
              stats.success++;
              return { success: true };
            } else {
              stats.failed++;
              return { success: false, error: '无效的文档内容' };
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
        this.showStatus(`处理完成！成功：${stats.success}，失败：${stats.failed}`, 'success');
      } else {
        // 显示取消状态
        this.showStatus('操作已取消', 'warning');
      }
      
      this.progressBar.reset();
      return results;
    } catch (error) {
      this.progressBar.reset();
      this.showError(`操作出错：${error.message}`);
      this.showStatus(`操作失败：${error.message}`, 'error');
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
    statusContainer.className = `status-message ${type}`;
    
    // 显示状态容器
    statusContainer.style.display = 'block';
    
    // 自动隐藏非错误状态消息
    if (type !== 'error') {
      clearTimeout(statusContainer._hideTimer);
      statusContainer._hideTimer = setTimeout(() => {
        statusContainer.style.display = 'none';
      }, 3000);
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