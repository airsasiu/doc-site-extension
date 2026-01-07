import BaseComponent from './base/BaseComponent.js';
import DocsAPI from '../services/api.js';

class BatchAddComponent extends BaseComponent {
  constructor(progressBar) {
    super(progressBar);
    this.initModal();
  }

  initModal() {
    // 创建模态框元素
    const modal = document.createElement('div');
    modal.className = 'batch-add-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>批量页面操作</h3>
          <button class="close-btn">&times;</button>
        </div>
        <div class="modal-tabs">
          <button class="tab-btn active" data-tab="add">添加页面</button>
          <button class="tab-btn" data-tab="delete">删除页面</button>
        </div>
        <div class="modal-body">
          <!-- 添加页面选项卡 -->
          <div class="tab-content active" id="add-tab">
            <div class="form-group">
              <label for="parent-page-search">搜索父页面:</label>
              <input type="text" id="parent-page-search" class="parent-page-search" placeholder="输入父页面名称进行过滤...">
              <label for="parent-page-select">父页面:</label>
              <select id="parent-page-select" class="parent-page-select" size="10"></select>
            </div>
            <div class="form-group">
              <label for="page-names">页面名称列表 (换行分隔):</label>
              <textarea id="page-names" class="page-names" rows="10" placeholder="例如:\nFVSCHEDULE\nFV\nPV\nPMT"></textarea>
            </div>
          </div>
          
          <!-- 删除页面选项卡 -->
          <div class="tab-content" id="delete-tab">
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
        <div class="modal-footer">
          <button class="cancel-btn">取消</button>
          <button class="confirm-btn" id="action-btn">确定</button>
        </div>
      </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      .batch-add-modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
      }
      
      .modal-content {
        background-color: #fefefe;
        margin: 5% auto;
        padding: 0;
        border: 1px solid #888;
        width: 80%;
        max-width: 600px;
        max-height: 90vh;
        border-radius: 8px;
        box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
      }
      
      .modal-header {
        padding: 15px 20px;
        background-color: #f5f5f5;
        border-bottom: 1px solid #ddd;
        border-radius: 8px 8px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .modal-header h3 {
        margin: 0;
        font-size: 18px;
      }
      
      .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        font-weight: bold;
        cursor: pointer;
        color: #999;
        transition: color 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 4px;
      }
      
      .close-btn:hover {
        color: #666;
        background-color: #f5f5f5;
      }
      
      .modal-body {
        padding: 20px;
        flex-grow: 1;
        overflow-y: auto;
        max-height: calc(100% - 140px);
      }
      
      .form-group {
        margin-bottom: 15px;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }
      
      .parent-page-search,
      .parent-page-select,
      .page-names {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        margin-bottom: 8px;
      }
      
      .parent-page-search,
      .delete-page-search {
        margin-bottom: 12px;
      }
      
      .parent-page-select,
      .delete-page-select {
        overflow-y: auto;
        margin-bottom: 0;
      }
      
      /* 选项卡样式 */
      .modal-tabs {
        display: flex;
        border-bottom: 1px solid #ddd;
        margin-bottom: 20px;
      }
      
      .tab-btn {
        background: none;
        border: none;
        padding: 10px 20px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        color: #666;
        border-bottom: 2px solid transparent;
        transition: all 0.3s ease;
      }
      
      .tab-btn:hover {
        background-color: #f5f5f5;
        color: #1890ff;
      }
      
      .tab-btn.active {
        color: #1890ff;
        border-bottom-color: #1890ff;
      }
      
      .tab-content {
        display: none;
      }
      
      .tab-content.active {
        display: block;
      }
      
      /* 警告文本样式 */
      .warning-text {
        color: #f44336;
        font-weight: bold;
        background-color: #ffebee;
        padding: 10px;
        border-radius: 4px;
        margin-top: 10px;
      }
      
