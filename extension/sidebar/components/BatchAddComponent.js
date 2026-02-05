import BaseComponent from './base/BaseComponent.js';
import DocsAPI from '../services/api.js';

class BatchAddComponent extends BaseComponent {
  constructor(progressBar) {
    super(progressBar);
    this.currentTab = 'add'; // 设置默认选项卡为添加页面
    this.initContent();
  }

  initContent() {
    // 获取页面操作tab元素
    const pageOperationsTab = document.getElementById('page-operations-tab');
    
    // 创建批量操作内容区域
    const batchOperationsContent = document.createElement('div');
    batchOperationsContent.className = 'batch-operations-content';
    batchOperationsContent.innerHTML = `
      <div class="batch-tabs">
        <button class="batch-tab-btn active" data-tab="add">添加页面</button>
        <button class="batch-tab-btn" data-tab="delete">删除页面</button>
      </div>
      
      <!-- 批量操作内容 -->
      <div class="batch-content">
        <!-- 添加页面选项卡 -->
        <div class="batch-tab-content active" id="batch-add-tab">
          <div class="form-group">
            <label for="parent-page-search">搜索父页面:</label>
            <input type="text" id="parent-page-search" class="parent-page-search" placeholder="输入父页面名称进行过滤...">
            <label for="parent-page-select">父页面:</label>
            <select id="parent-page-select" class="parent-page-select" size="8"></select>
          </div>
          <div class="form-group">
            <label for="page-names">页面名称列表 (换行分隔):</label>
            <textarea id="page-names" class="page-names" rows="8" placeholder="例如:\nFVSCHEDULE\nFV\nPV\nPMT"></textarea>
          </div>
        </div>
        
        <!-- 删除页面选项卡 -->
        <div class="batch-tab-content" id="batch-delete-tab">
          <div class="form-group">
            <label for="delete-page-search">搜索要删除的页面:</label>
            <input type="text" id="delete-page-search" class="delete-page-search" placeholder="输入页面名称进行过滤...">
            <label for="delete-page-select">选择要删除的页面 (可多选):</label>
            <select id="delete-page-select" class="delete-page-select" size="10" multiple></select>
          </div>
          <div class="form-group">
            <div class="delete-options">
              <div class="delete-option">
                <input type="radio" id="delete-to-recycle" name="delete-method" value="recycle" checked>
                <label for="delete-to-recycle">移至回收站（可恢复）</label>
              </div>
              <div class="delete-option">
                <input type="radio" id="delete-permanently" name="delete-method" value="permanent">
                <label for="delete-permanently">彻底删除（不可恢复）</label>
              </div>
            </div>
            <p class="warning-text">警告：彻底删除操作不可恢复，请务必谨慎操作！</p>
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
        <button class="refresh-btn" title="重新获取目录">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 12h20M12 2A10 10 0 1 0 12 22 10 10 0 1 0 12 2z"></path>
          </svg>
          刷新目录
        </button>
        <button class="batch-confirm-btn" id="action-btn">确定</button>
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
        this.showResult('目录已刷新', 'success');
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
      const currentUrl = await this.getCurrentTabUrl();
      const productID = this.getProductIDFromURL(currentUrl);
      
      if (!productID) {
        throw new Error('无法获取产品ID');
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
      this.showError(`加载所有页面失败: ${error.message}`);
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
      const currentUrl = await this.getCurrentTabUrl();
      const productID = this.getProductIDFromURL(currentUrl);
      
      if (!productID) {
        throw new Error('无法获取产品ID');
      }
      
      const versions = await DocsAPI.getDocVersions(productID);
      const select = this.container.querySelector('#parent-page-select');
      
      // 清空现有选项
      select.innerHTML = '<option value="">请选择父页面</option>';
      
      // 保存原始选项数据
      this.originalParentPages = [];
      this.collectParentPages(versions.toc.tocItemDrafts, 0);
      
      // 添加所有选项
      this.renderParentPages(this.originalParentPages);
    } catch (error) {
      console.error('加载父页面失败:', error);
      this.showError(`加载父页面失败: ${error.message}`);
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
    select.innerHTML = '<option value="">请选择父页面</option>';
    
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
        this.showResult('请选择父页面', 'error');
        return;
      }
      
      if (!pageNamesText.trim()) {
        this.showResult('请输入页面名称列表', 'error');
        return;
      }
      
      // 解析页面名称列表
      const pageNames = pageNamesText.trim().split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);
      
      if (pageNames.length === 0) {
        this.showResult('请输入有效的页面名称列表', 'error');
        return;
      }
      
      // 获取当前产品信息
      const currentUrl = await this.getCurrentTabUrl();
      const productID = this.getProductIDFromURL(currentUrl);
      
      if (!productID) {
        this.showResult('无法获取产品ID', 'error');
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
      this.showResult(`批量添加页面失败: ${error.message}`, 'error');
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
        this.showResult('请选择要删除的页面', 'error');
        return;
      }
      
      // 获取删除方式
      const deleteMethod = this.container.querySelector('input[name="delete-method"]:checked').value;
      const isPermanent = deleteMethod === 'permanent';
      
      // 确认删除
      const confirmMessage = isPermanent 
        ? `确定要彻底删除选中的 ${selectedPageIds.length} 个页面吗？此操作不可恢复，删除后无法找回！`
        : `确定要将选中的 ${selectedPageIds.length} 个页面移至回收站吗？`;
        
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
      this.showResult(`批量删除页面失败: ${error.message}`, 'error');
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
    // 移除现有结果
    const existingResult = this.container.querySelector('.batch-result-item');
    if (existingResult) {
      existingResult.remove();
    }
    
    // 创建新结果
    const resultDiv = document.createElement('div');
    resultDiv.className = `batch-result-item ${type}`;
    resultDiv.innerHTML = message;
    
    // 添加到结果容器
    const resultContainer = this.container.querySelector('.batch-result-container');
    resultContainer.appendChild(resultDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (resultDiv.parentNode) {
        resultDiv.remove();
      }
    }, 3000);
  }
  
  showBatchResult(results) {
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    let resultHtml = `
      <h4>批量${this.currentTab === 'add' ? '添加' : '删除'}结果</h4>
      <p>成功: ${successCount}/${totalCount}</p>
    `;
    
    // 添加详细结果
    resultHtml += '<div style="margin-top: 10px;">';
    
    // 成功的结果
    const successResults = results.filter(r => r.success);
    if (successResults.length > 0) {
      resultHtml += `<h5>成功${this.currentTab === 'add' ? '添加' : '删除'}:</h5><ul>`;
      successResults.forEach(r => {
        resultHtml += `<li style="color: #155724;">${r.name}</li>`;
      });
      resultHtml += '</ul>';
    }
    
    // 失败的结果
    const errorResults = results.filter(r => !r.success);
    if (errorResults.length > 0) {
      resultHtml += `<h5>${this.currentTab === 'add' ? '添加' : '删除'}失败:</h5><ul>`;
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

  // 辅助方法：获取当前标签页 URL
  async getCurrentTabUrl() {
    // 从 BaseComponent 或 URLUtils 中获取
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0].url;
  }

  // 辅助方法：从 URL 中提取产品 ID
  getProductIDFromURL(url) {
    // 使用 URLUtils 类的方法
    return URLUtils.getProductIDFromURL(url);
  }
}

export default BatchAddComponent;