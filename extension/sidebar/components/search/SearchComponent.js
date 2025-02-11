import DocsAPI from '../../services/api.js';
import URLUtils from '../../services/urlUtils.js';
import { searchInMarkdown, extractContext } from '../../utils/markdownUtils.js';
import { TabManager } from '../check/tabManager.js';

class SearchComponent {
  constructor(progressBar) {
    this.progressBar = progressBar;
    this.tabManager = new TabManager();
    this.searchInput = document.querySelector('.search-input');
    this.searchButton = document.querySelector('.search-button');
    this.currentSearch = null;
  }

  async handleSearch() {
    const searchText = this.searchInput.value.trim();
    if (!searchText) return;

    this.setLoadingState(true);
    try {
      await this.performSearch(searchText);
    } finally {
      this.setLoadingState(false);
    }
  }

  async performSearch(searchText) {
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
      
      // 创建搜索结果的标签页
      const searchTab = this.tabManager.createTab('search', '搜索结果');
      searchTab.classList.add('active');

      let matchCount = 0;

      for (const item of versions.toc.tocItemDrafts) {
        if (thisSearch.abort) break;
        
        if (item.id && item.hasDoc) {
          try {
            const docContent = await DocsAPI.getDocContent(item.id);
            processedCount++;
            this.progressBar.updateProgress(processedCount, totalCount);
            
            if (docContent?.markdownContent) {
              if (searchInMarkdown(docContent.markdownContent, searchText)) {
                this.addSearchResult(searchTab, {
                  title: docContent.title || item.text || item.displayName,
                  content: extractContext(docContent.markdownContent, searchText),
                  url: `https://docs.grapecity.com.cn/documentsite/#/ArticleEdit/${productID}/${item.id}`,
                  productID,
                  tocItemId: item.tocItemId
                });
                matchCount++;
              }
            }
          } catch (error) {
            console.error(`处理文档 ${item.id} 时出错:`, error);
          }
        }
      }

      // 更新搜索统计
      const statsElement = document.createElement('div');
      statsElement.className = 'search-stats';
      statsElement.textContent = `共找到 ${matchCount} 个匹配结果`;
      searchTab.insertBefore(statsElement, searchTab.firstChild);

    } catch (error) {
      this.showError(`搜索出错：${error.message}`);
    }
  }

  addSearchResult(tab, result) {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    
    resultItem.innerHTML = `
      <div class="result-title">${result.title}</div>
      <div class="result-content">${result.content}</div>
      <a href="${result.url}" target="_blank">查看文档</a>
    `;
    
    tab.appendChild(resultItem);
  }

  setLoadingState(isLoading) {
    this.searchButton.disabled = isLoading;
    this.searchButton.textContent = isLoading ? '搜索中...' : '搜索';
    this.searchInput.disabled = isLoading;
  }

  showError(message) {
    const errorTab = this.tabManager.createTab('error', '错误');
    errorTab.innerHTML = `<div class="error">${message}</div>`;
    errorTab.classList.add('active');
  }

  clearResults() {
    this.tabManager.clearTabs();
  }
}

export default SearchComponent;
