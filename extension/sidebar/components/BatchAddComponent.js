import BaseComponent from './base/BaseComponent.js';
import DocsAPI from '../services/api.js';
import URLUtils from '../services/urlUtils.js';
import { getActiveLanguage } from '../../shared/localization.js';

const TEXTS = {
  cn: {
    addPage: '添加页面',
    deletePage: '删除页面',
    searchParent: '搜索父页面:',
    parentSearchPlaceholder: '输入父页面名称进行过滤...',
    parentPage: '父页面:',
    pageNames: '页面名称列表 (换行分隔):',
    pageNamesPlaceholder: '例如:\nFVSCHEDULE\nFV\nPV\nPMT',
    searchDeletePage: '搜索要删除的页面:',
    deleteSearchPlaceholder: '输入页面名称进行过滤...',
    selectDeletePage: '选择要删除的页面 (可多选):',
    recycle: '移至回收站（可恢复）',
    permanent: '彻底删除（不可恢复）',
    deleteWarning: '警告：彻底删除操作不可恢复，请务必谨慎操作！',
    refreshTitle: '重新获取目录',
    refreshCatalog: '刷新目录',
    confirm: '确定',
    catalogRefreshed: '目录已刷新',
    productIdMissing: '无法获取产品ID',
    loadAllPagesFailed: '加载所有页面失败: {message}',
    loadParentPagesFailed: '加载父页面失败: {message}',
    selectParent: '请选择父页面',
    enterPageNames: '请输入页面名称列表',
    validPageNames: '请输入有效的页面名称列表',
    selectDeletePages: '请选择要删除的页面',
    permanentConfirm: '确定要彻底删除选中的 {count} 个页面吗？此操作不可恢复，删除后无法找回！',
    recycleConfirm: '确定要将选中的 {count} 个页面移至回收站吗？',
    batchAddFailed: '批量添加页面失败: {message}',
    batchDeleteFailed: '批量删除页面失败: {message}',
    batchResultTitle: '批量{action}结果',
    addAction: '添加',
    deleteAction: '删除',
    success: '成功',
    successAction: '成功{action}:',
    failedAction: '{action}失败:'
  },
  en: {
    addPage: 'Add pages',
    deletePage: 'Delete pages',
    searchParent: 'Search parent page:',
    parentSearchPlaceholder: 'Filter by parent page name...',
    parentPage: 'Parent page:',
    pageNames: 'Page names (one per line):',
    pageNamesPlaceholder: 'Example:\nFVSCHEDULE\nFV\nPV\nPMT',
    searchDeletePage: 'Search pages to delete:',
    deleteSearchPlaceholder: 'Filter by page name...',
    selectDeletePage: 'Select pages to delete (multiple allowed):',
    recycle: 'Move to recycle bin (recoverable)',
    permanent: 'Delete permanently (cannot be recovered)',
    deleteWarning: 'Warning: permanent deletion cannot be undone. Please be careful.',
    refreshTitle: 'Reload directory',
    refreshCatalog: 'Refresh directory',
    confirm: 'Confirm',
    catalogRefreshed: 'Directory refreshed',
    productIdMissing: 'Unable to get product ID',
    loadAllPagesFailed: 'Failed to load pages: {message}',
    loadParentPagesFailed: 'Failed to load parent pages: {message}',
    selectParent: 'Please select a parent page',
    enterPageNames: 'Please enter page names',
    validPageNames: 'Please enter valid page names',
    selectDeletePages: 'Please select pages to delete',
    permanentConfirm: 'Permanently delete the selected {count} pages? This cannot be undone.',
    recycleConfirm: 'Move the selected {count} pages to the recycle bin?',
    batchAddFailed: 'Failed to add pages: {message}',
    batchDeleteFailed: 'Failed to delete pages: {message}',
    batchResultTitle: 'Batch {action} result',
    addAction: 'add',
    deleteAction: 'delete',
    success: 'Success',
    successAction: 'Successfully {action}:',
    failedAction: '{action} failed:'
  }
};

