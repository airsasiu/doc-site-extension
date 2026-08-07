import DocumentSearchComponent from '../base/DocumentSearchComponent.js';
import { buildCheckItems } from './checkItems.js';
import { getActiveLanguage } from '../../../shared/localization.js';

const TEXTS = {
  cn: {
    checking: '检查中...',
    routineCheck: '常规检查',
    recheck: '重新检查错误页面 ({count})'
  },
  en: {
    checking: 'Checking...',
    routineCheck: 'Routine check',
    recheck: 'Recheck error pages ({count})'
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

class CheckComponent extends DocumentSearchComponent {
  constructor(progressBar) {
    super(progressBar);
  }

  async handleCheck() {
    const button = document.querySelector('.routine-check-button');
    this.collapseSidebarForWork();
    button.disabled = true;
    button.textContent = t('checking');

    try {
      const customRules = await this.loadCustomCheckRules();
      const checkItems = buildCheckItems(customRules);
      const searchConfigs = Object.entries(checkItems).map(([key, config]) => ({
        id: key,
        label: config.name,
        check: config.check,
        getMessage: typeof config.message === 'function' ? config.message : () => config.message
      }));

      await this.performSearch(searchConfigs);
      this.updateRecheckButton();
    } finally {
      button.disabled = false;
      button.textContent = t('routineCheck');
    }
  }

  async loadCustomCheckRules() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['docSiteHelperConfig'], (result) => {
        const rules = result.docSiteHelperConfig?.customCheckRules;
        resolve(Array.isArray(rules) ? rules.filter(rule => rule?.enabled !== false) : []);
      });
    });
  }

  updateRecheckButton() {
    const totalErrors = Array.from(this.searchResults.values())
      .reduce((sum, results) => sum + results.size, 0);
    
    const button = document.querySelector('.recheck-button');
    if (!button) {
      return;
    }
    button.textContent = t('recheck', { count: totalErrors });
    button.disabled = totalErrors === 0;
  }
}

export default CheckComponent;
