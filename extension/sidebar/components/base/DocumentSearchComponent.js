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
    return document.querySelector(`[data-tab-id="${tabId}"]`)?.textContent || tabId;
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
    results.forEach(result => {
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

      panel.appendChild(resultDiv);
    });
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
      const tabId = currentTab.getAttribute('data-tab');
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
            content: config.getContent ? config.getContent(content.markdownContent) : '',
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