      /* 删除选项样式 */
      .delete-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 15px 0;
        padding: 15px;
        background-color: #f5f5f5;
        border-radius: 4px;
      }
      
      .delete-option {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }
      
      .delete-option input[type="radio"] {
        cursor: pointer;
      }
      
      .delete-option label {
        cursor: pointer;
        font-weight: normal;
        margin: 0;
      }
      
      /* 彻底删除选项特殊样式 */
      #delete-permanently {
        accent-color: #ff4d4f;
      }
      
      #delete-permanently + label {
        color: #ff4d4f;
        font-weight: bold;
      }
      
      /* 删除页面搜索和选择框样式 */
      .delete-page-search,
      .delete-page-select {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        margin-bottom: 8px;
      }
      
      .page-names {
        resize: vertical;
        font-family: monospace;
      }
      
      .modal-footer {
        padding: 15px 20px;
        background-color: #f5f5f5;
        border-top: 1px solid #ddd;
        border-radius: 0 0 8px 8px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      
      .cancel-btn,
      .confirm-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.3s ease;
      }
      
      .cancel-btn {
        background-color: #f0f0f0;
        color: #666;
      }
      
      .cancel-btn:hover {
        background-color: #d9d9d9;
      }
      
      .confirm-btn {
        background-color: #52c41a;
        color: white;
      }
      
      .confirm-btn:hover {
        background-color: #73d13d;
      }
      
      .batch-add-result {
        margin-top: 15px;
        padding: 10px;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .batch-add-result.success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }
      
      .batch-add-result.error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    this.modal = modal;
    
    // 绑定事件
    modal.querySelector('.close-btn').addEventListener('click', () => this.closeModal());
    modal.querySelector('.cancel-btn').addEventListener('click', () => this.closeModal());
    modal.querySelector('.confirm-btn').addEventListener('click', () => this.handleAction());
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });
    
    // 按 ESC 键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isModalOpen()) {
        this.closeModal();
      }
    });
    
    // 绑定选项卡切换事件
    const tabBtns = modal.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });
    
    // 绑定删除页面搜索事件
    const deleteSearchInput = modal.querySelector('#delete-page-search');
    if (deleteSearchInput) {
      deleteSearchInput.addEventListener('input', (e) => this.handleDeletePageSearch(e));
    }
  }

  async openModal() {
    this.modal.style.display = 'block';
    this.currentTab = 'add';
    await this.loadParentPages();
    await this.loadAllPages();
    // 绑定搜索事件
    this.bindSearchEvent();
  }

  closeModal() {
    this.modal.style.display = 'none';
    // 清空表单
    this.modal.querySelector('#page-names').value = '';
    this.modal.querySelector('#parent-page-search').value = '';
    this.modal.querySelector('#delete-page-search').value = '';
    // 清空选择
    const deleteSelect = this.modal.querySelector('#delete-page-select');
    if (deleteSelect) {
      deleteSelect.selectedIndex = -1;
    }
    // 移除结果信息
    const resultDiv = this.modal.querySelector('.batch-add-result');
    if (resultDiv) {
      resultDiv.remove();
    }
  }

  isModalOpen() {
    return this.modal.style.display === 'block';
  }

  // 切换选项卡
  switchTab(tabName) {
    this.currentTab = tabName;
    
    // 更新选项卡按钮状态
    const tabBtns = this.modal.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // 更新选项卡内容显示
    const tabContents = this.modal.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
  }

  // 绑定搜索事件
  bindSearchEvent() {
    // 父页面搜索事件
    const parentSearchInput = this.modal.querySelector('#parent-page-search');
    if (parentSearchInput) {
      parentSearchInput.removeEventListener('input', this.handleParentPageSearch);
      parentSearchInput.addEventListener('input', (e) => this.handleParentPageSearch(e));
    }
    
    // 删除页面搜索事件
    const deleteSearchInput = this.modal.querySelector('#delete-page-search');
    if (deleteSearchInput) {
      deleteSearchInput.removeEventListener('input', this.handleDeletePageSearch);
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
      const select = this.modal.querySelector('#delete-page-select');
      
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
    const select = this.modal.querySelector('#delete-page-select');
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
      const select = this.modal.querySelector('#parent-page-select');
      
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
    const select = this.modal.querySelector('#parent-page-select');
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

  // 主操作处理方法，根据当前选项卡处理添加或删除操作
  async handleAction() {
    if (this.currentTab === 'add') {
      await this.handleBatchAdd();
    } else if (this.currentTab === 'delete') {
      await this.handleBatchDelete();
    }
  }

  // 批量添加页面
  async handleBatchAdd() {
    try {
      const select = this.modal.querySelector('#parent-page-select');
      const pageNamesText = this.modal.querySelector('#page-names').value;
      
      // 验证输入
      if (!select.value) {
        this.showModalResult('请选择父页面', 'error');
        return;
      }
      
      if (!pageNamesText.trim()) {
        this.showModalResult('请输入页面名称列表', 'error');
        return;
      }
      
      // 解析页面名称列表
      const pageNames = pageNamesText.trim().split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);
      
      if (pageNames.length === 0) {
        this.showModalResult('请输入有效的页面名称列表', 'error');
        return;
      }
      
      // 获取当前产品信息
      const currentUrl = await this.getCurrentTabUrl();
      const productID = this.getProductIDFromURL(currentUrl);
      
      if (!productID) {
        this.showModalResult('无法获取产品ID', 'error');
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
      this.showModalResult(`批量添加页面失败: ${error.message}`, 'error');
    }
  }

  // 批量删除页面
  async handleBatchDelete() {
    try {
      const select = this.modal.querySelector('#delete-page-select');
      
      // 获取选中的页面 ID
      const selectedOptions = Array.from(select.selectedOptions);
      const selectedPageIds = selectedOptions.map(option => option.value);
      const selectedPageNames = selectedOptions.map(option => option.textContent.trim());
      
      // 验证输入
      if (selectedPageIds.length === 0) {
        this.showModalResult('请选择要删除的页面', 'error');
        return;
      }
      
      // 获取删除方式
      const deleteMethod = this.modal.querySelector('input[name="delete-method"]:checked').value;
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
      this.showModalResult(`批量删除页面失败: ${error.message}`, 'error');
    }
  }

  buildDocumentPath(parentText, pageName) {
    // 移除缩进并构建路径
    const parentPath = parentText.replace(/^\s+/g, '').replace(/\s+/g, '-').toLowerCase();
    const pagePath = pageName.replace(/\s+/g, '-').toLowerCase();
    return `/${parentPath}/${pagePath}`;
  }

  showModalResult(message, type) {
    // 移除现有结果
    const existingResult = this.modal.querySelector('.batch-add-result');
    if (existingResult) {
      existingResult.remove();
    }
    
    // 创建新结果
    const resultDiv = document.createElement('div');
    resultDiv.className = `batch-add-result ${type}`;
    resultDiv.textContent = message;
    
    // 添加到模态框底部
    this.modal.querySelector('.modal-body').appendChild(resultDiv);
  }

  showBatchResult(results) {
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    let resultHtml = `
      <h4>批量添加结果</h4>
      <p>成功: ${successCount}/${totalCount}</p>
    `;
    
    // 添加详细结果
    resultHtml += '<div style="margin-top: 10px;">';
    
    // 成功的结果
    const successResults = results.filter(r => r.success);
    if (successResults.length > 0) {
      resultHtml += '<h5>成功添加:</h5><ul>';
      successResults.forEach(r => {
        resultHtml += `<li style="color: #155724;">${r.name}</li>`;
      });
      resultHtml += '</ul>';
    }
    
    // 失败的结果
    const errorResults = results.filter(r => !r.success);
    if (errorResults.length > 0) {
      resultHtml += '<h5>添加失败:</h5><ul>';
      errorResults.forEach(r => {
        resultHtml += `<li style="color: #721c24;">${r.name}: ${r.error}</li>`;
      });
      resultHtml += '</ul>';
    }
    
    resultHtml += '</div>';
    
    // 显示结果
    this.showModalResult(resultHtml, successCount === totalCount ? 'success' : 'error');
  }
  
  // 辅助方法：获取当前标签页 URL
  async getCurrentTabUrl() {
    // 从 BaseComponent 或 URLUtils 中获取
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0].url;
  }
  
  // 辅助方法：从 URL 中提取产品 ID
  getProductIDFromURL(url) {
    const match = url.match(/ArticleEdit\/([^?.]+)/);
    return match ? match[1] : null;
  }
}

export default BatchAddComponent;