function formatMessage(template, params = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

class BatchAddComponent extends BaseComponent {
  constructor(progressBar) {
    super(progressBar);
    this.currentTab = 'add'; // 设置默认选项卡为添加页面
    this.initContent();
  }

  t(key, params = {}) {
    const language = getActiveLanguage();
    const template = TEXTS[language]?.[key] || TEXTS.cn[key] || key;
    return formatMessage(template, params);
  }

  applyLanguage() {
    if (!this.container) {
      return;
    }

    const setText = (selector, value) => {
      const element = this.container.querySelector(selector);
      if (element) element.textContent = value;
    };

    setText('.batch-tab-btn[data-tab="add"]', this.t('addPage'));
    setText('.batch-tab-btn[data-tab="delete"]', this.t('deletePage'));
    setText('label[for="parent-page-search"]', this.t('searchParent'));
    setText('label[for="parent-page-select"]', this.t('parentPage'));
    setText('label[for="page-names"]', this.t('pageNames'));
    setText('label[for="delete-page-search"]', this.t('searchDeletePage'));
    setText('label[for="delete-page-select"]', this.t('selectDeletePage'));
    setText('label[for="delete-to-recycle"]', this.t('recycle'));
    setText('label[for="delete-permanently"]', this.t('permanent'));
    setText('.warning-text', this.t('deleteWarning'));
    setText('.batch-confirm-btn', this.t('confirm'));

    const parentSearch = this.container.querySelector('#parent-page-search');
    const pageNames = this.container.querySelector('#page-names');
    const deleteSearch = this.container.querySelector('#delete-page-search');
    const refreshBtn = this.container.querySelector('.refresh-btn');
    if (parentSearch) parentSearch.placeholder = this.t('parentSearchPlaceholder');
    if (pageNames) pageNames.placeholder = this.t('pageNamesPlaceholder');
    if (deleteSearch) deleteSearch.placeholder = this.t('deleteSearchPlaceholder');
    if (refreshBtn) {
      refreshBtn.title = this.t('refreshTitle');
      const textNode = Array.from(refreshBtn.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
      if (textNode) {
        textNode.textContent = ` ${this.t('refreshCatalog')}`;
      }
    }

    const parentSelect = this.container.querySelector('#parent-page-select option[value=""]');
    if (parentSelect) parentSelect.textContent = this.t('selectParent');
  }

  initContent() {
    // 获取页面操作tab元素
    const pageOperationsTab = document.getElementById('page-operations-tab');
    
    // 创建批量操作内容区域
    const batchOperationsContent = document.createElement('div');
    batchOperationsContent.className = 'batch-operations-content';
    batchOperationsContent.innerHTML = `
      <div class="batch-tabs">
        <button class="batch-tab-btn active" data-tab="add">${this.t('addPage')}</button>
        <button class="batch-tab-btn" data-tab="delete">${this.t('deletePage')}</button>
      </div>
      
      <!-- 批量操作内容 -->
      <div class="batch-content">
        <!-- 添加页面选项卡 -->
        <div class="batch-tab-content active" id="batch-add-tab">
          <div class="form-group">
            <label for="parent-page-search">${this.t('searchParent')}</label>
            <input type="text" id="parent-page-search" class="parent-page-search" placeholder="${this.t('parentSearchPlaceholder')}">
            <label for="parent-page-select">${this.t('parentPage')}</label>
            <select id="parent-page-select" class="parent-page-select" size="8"></select>
          </div>
          <div class="form-group">
            <label for="page-names">${this.t('pageNames')}</label>
            <textarea id="page-names" class="page-names" rows="8" placeholder="${this.t('pageNamesPlaceholder')}"></textarea>
          </div>
        </div>
        
        <!-- 删除页面选项卡 -->
        <div class="batch-tab-content" id="batch-delete-tab">
          <div class="form-group">
            <label for="delete-page-search">${this.t('searchDeletePage')}</label>
            <input type="text" id="delete-page-search" class="delete-page-search" placeholder="${this.t('deleteSearchPlaceholder')}">
            <label for="delete-page-select">${this.t('selectDeletePage')}</label>
            <select id="delete-page-select" class="delete-page-select" size="10" multiple></select>
          </div>
          <div class="form-group">
            <div class="delete-options">
              <div class="delete-option">
                <input type="radio" id="delete-to-recycle" name="delete-method" value="recycle" checked>
                <label for="delete-to-recycle">${this.t('recycle')}</label>
              </div>
              <div class="delete-option">
                <input type="radio" id="delete-permanently" name="delete-method" value="permanent">
                <label for="delete-permanently">${this.t('permanent')}</label>
              </div>
            </div>
            <p class="warning-text">${this.t('deleteWarning')}</p>
          </div>
        </div>
      </div>
      
      <!-- 进度条 -->
      <div class="batch-progress-container">
        <div class="progress-text"></div>
        <div class="progress-bar-container">
          <div class="progress-bar"></div>
        </div>
        <div class="progress-details"></div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="batch-actions">
        <button class="refresh-btn" title="${this.t('refreshTitle')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 12h20M12 2A10 10 0 1 0 12 22 10 10 0 1 0 12 2z"></path>
          </svg>
          ${this.t('refreshCatalog')}
        </button>
        <button class="batch-confirm-btn" id="action-btn">${this.t('confirm')}</button>
      </div>
      
      <!-- 结果显示区域 -->
      <div class="batch-result-container"></div>
    `;
    
    // 添加到页面操作tab中
    pageOperationsTab.appendChild(batchOperationsContent);
    
    // 保存引用
    this.container = batchOperationsContent;
    
    // 重新初始化进度条（此时元素已存在）
    this.progressBar.reInit('#page-operations-tab .batch-progress-container');
    
    // 绑定事件
    this.bindEvents();
    
    // 自动加载父页面和所有页面（自动拉取toc）
    setTimeout(async () => {
      try {
        await Promise.all([
          this.loadParentPages(),
          this.loadAllPages()
        ]);
      } catch (error) {
        console.error('自动加载toc失败:', error);
      }
    }, 500); // 延迟500ms执行，确保DOM已完全渲染
  }

  bindEvents() {
    // 绑定选项卡切换事件
    const tabBtns = this.container.querySelectorAll('.batch-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });
    
    // 绑定删除页面搜索事件
    const deleteSearchInput = this.container.querySelector('#delete-page-search');
    if (deleteSearchInput) {
      deleteSearchInput.addEventListener('input', (e) => this.handleDeletePageSearch(e));
    }
    
    // 绑定刷新目录按钮事件
    const refreshBtn = this.container.querySelector('.refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        // 清除所有缓存
        DocsAPI.clearCache();
        // 重新加载父页面和所有页面
        await Promise.all([
          this.loadParentPages(),
          this.loadAllPages()
        ]);
        // 显示刷新成功消息
        this.showResult(this.t('catalogRefreshed'), 'success');
      });
    }
    
    // 绑定确定按钮事件
    const confirmBtn = this.container.querySelector('.batch-confirm-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.handleAction());
    }
    
    // 绑定搜索事件
    this.bindSearchEvent();
  }

  // 切换选项卡
  switchTab(tabName) {
    this.currentTab = tabName;
    
    // 更新选项卡按钮状态
    const tabBtns = this.container.querySelectorAll('.batch-tab-btn');
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // 更新选项卡内容显示
    const tabContents = this.container.querySelectorAll('.batch-tab-content');
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `batch-${tabName}-tab`);
    });
  }

  // 绑定搜索事件
  bindSearchEvent() {
    // 父页面搜索事件
    const parentSearchInput = this.container.querySelector('#parent-page-search');
    if (parentSearchInput) {
      parentSearchInput.addEventListener('input', (e) => this.handleParentPageSearch(e));
    }
    
    // 删除页面搜索事件
    const deleteSearchInput = this.container.querySelector('#delete-page-search');
    if (deleteSearchInput) {
      deleteSearchInput.addEventListener('input', (e) => this.handleDeletePageSearch(e));
    }
  }

  // 加载所有页面（用于删除功能）
  async loadAllPages() {
    try {
      // 获取当前产品的文档结构
      const currentUrl = await URLUtils.getCurrentTabUrl();
      const productID = URLUtils.getProductIDFromURL(currentUrl);
      
      if (!productID) {
        throw new Error(this.t('productIdMissing'));
      }
      
      const versions = await DocsAPI.getDocVersions(productID);
      const select = this.container.querySelector('#delete-page-select');
      
      // 清空现有选项
      select.innerHTML = '';
      
      // 保存原始选项数据
      this.originalAllPages = [];
      this.collectAllPages(versions.toc.tocItemDrafts, 0);
      
      // 添加所有选项
      this.renderAllPages(this.originalAllPages);
    } catch (error) {
      console.error('加载所有页面失败:', error);
      this.showError(this.t('loadAllPagesFailed', { message: error.message }));
    }
  }

  // 收集所有页面数据（用于删除功能）
  collectAllPages(items, level) {
    items.forEach(item => {
      this.originalAllPages.push({
        id: item.id,
        text: ' '.repeat(level * 2) + item.text,
        rawText: item.text
      });
      
      // 递归收集子页面
      if (item.tocItemDrafts && item.tocItemDrafts.length > 0) {
        this.collectAllPages(item.tocItemDrafts, level + 1);
      }
    });
  }

  // 渲染所有页面选项（用于删除功能）
  renderAllPages(pages) {
    const select = this.container.querySelector('#delete-page-select');
    // 清空现有选项
    select.innerHTML = '';
    
    pages.forEach(page => {
      const option = document.createElement('option');
      option.value = page.id;
      option.textContent = page.text;
      select.appendChild(option);
    });
  }

  // 处理删除页面搜索
  handleDeletePageSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
      // 如果搜索词为空，显示所有原始选项
      this.renderAllPages(this.originalAllPages);
      return;
    }
    
    // 过滤选项
    const filteredPages = this.originalAllPages.filter(page => 
      page.rawText.toLowerCase().includes(searchTerm)
    );
    
    // 渲染过滤后的选项
    this.renderAllPages(filteredPages);
  }

  async loadParentPages() {
    try {
      // 获取当前产品的文档结构
      const currentUrl = await URLUtils.getCurrentTabUrl();
      const productID = URLUtils.getProductIDFromURL(currentUrl);
      const pageType = URLUtils.getPageTypeFromURL(currentUrl);
      
      if (!productID) {
        throw new Error(this.t('productIdMissing'));
      }
      
      const versions = await DocsAPI.getDocVersions(productID);
      const select = this.container.querySelector('#parent-page-select');
      
      // 清空现有选项
      select.innerHTML = `<option value="">${this.t('selectParent')}</option>`;
      
      // 保存原始选项数据
      this.originalParentPages = [];
      
      // 根据页面类型选择正确的 TOC 对象
      let tocData;
      if (pageType === 'DemoEdit' && versions.demoToc && versions.demoToc.tocItemDrafts) {
        tocData = versions.demoToc.tocItemDrafts;
      } else {
        // 默认使用 helpdoc 的 TOC
        tocData = versions.toc.tocItemDrafts;
      }
      
      this.collectParentPages(tocData, 0);
      
      // 添加所有选项
      this.renderParentPages(this.originalParentPages);
    } catch (error) {
      console.error('加载父页面失败:', error);
      this.showError(this.t('loadParentPagesFailed', { message: error.message }));
    }
  }

  // 收集父页面数据
  collectParentPages(items, level) {
    items.forEach(item => {
      this.originalParentPages.push({
        id: item.tocItemId,
        text: ' '.repeat(level * 2) + item.text,
        rawText: item.text
      });
      
      // 递归收集子页面
      if (item.tocItemDrafts && item.tocItemDrafts.length > 0) {
        this.collectParentPages(item.tocItemDrafts, level + 1);
      }
    });
  }

  // 渲染父页面选项
  renderParentPages(pages) {
    const select = this.container.querySelector('#parent-page-select');
    // 保留默认选项
    select.innerHTML = `<option value="">${this.t('selectParent')}</option>`;
    
    pages.forEach(page => {
      const option = document.createElement('option');
      option.value = page.id;
      option.textContent = page.text;
      select.appendChild(option);
    });
  }

  // 处理父页面搜索
  handleParentPageSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
      // 如果搜索词为空，显示所有原始选项
      this.renderParentPages(this.originalParentPages);
      return;
    }
    
    // 过滤选项
    const filteredPages = this.originalParentPages.filter(page => 
      page.rawText.toLowerCase().includes(searchTerm)
    );
    
    // 渲染过滤后的选项
    this.renderParentPages(filteredPages);
  }

  // 控制确定按钮的禁用状态
  setConfirmButtonDisabled(disabled) {
    const confirmBtn = this.container.querySelector('.batch-confirm-btn');
    if (confirmBtn) {
      confirmBtn.disabled = disabled;
      if (disabled) {
        confirmBtn.style.opacity = '0.6';
        confirmBtn.style.cursor = 'not-allowed';
      } else {
        confirmBtn.style.opacity = '1';
        confirmBtn.style.cursor = 'pointer';
      }
    }
  }

  // 主操作处理方法，根据当前选项卡处理添加或删除操作
  async handleAction() {
    // 禁用确定按钮，防止误触
    this.setConfirmButtonDisabled(true);
    
    try {
      if (this.currentTab === 'add') {
        await this.handleBatchAdd();
      } else if (this.currentTab === 'delete') {
        await this.handleBatchDelete();
      }
    } finally {
      // 无论操作成功还是失败，都启用确定按钮
      this.setConfirmButtonDisabled(false);
    }
  }

  // 批量添加页面
  async handleBatchAdd() {
    try {
      const select = this.container.querySelector('#parent-page-select');
      const pageNamesText = this.container.querySelector('#page-names').value;
      
      // 验证输入
      if (!select.value) {
        this.showResult(this.t('selectParent'), 'error');
        return;
      }
      
      if (!pageNamesText.trim()) {
        this.showResult(this.t('enterPageNames'), 'error');
        return;
      }
      
      // 解析页面名称列表
      const pageNames = pageNamesText.trim().split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);
      
      if (pageNames.length === 0) {
        this.showResult(this.t('validPageNames'), 'error');
        return;
      }
      
      // 获取当前产品信息
      const currentUrl = await URLUtils.getCurrentTabUrl();
      const productID = URLUtils.getProductIDFromURL(currentUrl);
      
      if (!productID) {
        this.showResult(this.t('productIdMissing'), 'error');
        return;
      }
      
      // 获取父页面信息
      const parentId = select.value;
      const parentOption = select.options[select.selectedIndex];
      const parentText = parentOption.textContent.trim();
      
      // 获取目录 ID
      const versions = await DocsAPI.getDocVersions(productID);
      const tocId = versions.toc.id;
      
      // 显示进度条
      this.progressBar.start(pageNames.length);
      
      // 构建请求数据并批量创建页面
      const results = [];
      
      for (let i = 0; i < pageNames.length; i++) {
        const pageName = pageNames[i];
        const displayName = pageName;
        const text = pageName.toLowerCase();
        
        // 构建文档路径
        const documentPath = this.buildDocumentPath(parentText, pageName);
        
        // 创建页面数据
        const pageData = {
          displayName,
          documentPath,
          parentId,
          text,
          tocId,
          type: 'file'
        };
        
        try {
          const result = await DocsAPI.createDocPage(pageData);
          results.push({ success: true, name: pageName, data: result });
        } catch (error) {
          results.push({ success: false, name: pageName, error: error.message });
        }
        
        // 更新进度
        this.progressBar.updateProgress(i + 1, pageNames.length);
      }
      
      // 隐藏进度条
      this.progressBar.reset();
      
      // 显示结果
      this.showBatchResult(results);
    } catch (error) {
      console.error('批量添加页面失败:', error);
      this.progressBar.reset();
      this.showResult(this.t('batchAddFailed', { message: error.message }), 'error');
    }
  }

  // 批量删除页面
  async handleBatchDelete() {
    try {
      const select = this.container.querySelector('#delete-page-select');
      
      // 获取选中的页面 ID
      const selectedOptions = Array.from(select.selectedOptions);
      const selectedPageIds = selectedOptions.map(option => option.value);
      const selectedPageNames = selectedOptions.map(option => option.textContent.trim());
      
      // 验证输入
      if (selectedPageIds.length === 0) {
        this.showResult(this.t('selectDeletePages'), 'error');
        return;
      }
      
      // 获取删除方式
      const deleteMethod = this.container.querySelector('input[name="delete-method"]:checked').value;
      const isPermanent = deleteMethod === 'permanent';
      
      // 确认删除
      const confirmMessage = isPermanent 
        ? this.t('permanentConfirm', { count: selectedPageIds.length })
        : this.t('recycleConfirm', { count: selectedPageIds.length });
        
      if (!confirm(confirmMessage)) {
        return;
      }
      
      // 显示进度条
      this.progressBar.start(selectedPageIds.length);
      
      // 批量删除页面
      const results = [];
      
      for (let i = 0; i < selectedPageIds.length; i++) {
        const pageId = selectedPageIds[i];
        const pageName = selectedPageNames[i];
        
        try {
          const result = isPermanent 
            ? await DocsAPI.permanentlyDeleteDocPage(pageId)
            : await DocsAPI.moveToRecycleBin(pageId);
          results.push({ success: true, name: pageName, data: result });
        } catch (error) {
          results.push({ success: false, name: pageName, error: error.message });
        }
        
        // 更新进度
        this.progressBar.updateProgress(i + 1, selectedPageIds.length);
      }
      
      // 隐藏进度条
      this.progressBar.reset();
      
      // 显示结果
      this.showBatchResult(results);
      
      // 重新加载页面列表
      await this.loadAllPages();
    } catch (error) {
      console.error('批量删除页面失败:', error);
      this.progressBar.reset();
      this.showResult(this.t('batchDeleteFailed', { message: error.message }), 'error');
    }
  }

  buildDocumentPath(parentText, pageName) {
    // 移除缩进并构建路径
    const parentPath = parentText.replace(/^\s+/g, '').replace(/\s+/g, '-').toLowerCase();
    const pagePath = pageName.replace(/\s+/g, '-').toLowerCase();
    return `/${parentPath}/${pagePath}`;
  }

  // 显示结果信息
  showResult(message, type) {
    const existingResult = this.container.querySelector('.batch-result-item');
    const resultContainer = this.container.querySelector('.batch-result-container');
    const renderResult = () => {
      const resultDiv = document.createElement('div');
      resultDiv.className = `batch-result-item ${type} motion-leave`;
      resultDiv.innerHTML = message;
      resultContainer.appendChild(resultDiv);

      setTimeout(() => {
        if (resultDiv.parentNode) {
          resultDiv.classList.add('is-leaving');
          setTimeout(() => {
            if (resultDiv.parentNode) {
              resultDiv.remove();
            }
          }, 160);
        }
      }, 3000);
    };

    if (existingResult) {
      existingResult.classList.add('is-leaving');
      setTimeout(() => {
        if (existingResult.parentNode) {
          existingResult.remove();
        }
        renderResult();
      }, 160);
      return;
    }

    renderResult();
  }
  
  showBatchResult(results) {
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    const action = this.currentTab === 'add' ? this.t('addAction') : this.t('deleteAction');
    
    let resultHtml = `
      <h4>${this.t('batchResultTitle', { action })}</h4>
      <p>${this.t('success')}: ${successCount}/${totalCount}</p>
    `;
    
    // 添加详细结果
    resultHtml += '<div style="margin-top: 10px;">';
    
    // 成功的结果
    const successResults = results.filter(r => r.success);
    if (successResults.length > 0) {
      resultHtml += `<h5>${this.t('successAction', { action })}</h5><ul>`;
      successResults.forEach(r => {
        resultHtml += `<li style="color: #155724;">${r.name}</li>`;
      });
      resultHtml += '</ul>';
    }
    
    // 失败的结果
    const errorResults = results.filter(r => !r.success);
    if (errorResults.length > 0) {
      resultHtml += `<h5>${this.t('failedAction', { action })}</h5><ul>`;
      errorResults.forEach(r => {
        resultHtml += `<li style="color: #721c24;">${r.name}: ${r.error}</li>`;
      });
      resultHtml += '</ul>';
    }
    
    resultHtml += '</div>';
    
    // 显示结果
    this.showResult(resultHtml, successCount === totalCount ? 'success' : 'error');
    
    // 如果所有操作都成功，并且是添加或删除操作，刷新页面
    if (successCount === totalCount) {
      setTimeout(async () => {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.reload(tabs[0].id);
      }, 1000); // 延迟1秒刷新，让用户有时间看到结果
    }
  }
}

export default BatchAddComponent;
