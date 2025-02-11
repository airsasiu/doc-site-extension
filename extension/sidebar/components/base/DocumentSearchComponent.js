import BaseComponent from './BaseComponent.js';

class DocumentSearchComponent extends BaseComponent {
  constructor(progressBar) {
    super(progressBar);
    this.searchResults = new Map();
  }

  // 核心搜索方法
  async performSearch(searchConfigs) {
    this.searchResults.clear();
    // 初始化每个搜索配置的结果集
    searchConfigs.forEach(config => {
      this.searchResults.set(config.id, new Map());
    });

    await this.processDocuments(async ({ content, item, productID }) => {
      searchConfigs.forEach(config => {
        if (config.check(content.markdownContent)) {
          const result = {
            title: content.title || item.text || item.displayName,
            message: config.getMessage ? config.getMessage(content.markdownContent) : '',
            content: config.getContent ? config.getContent(content.markdownContent) : '',
            url: this.getDocUrl(productID, item.id, item.tocItemId)
          };
          
          const typeResults = this.searchResults.get(config.id);
          const resultId = `${item.id}-${config.id}`;
          if (!typeResults.has(resultId)) {
            typeResults.set(resultId, result);
            this.updateTypeTab(config.id, config.label, Array.from(typeResults.values()));
          }
        }
      });
    });
  }

  updateTypeTab(searchId, label, results) {
    if (results.length === 0) return;

    const tab = this.tabManager.getTab(searchId) || 
      this.tabManager.createTab(searchId, label, results.length);

    tab.innerHTML = '';
    results.forEach(result => this.addResultItem(tab, result));
  }

  clearResults() {
    this.searchResults.clear();
    this.tabManager.clearTabs();
  }
}

export default DocumentSearchComponent; 