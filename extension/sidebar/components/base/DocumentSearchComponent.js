import BaseComponent from './BaseComponent.js';
import { getActiveLanguage } from '../../../shared/localization.js';

const TEXTS = {
  cn: {
    resultTypeLabel: '结果类型',
    summary: '{types} 类 / {items} 项',
    ungrouped: '未分组',
    markResolved: '标记为已解决',
    unmarkResolved: '取消标记',
    matched: '命中 {count} 处'
  },
  en: {
    resultTypeLabel: 'Result type',
    summary: '{types} types / {items} items',
    ungrouped: 'Ungrouped',
    markResolved: 'Mark as resolved',
    unmarkResolved: 'Unmark',
    matched: '{count} matches'
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

class DocumentSearchComponent extends BaseComponent {
  constructor(progressBar) {
    super(progressBar);
    this.searchResults = new Map();
    this.totalResults = new Map(); // 存储每个标签的原始结果总数
    this.tabModes = new Map();
    this.tabHeader = document.querySelector('.tab-header');
    this.tabContent = document.querySelector('.tab-content');
    this.currentView = 'list'; // 默认列表视图
    this.markedResults = new Set(); // 存储已标记的结果
    this.tabLabels = new Map();
    this.initViewToggle();
  }

  initViewToggle() {
    const viewButtons = document.querySelectorAll('.view-toggle-btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentView = btn.dataset.view;
        // 重新渲染当前结果
        this.searchResults.forEach((results, tabId) => {
          this.updateTypeTab(tabId, this.getTabLabel(tabId), Array.from(results.values()));
        });
      });
    });
  }

  decorateMotion(element, enterOrder = 0) {
    if (!element) {
      return element;
    }

    element.classList.add('motion-leave');
    element.style.setProperty('--enter-order', String(enterOrder));
    return element;
  }

  getTabLabel(tabId) {
    return this.tabLabels.get(tabId) || tabId;
  }

  clearResults() {
    this.searchResults.clear();
    this.totalResults.clear(); // 清除原始结果总数
    this.markedResults.clear();
    this.tabLabels.clear();
    this.tabModes.clear();
    if (this.tabHeader) {
      this.tabHeader.innerHTML = '';
    }
    if (this.tabContent) {
      this.tabContent.innerHTML = '';
    }
  }

  ensureTabPicker() {
    if (!this.tabHeader) return null;

    let select = this.tabHeader.querySelector('.tab-select');
    if (select) {
      return select;
    }

    this.tabHeader.innerHTML = '';

    select = document.createElement('select');
    select.className = 'tab-select';
    select.setAttribute('aria-label', t('resultTypeLabel'));
    select.addEventListener('change', () => this.switchTab(select.value));

    const summary = document.createElement('span');
    summary.className = 'tab-summary';

    this.tabHeader.appendChild(select);
    this.tabHeader.appendChild(summary);
    return select;
  }

  updateTabPickerSummary() {
    const summary = this.tabHeader?.querySelector('.tab-summary');
    const select = this.tabHeader?.querySelector('.tab-select');
    if (!summary || !select) return;

    const totalTypes = select.options.length;
    const totalRemaining = Array.from(this.searchResults.values())
      .reduce((sum, results) => sum + results.size, 0);
    summary.textContent = t('summary', { types: totalTypes, items: totalRemaining });
  }

  getGroupPath(path = '') {
    const parts = path.split('/').filter(Boolean);
    if (parts.length <= 1) {
      return path || t('ungrouped');
    }
    return `/${parts.slice(0, -1).join('/')}`;
  }

  renderGroupedView(results, panel) {
    const groups = new Map();
    results.forEach(result => {
      const groupPath = this.getGroupPath(result.documentPath || result.path);
      if (!groups.has(groupPath)) {
        groups.set(groupPath, []);
      }
      groups.get(groupPath).push(result);
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'path-group-list';

    Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([groupPath, groupResults], groupIndex) => {
        const group = document.createElement('section');
        group.className = 'path-group';
        this.decorateMotion(group, groupIndex);

        const header = document.createElement('div');
        header.className = 'path-group-header';

        const title = document.createElement('div');
        title.className = 'path-group-title';
        title.textContent = groupPath;
        title.title = groupPath;

        const count = document.createElement('span');
        count.className = 'path-group-count';
        count.textContent = `${groupResults.length}`;

        const items = document.createElement('div');
        items.className = 'path-group-results';
        groupResults.forEach((result, resultIndex) => {
          items.appendChild(this.createResultItem(result, groupIndex * 100 + resultIndex));
        });

        header.appendChild(title);
        header.appendChild(count);
        group.appendChild(header);
        group.appendChild(items);
        wrapper.appendChild(group);
      });

    panel.appendChild(wrapper);
  }

  // 构建树形结构
  buildTree(results) {
    const tree = {};
    results.forEach(result => {
      const pathParts = result.path.split('/').filter(Boolean);
      let currentLevel = tree;
      
      pathParts.forEach((part, index) => {
        if (!currentLevel[part]) {
          currentLevel[part] = {
            items: [],
            children: {}
          };
        }
        if (index === pathParts.length - 1) {
          currentLevel[part].items.push(result);
        }
        currentLevel = currentLevel[part].children;
      });
    });
    return tree;
  }

  // 渲染树形结构
  renderTree(tree, level = 0) {
    const container = document.createElement('div');
    container.className = 'tree-container';

    Object.entries(tree).forEach(([path, node], index) => {
      const folderDiv = document.createElement('div');
      folderDiv.className = 'tree-folder';
      folderDiv.style.marginLeft = `${level * 20}px`;
      this.decorateMotion(folderDiv, level + index);

      const headerDiv = document.createElement('div');
      headerDiv.className = 'tree-folder-header';
      
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'tree-toggle';
      toggleBtn.textContent = '▼';
      
      const pathSpan = document.createElement('span');
      pathSpan.textContent = path;
      pathSpan.className = 'tree-folder-name';

      const countSpan = document.createElement('span');
      countSpan.className = 'tree-count';
      countSpan.textContent = `(${node.items.length})`;

      headerDiv.appendChild(toggleBtn);
      headerDiv.appendChild(pathSpan);
      headerDiv.appendChild(countSpan);
      folderDiv.appendChild(headerDiv);

      const contentDiv = document.createElement('div');
      contentDiv.className = 'tree-folder-content';

      // 渲染当前路径下的结果
      if (node.items.length > 0) {
        node.items.forEach(result => {
          const resultDiv = document.createElement('div');
          resultDiv.className = 'result-item';
          this.decorateMotion(resultDiv, index);
          resultDiv.innerHTML = `
            <div class="result-title">${result.title}</div>
            <div class="result-content">${result.content}</div>
          `;
          resultDiv.addEventListener('click', async () => {
            if (result.url) {
              await this.navigateCurrentTab(result.url);
            }
          });
          contentDiv.appendChild(resultDiv);
        });
      }

      // 递归渲染子文件夹
      if (Object.keys(node.children).length > 0) {
        contentDiv.appendChild(this.renderTree(node.children, level + 1));
      }

      folderDiv.appendChild(contentDiv);
      container.appendChild(folderDiv);

      // 添加折叠/展开功能
      toggleBtn.addEventListener('click', () => {
        contentDiv.style.display = contentDiv.style.display === 'none' ? 'block' : 'none';
        toggleBtn.textContent = contentDiv.style.display === 'none' ? '▶' : '▼';
      });
    });

    return container;
  }

  // 渲染列表视图
  renderListView(results, panel) {
    panel.classList.remove('virtual-scroll-container');
    panel.style.overflow = '';
    panel.style.position = '';
    this.renderTraditionalListView(results, panel);
  }

  // 传统渲染方式（适用于结果较少的情况）
  renderTraditionalListView(results, panel) {
    results.forEach((result, index) => {
      const resultDiv = this.createResultItem(result, index);
      panel.appendChild(resultDiv);
    });
  }

  // 虚拟滚动渲染方式（适用于结果较多的情况）
  renderVirtualListView(results, panel) {
    // 清空面板
    panel.innerHTML = '';
    
    // 虚拟滚动容器设置
    panel.style.overflow = 'auto';
    panel.style.position = 'relative';
    panel.classList.add('virtual-scroll-container');
    
    // 估算每个结果项的高度（用于虚拟滚动计算）
    const ITEM_HEIGHT = 150;
    
    // 创建虚拟滚动的内容容器
    const contentContainer = document.createElement('div');
    contentContainer.className = 'virtual-content-container';
    contentContainer.style.height = `${results.length * ITEM_HEIGHT}px`;
    contentContainer.style.position = 'relative';
    panel.appendChild(contentContainer);
    
    // 创建可见区域容器
    const visibleContainer = document.createElement('div');
    visibleContainer.className = 'virtual-visible-container';
    visibleContainer.style.position = 'absolute';
    visibleContainer.style.top = '0';
    visibleContainer.style.left = '0';
    visibleContainer.style.width = '100%';
    contentContainer.appendChild(visibleContainer);
    
    // 存储当前可见的结果项
    const visibleItems = new Map();
    
    // 渲染可见区域内的结果项
    const renderVisibleItems = () => {
      const scrollTop = panel.scrollTop;
      const containerHeight = panel.clientHeight;
      
      // 计算可见区域的起始和结束索引
      const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 5);
      const endIndex = Math.min(results.length - 1, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + 5);
      
      // 移除不在可见区域内的元素
      visibleItems.forEach((item, index) => {
        if (index < startIndex || index > endIndex) {
          item.remove();
          visibleItems.delete(index);
        }
      });
      
      // 渲染可见区域内的元素
      for (let i = startIndex; i <= endIndex; i++) {
        if (!visibleItems.has(i)) {
          const result = results[i];
          const resultDiv = this.createResultItem(result, i);
          resultDiv.style.position = 'absolute';
          resultDiv.style.top = `${i * ITEM_HEIGHT}px`;
          resultDiv.style.left = '0';
          resultDiv.style.width = '100%';
          visibleContainer.appendChild(resultDiv);
          visibleItems.set(i, resultDiv);
        }
      }
      
      // 更新可见容器的位置
      visibleContainer.style.transform = `translateY(${startIndex * ITEM_HEIGHT}px)`;
    };
    
    // 初始化渲染
    renderVisibleItems();
    
    // 添加滚动事件监听
    panel.addEventListener('scroll', renderVisibleItems);
    
    // 存储引用，以便后续清理
    panel._virtualScrollState = {
      results,
      renderVisibleItems,
      visibleItems
    };
  }

  // 创建单个结果项元素
  createResultItem(result, enterOrder = 0) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'result-item';
    this.decorateMotion(resultDiv, enterOrder);
    const resultId = `${result.itemId}-${result.configId}`;
    const isCopyLink = result.actionType === 'copy-link';
    
    if (this.markedResults.has(resultId)) {
      resultDiv.classList.add('marked');
    }

    resultDiv.innerHTML = `
      <div class="result-content-wrapper">
          <div class="result-title-row">
          <div class="result-title">${result.title}</div>
          ${Number.isFinite(result.matchCount) ? `<span class="result-match-count">${t('matched', { count: result.matchCount })}</span>` : ''}
        </div>
        <div class="result-content">${result.content}</div>
        <div class="result-path">${result.path}</div>
      </div>
      <div class="result-actions">
        <button class="mark-button${isCopyLink ? ' copy-link-button' : ''}" type="button">${isCopyLink ? this.getText('copyLink') : (this.markedResults.has(resultId) ? t('unmarkResolved') : t('markResolved'))}</button>
      </div>
    `;

    // 添加点击事件处理
    resultDiv.addEventListener('click', async (e) => {
      if (e.target.classList.contains('mark-button')) {
        e.stopPropagation();
        if (isCopyLink) {
          await this.handleCopyResultLink(result.url);
          return;
        }
        this.toggleMark(resultId, resultDiv);
      } else if (result.url) {
        await this.navigateCurrentTab(result.url);
      }
    });

    return resultDiv;
  }

  // 根据完成百分比获取颜色
  getProgressColor(completed, total) {
    const percentage = total > 0 ? completed / total : 0;
    
    // 从红色 (255, 0, 0) 到绿色 (0, 255, 0) 的渐变
    const r = Math.floor(255 * (1 - percentage));
    const g = Math.floor(255 * percentage);
    const b = 0;
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  updateTypeTab(tabId, label, results, options = {}) {
    if (!this.tabHeader || !this.tabContent) {
      console.error('Tab containers not found');
      return;
    }

    const mode = options.mode || this.tabModes.get(tabId) || 'progress';
    this.tabModes.set(tabId, mode);

    // 计算已解决数量和总数
    const total = this.totalResults.get(tabId) || 0;
    const remaining = results.length;
    const completed = total - remaining;
    this.tabLabels.set(tabId, label);
    const select = this.ensureTabPicker();
    const existingTab = Array.from(select.options)
      .find(option => option.value === tabId);
    
    if (!existingTab) {
      const option = document.createElement('option');
      option.value = tabId;
      option.dataset.label = label;
      option.textContent = mode === 'lookup'
        ? `${label} (${remaining})`
        : `${label} (${completed} / ${total})`;
      select.appendChild(option);

      const panel = document.createElement('div');
      panel.className = 'tab-panel';
      panel.id = tabId;
      this.tabContent.appendChild(panel);

      // 只有新创建的标签页才默认激活，且只有第一个标签页才自动激活
      const totalTabs = select.options.length;
      if (totalTabs === 1) {
        this.switchTab(tabId);
      }
    } else {
      existingTab.textContent = mode === 'lookup'
        ? `${label} (${remaining})`
        : `${label} (${completed} / ${total})`;
    }

    const tabOption = existingTab || Array.from(select.options)
      .find(option => option.value === tabId);
    if (tabOption) {
      tabOption.style.color = mode === 'lookup'
        ? 'var(--accent-strong)'
        : this.getProgressColor(completed, total);
    }
    this.updateTabPickerSummary();

    const panel = document.getElementById(tabId);
    if (!panel) {
      console.error(`Panel not found for tab ${tabId}`);
      return;
    }
    
    panel.innerHTML = '';

    if (mode === 'lookup' && results.length === 0) {
      panel.innerHTML = `<div class="no-results">${options.emptyMessage || 'No results'}</div>`;
      return;
    }

    if (this.currentView === 'tree') {
      this.renderGroupedView(results, panel);
    } else {
      this.renderListView(results, panel);
    }
  }

  switchTab(tabId) {
    if (!tabId) return;
    
    const select = this.tabHeader?.querySelector('.tab-select');
    if (select && select.value !== tabId) {
      select.value = tabId;
    }

    const panels = this.tabContent.querySelectorAll('.tab-panel');
    panels.forEach(panel => {
      panel.classList.toggle('active', panel.id === tabId);
    });
  }

  // 切换标记状态
  toggleMark(resultId, element) {
    // 更新当前标签页的结果
    const currentTab = this.tabHeader?.querySelector('.tab-select');
    if (currentTab?.value) {
      const tabId = currentTab.value;
      const typeResults = this.searchResults.get(tabId);
      
      if (typeResults) {
        // 更新标记集合
        if (this.markedResults.has(resultId)) {
          this.markedResults.delete(resultId);
        } else {
          this.markedResults.add(resultId);
        }

        if (element) {
          element.classList.add('is-leaving');
        }

        window.setTimeout(() => {
          typeResults.delete(resultId);

          // 更新标签页显示
          const label = this.getTabLabel(tabId);
          this.updateTypeTab(tabId, label, Array.from(typeResults.values()));
        }, 160);
      }
    }
  }

  async handleCopyResultLink(url) {
    if (!url) {
      return;
    }

    const copied = await this.copyToClipboard(url);
    if (copied) {
      this.showStatus(this.getText('linkCopied'), 'success');
    } else {
      this.showStatus(this.getText('copyFailed', { message: 'clipboard unavailable' }), 'error');
    }
  }

  // 核心搜索方法
  async performSearch(searchConfigs) {
    this.clearResults();
    
    // 初始化结果集和计数器
    searchConfigs.forEach(config => {
      this.searchResults.set(config.id, new Map());
      this.totalResults.set(config.id, 0); // 初始化原始结果总数为 0
    });

    // 直接处理文档，实时更新结果和 UI
    await this.processDocuments(async ({ content, item, productID }) => {
      for (const config of searchConfigs) {
        if (config.check(content.markdownContent)) {
          // 增加原始结果总数计数（不管是否已标记）
          const currentTotal = this.totalResults.get(config.id) || 0;
          this.totalResults.set(config.id, currentTotal + 1);
          
          // 创建结果对象
          const result = {
            title: content.title || item.text || item.displayName,
            message: config.getMessage ? config.getMessage(content.markdownContent) : '',
            content: config.getContent
              ? config.getContent(content.markdownContent)
              : (config.getMessage ? config.getMessage(content.markdownContent) : ''),
            url: await this.getDocUrl(productID, item.id, item.tocItemId),
            path: item.documentPath,
            tocItemId: item.tocItemId,
            productID: productID,
            itemId: item.id,
            configId: config.id,
            actionType: config.actionType || 'mark'
          };
          if (typeof config.getMatchCount === 'function') {
            result.matchCount = config.getMatchCount(content.markdownContent);
          }
          
          // 检查是否已标记为已解决
          const resultId = `${result.itemId}-${result.configId}`;
          if (!this.markedResults.has(resultId)) {
            // 将结果添加到结果集中
            const typeResults = this.searchResults.get(config.id);
            typeResults.set(resultId, result);
            
            // 实时更新标签页显示
            this.updateTypeTab(config.id, config.label, Array.from(typeResults.values()), {
              mode: config.mode || 'progress'
            });
          }
        }
      }
    });
  }

  // 添加一个新方法用于在当前标签页导航
  async navigateCurrentTab(url) {
    if (!url) return;
    
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        await chrome.tabs.update(tabs[0].id, { url: url });
      }
    } catch (error) {
      console.error('导航错误:', error);
    }
  }
}

export default DocumentSearchComponent;
