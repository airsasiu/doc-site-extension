import DocumentSearchComponent from '../base/DocumentSearchComponent.js';
import { CHECK_ITEMS } from './checkItems.js';

class CheckComponent extends DocumentSearchComponent {
  constructor(progressBar) {
    super(progressBar);
  }

  async handleCheck() {
    const button = document.querySelector('.routine-check-button');
    button.disabled = true;
    button.textContent = '检查中...';

    try {
      const searchConfigs = Object.entries(CHECK_ITEMS).map(([key, config]) => ({
        id: key,
        label: config.name,
        check: config.check,
        getMessage: typeof config.message === 'function' ? config.message : () => config.message
      }));

      await this.performSearch(searchConfigs);
      this.updateRecheckButton();
    } finally {
      button.disabled = false;
      button.textContent = '常规检查';
    }
  }

  updateRecheckButton() {
    const totalErrors = Array.from(this.searchResults.values())
      .reduce((sum, results) => sum + results.size, 0);
    
    const button = document.querySelector('.recheck-button');
    button.textContent = `重新检查错误页面 (${totalErrors})`;
    button.disabled = totalErrors === 0;
  }
}

export default CheckComponent;
