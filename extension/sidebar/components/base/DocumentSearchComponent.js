import BaseComponent from './BaseComponent.js';

class DocumentSearchComponent extends BaseComponent {
  constructor(progressBar) {
    super(progressBar);
    this.searchResults = new Map();
    this.tabHeader = document.querySelector('.tab-header');
    this.tabContent = document.querySelector('.tab-content');
    this.currentView = 'list'; // 默认列表视图
    this.markedResults = new Set(); // 存储已标记的结果
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

  getTabLabel(tabId) {
    return document.querySelector(`[data-tab-id="${tabId}"]`)?.dataset.label || tabId;
  }

  clearResults() {
    this.searchResults.clear();
    this.markedResults.clear();
    if (this.tabHeader) {
      this.tabHeader.innerHTML = '';
    }
    if (this.tabContent) {
      this.tabContent.innerHTML = '';
    }
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

    Object.entries(tree).forEach(([path, node]) => {
      const folderDiv = document.createElement('div');
      folderDiv.className = 'tree-folder';
      folderDiv.style.marginLeft = `${level * 20}px`;

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
    // 添加虚拟滚动支持
    if (results.length > 50) {
      this.renderVirtualListView(results, panel);
    } else {
      // 结果较少时使用传统渲染方式
      this.renderTraditionalListView(results, panel);
    }
  }

  // 传统渲染方式（适用于结果较少的情况）
  renderTraditionalListView(results, panel) {
    results.forEach(result => {
      const resultDiv = this.createResultItem(result);
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
          const resultDiv = this.createResultItem(result);
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
  createResultItem(result) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'result-item';
    const resultId = `${result.productID}-${result.tocItemId}`;
    
    if (this.markedResults.has(resultId)) {
      resultDiv.classList.add('marked');
    }

    resultDiv.innerHTML = `
      <div class="result-content-wrapper">
        <div class="result-title">${result.title}</div>
        <div class="result-content">${result.content}</div>
        <div class="result-path">${result.path}</div>
      </div>
      <div class="result-actions">
        <button class="mark-button">${this.markedResults.has(resultId) ? '取消标记' : '标记为已解决'}</button>
      </div>
    `;

    // 添加点击事件处理
    resultDiv.addEventListener('click', async (e) => {
      if (e.target.classList.contains('mark-button')) {
        e.stopPropagation();
        this.toggleMark(resultId, resultDiv);
      } else if (result.url) {
        await this.navigateCurrentTab(result.url);
      }
    });

    return resultDiv;
  }

  updateTypeTab(tabId, label, results) {
    if (!this.tabHeader || !this.tabContent) {
      console.error('Tab containers not found');
      return;
    }

    const existingTab = document.querySelector(`[data-tab-id="${tabId}"]`);
    if (!existingTab) {
      const button = document.createElement('button');
      button.className = 'tab-button';
      button.dataset.tabId = tabId;
      button.dataset.label = label;
      button.textContent = `${label} (${results.length})`;
      button.addEventListener('click', () => this.switchTab(tabId));
      this.tabHeader.appendChild(button);

      const panel = document.createElement('div');
      panel.className = 'tab-panel';
      panel.id = tabId;
      this.tabContent.appendChild(panel);
    } else {
      existingTab.textContent = `${label} (${results.length})`;
    }

    const panel = document.getElementById(tabId);
    if (!panel) {
      console.error(`Panel not found for tab ${tabId}`);
      return;
    }
    
    panel.innerHTML = '';

    if (this.currentView === 'tree') {
      const tree = this.buildTree(results);
      panel.appendChild(this.renderTree(tree));
    } else {
      this.renderListView(results, panel);
    }

    this.switchTab(tabId);
  }

  switchTab(tabId) {
    if (!tabId) return;
    
    const buttons = this.tabHeader.querySelectorAll('.tab-button');
    buttons.forEach(button => {
      button.classList.toggle('active', button.dataset.tabId === tabId);
    });

    const panels = this.tabContent.querySelectorAll('.tab-panel');
    panels.forEach(panel => {
      panel.classList.toggle('active', panel.id === tabId);
    });
  }

  // 切换标记状态
  toggleMark(resultId, element) {
    // 直接移除该条结果
    element.remove();
    // 更新当前标签页的结果
    const currentTab = document.querySelector('.tab-button.active');
    if (currentTab) {
      const tabId = currentTab.getAttribute('data-tab-id');
      const results = Array.from(this.searchResults.get(tabId)?.values() || [])
        .filter(r => `${r.productID}-${r.tocItemId}` !== resultId);
      this.updateTypeTab(tabId, this.getTabLabel(tabId), results);
    }
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
            content: config.getMessage ? config.getMessage(content.markdownContent) : '',
            url: this.getDocUrl(productID, item.id, item.tocItemId),
            path: item.documentPath,
            tocItemId: item.tocItemId,
            productID: productID
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