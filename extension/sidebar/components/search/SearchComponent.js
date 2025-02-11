import DocumentSearchComponent from '../base/DocumentSearchComponent.js';
import { searchInMarkdown, extractContext } from '../../utils/markdownUtils.js';

class SearchComponent extends DocumentSearchComponent {
  constructor(progressBar) {
    super(progressBar);
    this.searchInput = document.querySelector('.search-input');
    this.searchButton = document.querySelector('.search-button');
  }

  async handleSearch() {
    const searchText = this.searchInput.value.trim();
    if (!searchText) return;

    this.setLoadingState(true);
    try {
      const searchConfigs = [{
        id: 'search',
        label: '搜索结果',
        check: (content) => searchInMarkdown(content, searchText),
        getContent: (content) => extractContext(content, searchText)
      }];

      await this.performSearch(searchConfigs);
    } finally {
      this.setLoadingState(false);
    }
  }

  setLoadingState(isLoading) {
    this.searchButton.disabled = isLoading;
    this.searchButton.textContent = isLoading ? '搜索中...' : '搜索';
    this.searchInput.disabled = isLoading;
  }
}

export default SearchComponent;
