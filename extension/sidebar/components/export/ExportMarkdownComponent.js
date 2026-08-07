import BaseComponent from '../base/BaseComponent.js';
import DocsAPI from '../../services/api.js';
import URLUtils from '../../services/urlUtils.js';
import { getActiveLanguage } from '../../../shared/localization.js';

const TEXTS = {
  cn: {
    exportMarkdown: '导出 Markdown',
    redirectRecords: 'Redirect 记录',
    exportSettings: '导出设置:',
    createFolders: '按目录结构创建文件夹',
    includeTitle: '包含页面标题',
    exportStatus: '导出状态:',
    ready: '准备就绪',
    redirectReminder: '当前版本没有记录初始的 TOC 结构。调整 TOC 前请先下载并保存一份 TOC JSON，否则后续无法自动比对旧 URL。',
    redirectReminderResolved: '已选择调整前 TOC JSON，本次比对具备初始结构。',
    downloadCurrentToc: '下载当前 TOC',
    tocCompare: 'TOC 对比:',
    beforeToc: '调整前 TOC JSON',
    afterToc: '调整后 TOC JSON',
    chooseFile: '选择文件',
    noFile: '尚未选择',
    redirectSummaryInitial: '选择两份 TOC JSON 后生成 Redirect 记录',
    generateRedirect: '生成 Redirect',
    recordStatus: '记录状态:',
    clearRecords: '清空记录',
    startExport: '开始导出',
    downloadToc: '下载 TOC',
    exportJson: '导出 JSON',
    exportCsv: '导出 CSV',
    loadingJsZipError: '无法加载JSZip库，导出功能可能无法正常工作',
    readingToc: '正在读取 TOC 文件...',
    selectTocFiles: '请选择调整前和调整后的 TOC JSON 文件',
    noPathChanges: '没有发现 documentPath 变化',
    generatedRedirects: '已生成 {count} 条 Redirect 记录',
    generateFailed: '生成失败: {message}',
    noRedirects: '暂无 Redirect 记录',
    oldPath: '旧',
    newPath: '新',
    delete: '删除',
    deleted: 'Redirect 记录已删除',
    noRecordsToClear: '没有可清空的 Redirect 记录',
    clearConfirm: '确定清空 {count} 条 Redirect 记录？',
    cleared: 'Redirect 记录已清空',
    noRecordsToExport: '没有可导出的 Redirect 记录',
    exported: 'Redirect 记录已导出',
    exportFailed: '导出失败: {message}',
    invalidJson: '{name} 不是有效的 JSON 文件',
    cannotReadFile: '无法读取 {name}',
    tocDiffNote: 'TOC diff 自动生成',
    beforeCount: '调整前 {count} 个页面',
    afterCount: '调整后 {count} 个页面',
    changedCount: 'URL 变化 {count} 个',
    insertedCount: '新增 {count} 条',
    updatedCount: '更新 {count} 条',
    untitledPage: '未命名页面',
    downloading: '下载中...',
    gettingToc: '正在获取TOC结构...',
    downloadingCurrentToc: '正在下载当前 TOC 结构...',
    tocDownloaded: 'TOC下载完成！',
    currentTocDownloaded: '当前 TOC 已下载，请将它作为调整前 TOC JSON 保存',
    tocDownloadDone: 'TOC下载完成',
    tocExportFailed: 'TOC导出失败: {message}',
    tocDownloadFailed: 'TOC 下载失败: {message}',
    productIdMissing: '无法获取产品ID，请确保在文档编辑页面使用此扩展',
    tocDataMissing: '无法获取TOC数据，请确保已加载文档结构',
    jsZipMissing: 'JSZip库未加载，请稍后重试',
    exporting: '导出中...',
    preparingExport: '正在准备导出...',
    exportDone: '导出完成！',
    markdownExportDone: 'Markdown 导出完成',
    generatingZip: '正在生成ZIP文件...',
    generateZipFailed: '生成ZIP文件失败',
    noMarkdown: '没有找到可导出的Markdown内容'
  },
  en: {
    exportMarkdown: 'Export Markdown',
    redirectRecords: 'Redirect records',
    exportSettings: 'Export settings:',
    createFolders: 'Create folders by directory structure',
    includeTitle: 'Include page title',
    exportStatus: 'Export status:',
    ready: 'Ready',
    redirectReminder: 'This version does not have the original TOC structure. Download and save the current TOC JSON before adjusting the TOC, otherwise old URLs cannot be compared automatically.',
    redirectReminderResolved: 'The before-change TOC JSON is selected, so this comparison has the original structure.',
    downloadCurrentToc: 'Download current TOC',
    tocCompare: 'TOC comparison:',
    beforeToc: 'Before-change TOC JSON',
    afterToc: 'After-change TOC JSON',
    chooseFile: 'Choose file',
    noFile: 'No file selected',
    redirectSummaryInitial: 'Select two TOC JSON files to generate redirect records',
    generateRedirect: 'Generate redirects',
    recordStatus: 'Record status:',
    clearRecords: 'Clear records',
    startExport: 'Start export',
    downloadToc: 'Download TOC',
    exportJson: 'Export JSON',
    exportCsv: 'Export CSV',
    loadingJsZipError: 'Unable to load JSZip. Export may not work correctly.',
    readingToc: 'Reading TOC files...',
    selectTocFiles: 'Please select both before-change and after-change TOC JSON files',
    noPathChanges: 'No documentPath changes found',
    generatedRedirects: 'Generated {count} redirect records',
    generateFailed: 'Generation failed: {message}',
    noRedirects: 'No redirect records',
    oldPath: 'Old',
    newPath: 'New',
    delete: 'Delete',
    deleted: 'Redirect record deleted',
    noRecordsToClear: 'There are no redirect records to clear',
    clearConfirm: 'Clear {count} redirect records?',
    cleared: 'Redirect records cleared',
    noRecordsToExport: 'There are no redirect records to export',
    exported: 'Redirect records exported',
    exportFailed: 'Export failed: {message}',
    invalidJson: '{name} is not a valid JSON file',
    cannotReadFile: 'Unable to read {name}',
    tocDiffNote: 'Generated from TOC diff',
    beforeCount: 'Before: {count} pages',
    afterCount: 'After: {count} pages',
    changedCount: 'URL changes: {count}',
    insertedCount: 'Inserted {count}',
    updatedCount: 'Updated {count}',
    untitledPage: 'Untitled page',
    downloading: 'Downloading...',
    gettingToc: 'Fetching TOC structure...',
    downloadingCurrentToc: 'Downloading current TOC structure...',
    tocDownloaded: 'TOC downloaded.',
    currentTocDownloaded: 'Current TOC downloaded. Save it as the before-change TOC JSON.',
    tocDownloadDone: 'TOC download complete',
    tocExportFailed: 'TOC export failed: {message}',
    tocDownloadFailed: 'TOC download failed: {message}',
    productIdMissing: 'Unable to get the product ID. Please use this extension on a documentation editor page.',
    tocDataMissing: 'Unable to get TOC data. Make sure the documentation structure has loaded.',
    jsZipMissing: 'JSZip is not loaded. Please try again later.',
    exporting: 'Exporting...',
    preparingExport: 'Preparing export...',
    exportDone: 'Export complete.',
    markdownExportDone: 'Markdown export complete',
    generatingZip: 'Generating ZIP file...',
    generateZipFailed: 'Failed to generate ZIP file',
    noMarkdown: 'No exportable Markdown content found'
  }
};

function formatMessage(template, params = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

class ExportMarkdownComponent extends BaseComponent {
  constructor(progressBar) {
    super(progressBar);
    this.initContent();
    this.loadJSZip();
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

    setText('.export-tab-btn[data-tab="export-markdown"]', this.t('exportMarkdown'));
    setText('.export-tab-btn[data-tab="redirect-records"]', this.t('redirectRecords'));
    setText('label[for="export-with-folder"]', this.t('createFolders'));
    setText('label[for="export-include-title"]', this.t('includeTitle'));
    setText('#redirect-download-toc-btn', this.t('downloadCurrentToc'));
    setText('#compare-toc-redirect-btn', this.t('generateRedirect'));
    setText('#clear-redirects-btn', this.t('clearRecords'));
    setText('#export-action-btn', this.t('startExport'));
    setText('#export-toc-btn', this.t('downloadToc'));
    setText('#export-redirect-json-btn', this.t('exportJson'));
    setText('#export-redirect-csv-btn', this.t('exportCsv'));

    const formLabels = this.container.querySelectorAll('.form-group > label, .form-title-row > label');
    if (formLabels[0]) formLabels[0].textContent = this.t('exportSettings');
    if (formLabels[1]) formLabels[1].textContent = this.t('exportStatus');
    if (formLabels[2]) formLabels[2].textContent = this.t('tocCompare');
    if (formLabels[3]) formLabels[3].textContent = this.t('recordStatus');

    const tocTitles = this.container.querySelectorAll('.toc-file-title');
    if (tocTitles[0]) tocTitles[0].textContent = this.t('beforeToc');
    if (tocTitles[1]) tocTitles[1].textContent = this.t('afterToc');
    this.container.querySelectorAll('.file-picker-action').forEach((element) => {
      element.textContent = this.t('chooseFile');
    });
    this.container.querySelectorAll('.file-picker-name').forEach((element) => {
      if (!element.textContent || element.textContent === TEXTS.cn.noFile || element.textContent === TEXTS.en.noFile) {
        element.textContent = this.t('noFile');
      }
    });

    const exportStatus = this.container.querySelector('#export-status p');
    if (exportStatus && (exportStatus.textContent === TEXTS.cn.ready || exportStatus.textContent === TEXTS.en.ready)) {
      exportStatus.textContent = this.t('ready');
    }
    const redirectStatus = this.container.querySelector('#redirect-status p');
    if (redirectStatus && (redirectStatus.textContent === TEXTS.cn.ready || redirectStatus.textContent === TEXTS.en.ready)) {
      redirectStatus.textContent = this.t('ready');
    }

    const summary = this.container.querySelector('#redirect-diff-summary');
    if (summary && (summary.textContent === TEXTS.cn.redirectSummaryInitial || summary.textContent === TEXTS.en.redirectSummaryInitial)) {
      summary.textContent = this.t('redirectSummaryInitial');
    }

    this.updateRedirectTocReminder();
    this.renderRedirectRecords();
  }

  initContent() {
    // 获取文档操作tab元素
    const documentOperationsTab = document.getElementById('document-operations-tab');
    
    // 创建导出操作内容区域
    const exportContent = document.createElement('div');
    exportContent.className = 'export-operations-content';
    exportContent.innerHTML = `
      <div class="export-tabs motion-rise">
        <button class="export-tab-btn active" data-tab="export-markdown">${this.t('exportMarkdown')}</button>
        <button class="export-tab-btn" data-tab="redirect-records">${this.t('redirectRecords')}</button>
      </div>
      
      <!-- 导出操作内容 -->
      <div class="export-content">
        <!-- 导出 Markdown 选项卡 -->
        <div class="export-tab-content active" id="export-markdown-tab">
          <div class="form-group motion-rise">
            <label>${this.t('exportSettings')}</label>
            <div class="export-options">
              <div class="export-option">
                <input type="checkbox" id="export-with-folder" checked>
                <label for="export-with-folder">${this.t('createFolders')}</label>
              </div>
              <div class="export-option">
                <input type="checkbox" id="export-include-title" checked>
                <label for="export-include-title">${this.t('includeTitle')}</label>
              </div>
            </div>
          </div>
          <div class="form-group motion-rise">
            <label>${this.t('exportStatus')}</label>
            <div class="export-status" id="export-status">
              <p>${this.t('ready')}</p>
            </div>
          </div>
        </div>

        <!-- Redirect 记录选项卡 -->
        <div class="export-tab-content" id="redirect-records-tab">
          <div class="redirect-global-warning motion-rise" id="redirect-toc-reminder">
            <span class="redirect-reminder-text">${this.t('redirectReminder')}</span>
            <button class="link-button redirect-download-toc-btn" id="redirect-download-toc-btn" type="button">${this.t('downloadCurrentToc')}</button>
          </div>
          <div class="form-group motion-rise">
            <label>${this.t('tocCompare')}</label>
            <div class="redirect-form">
              <div class="toc-diff-grid">
                <label class="toc-file-input">
                  <span class="toc-file-title">${this.t('beforeToc')}</span>
                  <input type="file" id="redirect-before-toc-file" accept=".json,application/json">
                  <span class="file-picker-shell">
                    <span class="file-picker-action">${this.t('chooseFile')}</span>
                    <span class="file-picker-name" id="redirect-before-file-name">${this.t('noFile')}</span>
                  </span>
                </label>
                <label class="toc-file-input">
                  <span class="toc-file-title">${this.t('afterToc')}</span>
                  <input type="file" id="redirect-after-toc-file" accept=".json,application/json">
                  <span class="file-picker-shell">
                    <span class="file-picker-action">${this.t('chooseFile')}</span>
                    <span class="file-picker-name" id="redirect-after-file-name">${this.t('noFile')}</span>
                  </span>
                </label>
              </div>
              <div class="redirect-summary" id="redirect-diff-summary">
                ${this.t('redirectSummaryInitial')}
              </div>
              <div class="redirect-inline-actions">
                <button class="secondary-btn primary" id="compare-toc-redirect-btn" type="button">${this.t('generateRedirect')}</button>
              </div>
            </div>
          </div>
          <div class="form-group motion-rise">
            <div class="form-title-row">
              <label>${this.t('recordStatus')}</label>
              <button class="link-button danger-link" id="clear-redirects-btn" type="button">${this.t('clearRecords')}</button>
            </div>
            <div class="export-status" id="redirect-status">
              <p>${this.t('ready')}</p>
            </div>
          </div>
          <div class="redirect-list motion-rise" id="redirect-list"></div>
        </div>
        
      </div>
      
      <!-- 操作按钮 -->
      <div class="export-actions motion-rise">
        <button class="export-confirm-btn" id="export-action-btn">${this.t('startExport')}</button>
        <button class="export-confirm-btn" id="export-toc-btn">${this.t('downloadToc')}</button>
        <button class="export-confirm-btn" id="export-redirect-json-btn">${this.t('exportJson')}</button>
        <button class="export-confirm-btn" id="export-redirect-csv-btn">${this.t('exportCsv')}</button>
      </div>
    `;
    
    // 添加到文档操作tab中
    documentOperationsTab.appendChild(exportContent);
    
    // 保存引用
    this.container = exportContent;
    
    // 进度条已在sidebar.js中初始化，不需要重新初始化
    
    // 绑定选项卡切换事件
    this.bindTabEvents();
    
    // 绑定事件
    this.bindEvents();
  }

  loadJSZip() {
    // 检查是否已经加载了JSZip
    if (window.JSZip) {
      return;
    }
    
    // 创建script标签加载本地JSZip库
    const script = document.createElement('script');
    script.src = '../lib/jszip.min.js';
    script.onload = () => {
      console.log('JSZip library loaded successfully');
    };
    script.onerror = (error) => {
      console.error('Failed to load JSZip library:', error);
      this.showError(this.t('loadingJsZipError'));
    };
    document.head.appendChild(script);
  }

  bindEvents() {
    // 绑定导出Markdown按钮事件
    const exportBtn = this.container.querySelector('#export-action-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExport());
    }
    
    // 绑定下载TOC按钮事件
    const exportTOCBtn = this.container.querySelector('#export-toc-btn');
    if (exportTOCBtn) {
      exportTOCBtn.addEventListener('click', () => this.handleExportTOC());
    }

    const redirectDownloadTocBtn = this.container.querySelector('#redirect-download-toc-btn');
    if (redirectDownloadTocBtn) {
      redirectDownloadTocBtn.addEventListener('click', () => this.handleExportTOC({ redirectContext: true }));
    }

    const compareTocBtn = this.container.querySelector('#compare-toc-redirect-btn');
    if (compareTocBtn) {
      compareTocBtn.addEventListener('click', () => this.generateRedirectRecordsFromTocDiff());
    }

    const exportRedirectJsonBtn = this.container.querySelector('#export-redirect-json-btn');
    if (exportRedirectJsonBtn) {
      exportRedirectJsonBtn.addEventListener('click', () => this.exportRedirectRecords('json'));
    }

    const exportRedirectCsvBtn = this.container.querySelector('#export-redirect-csv-btn');
    if (exportRedirectCsvBtn) {
      exportRedirectCsvBtn.addEventListener('click', () => this.exportRedirectRecords('csv'));
    }

    const clearRedirectsBtn = this.container.querySelector('#clear-redirects-btn');
    if (clearRedirectsBtn) {
      clearRedirectsBtn.addEventListener('click', () => this.clearRedirectRecords());
    }

    this.bindRedirectFileInputs();

    this.renderRedirectRecords();

  }

  // 绑定选项卡切换事件
  bindTabEvents() {
    const tabBtns = this.container.querySelectorAll('.export-tab-btn');
    const tabContents = this.container.querySelectorAll('.export-tab-content');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        // 移除所有active类
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // 添加当前tab的active类
        btn.classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
        this.updateActionButtons(tabId);
      });
    });

    this.updateActionButtons('export-markdown');
  }

  updateActionButtons(activeTab) {
    const groups = {
      'export-markdown': ['export-action-btn', 'export-toc-btn'],
      'redirect-records': [
        'export-redirect-json-btn',
        'export-redirect-csv-btn'
      ]
    };

    const allButtonIds = Object.values(groups).flat();
    allButtonIds.forEach(id => {
      const button = this.container.querySelector(`#${id}`);
      if (button) {
        button.style.display = groups[activeTab]?.includes(id) ? '' : 'none';
      }
    });
  }

  bindRedirectFileInputs() {
    [
      ['redirect-before-toc-file', 'redirect-before-file-name'],
      ['redirect-after-toc-file', 'redirect-after-file-name']
    ].forEach(([inputId, nameId]) => {
      const input = this.container.querySelector(`#${inputId}`);
      const fileName = this.container.querySelector(`#${nameId}`);
      if (!input || !fileName) {
        return;
      }

      input.addEventListener('change', () => {
        fileName.textContent = input.files?.[0]?.name || this.t('noFile');
        this.updateRedirectTocReminder();
      });
    });

    this.updateRedirectTocReminder();
  }

  updateRedirectTocReminder() {
    const reminder = this.container.querySelector('#redirect-toc-reminder');
    const reminderText = this.container.querySelector('.redirect-reminder-text');
    const beforeFile = this.container.querySelector('#redirect-before-toc-file')?.files?.[0];
    if (!reminder || !reminderText) {
      return;
    }

    reminder.classList.toggle('is-resolved', Boolean(beforeFile));
    reminderText.textContent = beforeFile
      ? this.t('redirectReminderResolved')
      : this.t('redirectReminder');
  }

  async generateRedirectRecordsFromTocDiff() {
    try {
      this.updateRedirectStatus(this.t('readingToc'), 'info');
      const beforeFile = this.container.querySelector('#redirect-before-toc-file')?.files?.[0];
      const afterFile = this.container.querySelector('#redirect-after-toc-file')?.files?.[0];

      if (!beforeFile || !afterFile) {
        throw new Error(this.t('selectTocFiles'));
      }

      const beforeToc = await this.readJsonFile(beforeFile);
      const afterToc = await this.readJsonFile(afterFile);
      const currentPageInfo = await this.getCurrentPageInfo().catch(() => ({}));
      const diffRecords = this.compareTocRedirects(beforeToc, afterToc, currentPageInfo);

      if (diffRecords.length === 0) {
        this.updateRedirectStatus(this.t('noPathChanges'), 'info');
        this.updateRedirectSummary({ changed: 0, beforeCount: this.countTocDocuments(beforeToc), afterCount: this.countTocDocuments(afterToc) });
        return;
      }

      const records = await this.getRedirectRecords();
      const merged = this.mergeRedirectRecords(records, diffRecords);
      await this.setRedirectRecords(merged.records);
      await this.renderRedirectRecords();

      this.updateRedirectStatus(this.t('generatedRedirects', { count: diffRecords.length }), 'success');
      this.updateRedirectSummary({
        changed: diffRecords.length,
        beforeCount: this.countTocDocuments(beforeToc),
        afterCount: this.countTocDocuments(afterToc),
        inserted: merged.inserted,
        updated: merged.updated
      });
    } catch (error) {
      console.error('生成 Redirect 失败:', error);
      this.updateRedirectStatus(this.t('generateFailed', { message: error.message }), 'error');
    }
  }

  async renderRedirectRecords() {
    const list = this.container.querySelector('#redirect-list');
    if (!list) {
      return;
    }

    const records = await this.getRedirectRecords();
    if (records.length === 0) {
      list.innerHTML = `<div class="empty-state">${this.t('noRedirects')}</div>`;
      return;
    }

    list.innerHTML = records
      .slice()
      .reverse()
      .map((record, index) => `
        <div class="redirect-record motion-leave" data-id="${record.id}" style="--enter-order:${index}">
          <div class="redirect-paths">
            <div><span class="redirect-label">${this.t('oldPath')}</span><code>${this.escapeHtml(record.fromPath)}</code></div>
            <div><span class="redirect-label">${this.t('newPath')}</span><code>${this.escapeHtml(record.toPath)}</code></div>
          </div>
          ${record.note ? `<div class="redirect-note">${this.escapeHtml(record.note)}</div>` : ''}
          <div class="redirect-meta">${this.escapeHtml(this.getRedirectRecordTitle(record))} · ${new Date(record.updatedAt).toLocaleString()}</div>
          <button class="link-button delete-redirect-btn" data-id="${record.id}">${this.t('delete')}</button>
        </div>
      `)
      .join('');

    list.querySelectorAll('.delete-redirect-btn').forEach(button => {
      button.addEventListener('click', () => this.deleteRedirectRecord(button.dataset.id, button.closest('.redirect-record')));
    });
  }

  async deleteRedirectRecord(id, element) {
    if (element) {
      element.classList.add('is-leaving');
    }

    await new Promise(resolve => setTimeout(resolve, 160));
    const records = await this.getRedirectRecords();
    await this.setRedirectRecords(records.filter(record => record.id !== id));
    this.updateRedirectStatus(this.t('deleted'), 'success');
    await this.renderRedirectRecords();
  }

  async clearRedirectRecords() {
    const records = await this.getRedirectRecords();
    if (records.length === 0) {
      this.updateRedirectStatus(this.t('noRecordsToClear'), 'info');
      return;
    }

    if (!confirm(this.t('clearConfirm', { count: records.length }))) {
      return;
    }

    await this.setRedirectRecords([]);
    this.updateRedirectStatus(this.t('cleared'), 'success');
    await this.renderRedirectRecords();
  }

  async exportRedirectRecords(format) {
    try {
      const records = await this.getRedirectRecords();
      if (records.length === 0) {
        throw new Error(this.t('noRecordsToExport'));
      }

      if (format === 'csv') {
        const csv = [
          ['fromPath', 'toPath', 'oldTitle', 'newTitle', 'note', 'productId', 'pageType', 'tocItemId', 'origin', 'source', 'updatedAt'],
          ...records.map(record => [
            record.fromPath,
            record.toPath,
            record.oldTitle || record.title,
            record.newTitle || record.title,
            record.note,
            record.productId,
            record.pageType,
            record.tocItemId,
            record.origin,
            record.source,
            record.updatedAt
          ])
        ].map(row => row.map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(',')).join('\n');
        this.downloadFile(`redirect-records-${Date.now()}.csv`, csv, 'text/csv;charset=utf-8;');
      } else {
        this.downloadFile(`redirect-records-${Date.now()}.json`, JSON.stringify(records, null, 2), 'application/json;charset=utf-8;');
      }

      this.updateRedirectStatus(this.t('exported'), 'success');
    } catch (error) {
      console.error('导出 Redirect 失败:', error);
      this.updateRedirectStatus(this.t('exportFailed', { message: error.message }), 'error');
    }
  }

  readJsonFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(JSON.parse(reader.result));
        } catch (error) {
          reject(new Error(this.t('invalidJson', { name: file.name })));
        }
      };
      reader.onerror = () => reject(new Error(this.t('cannotReadFile', { name: file.name })));
      reader.readAsText(file);
    });
  }

  compareTocRedirects(beforeToc, afterToc, pageInfo = {}) {
    const beforeItems = this.collectTocItems(beforeToc);
    const afterItems = this.collectTocItems(afterToc);
    const afterItemsById = new Map(afterItems.map(item => [item.id, item]));
    const now = new Date().toISOString();

    return beforeItems
      .map(beforeItem => {
        const afterItem = afterItemsById.get(beforeItem.id);
        if (!afterItem || !beforeItem.documentPath || !afterItem.documentPath) {
          return null;
        }

        const fromPath = this.normalizeRedirectPath(beforeItem.documentPath);
        const toPath = this.normalizeRedirectPath(afterItem.documentPath);
        if (!fromPath || !toPath || fromPath === toPath) {
          return null;
        }

        return {
          id: `toc-diff-${beforeItem.id}`,
          fromPath,
          toPath,
          note: this.t('tocDiffNote'),
          title: afterItem.title || beforeItem.title,
          oldTitle: beforeItem.title,
          newTitle: afterItem.title,
          productId: pageInfo.productId || '',
          pageType: pageInfo.pageType || '',
          tocItemId: beforeItem.id,
          origin: pageInfo.origin || '',
          source: 'toc-diff',
          createdAt: now,
          updatedAt: now
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.fromPath.localeCompare(b.fromPath));
  }

  collectTocItems(tocData) {
    const items = [];
    const roots = this.getTocRoots(tocData);

    const visit = (item) => {
      if (!item || typeof item !== 'object') {
        return;
      }

      const id = this.getTocItemId(item);
      const documentPath = this.getTocItemDocumentPath(item);
      if (id && documentPath) {
        items.push({
          id,
          documentPath,
          title: this.getTocItemTitle(item)
        });
      }

      ['tocItemDrafts', 'children', 'items', 'subItems', 'subsections']
        .flatMap(key => Array.isArray(item[key]) ? item[key] : [])
        .forEach(visit);
    };

    roots.forEach(visit);
    return items;
  }

  getTocRoots(tocData) {
    if (Array.isArray(tocData)) {
      return tocData;
    }

    if (!tocData || typeof tocData !== 'object') {
      return [];
    }

    return tocData.tocItemDrafts ||
      tocData.children ||
      tocData.items ||
      tocData.toc?.tocItemDrafts ||
      tocData.demoToc?.tocItemDrafts ||
      [];
  }

  getTocItemId(item) {
    return String(item.tocItemId || item.id || item.guid || '').trim();
  }

  getTocItemTitle(item) {
    return String(item.text || item.displayName || item.title || item.name || '').trim();
  }

  getTocItemDocumentPath(item) {
    return String(item.documentPath || item.path || '').trim();
  }

  countTocDocuments(tocData) {
    return this.collectTocItems(tocData).length;
  }

  mergeRedirectRecords(existingRecords, newRecords) {
    const records = [...existingRecords];
    let inserted = 0;
    let updated = 0;

    newRecords.forEach(newRecord => {
      const existingIndex = records.findIndex(record =>
        (newRecord.tocItemId && record.tocItemId === newRecord.tocItemId) ||
        record.fromPath === newRecord.fromPath
      );

      if (existingIndex >= 0) {
        records[existingIndex] = {
          ...records[existingIndex],
          ...newRecord,
          id: records[existingIndex].id,
          createdAt: records[existingIndex].createdAt || newRecord.createdAt,
          updatedAt: newRecord.updatedAt
        };
        updated++;
      } else {
        records.push(newRecord);
        inserted++;
      }
    });

    return { records, inserted, updated };
  }

  async getCurrentPageInfo() {
    const currentUrl = await URLUtils.getCurrentTabUrl();
    return {
      productId: URLUtils.getProductIDFromURL(currentUrl) || '',
      pageType: URLUtils.getPageTypeFromURL(currentUrl) || '',
      origin: new URL(currentUrl).origin
    };
  }

  updateRedirectSummary(summary) {
    const summaryDiv = this.container.querySelector('#redirect-diff-summary');
    if (!summaryDiv) {
      return;
    }

    const parts = [
      this.t('beforeCount', { count: summary.beforeCount || 0 }),
      this.t('afterCount', { count: summary.afterCount || 0 }),
      this.t('changedCount', { count: summary.changed || 0 })
    ];

    if (summary.inserted || summary.updated) {
      parts.push(this.t('insertedCount', { count: summary.inserted || 0 }));
      parts.push(this.t('updatedCount', { count: summary.updated || 0 }));
    }

    summaryDiv.textContent = parts.join(' · ');
  }

  normalizeRedirectPath(path) {
    const trimmedPath = path.trim();
    if (!trimmedPath) {
      return '';
    }

    try {
      return new URL(trimmedPath).pathname;
    } catch (error) {
      const pathOnly = trimmedPath.split('#')[0].split('?')[0];
      return pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
    }
  }

  async getRedirectRecords() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['docSiteRedirectRecords'], (result) => {
        resolve(Array.isArray(result.docSiteRedirectRecords) ? result.docSiteRedirectRecords : []);
      });
    });
  }

  async setRedirectRecords(records) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ docSiteRedirectRecords: records }, resolve);
    });
  }

  updateRedirectStatus(message, type = 'info') {
    const statusDiv = this.container.querySelector('#redirect-status');
    if (statusDiv) {
      statusDiv.className = `export-status ${type}`;
      statusDiv.innerHTML = `<p class="${type}">${this.escapeHtml(message)}</p>`;
    }
  }

  getRedirectRecordTitle(record) {
    if (record.oldTitle && record.newTitle && record.oldTitle !== record.newTitle) {
      return `${record.oldTitle} -> ${record.newTitle}`;
    }

    return record.newTitle || record.oldTitle || record.title || record.tocItemId || this.t('untitledPage');
  }

  escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 处理TOC导出操作
  async handleExportTOC({ redirectContext = false } = {}) {
    try {
      // 禁用下载TOC按钮
      const tocButtons = this.container.querySelectorAll('#export-toc-btn, #redirect-download-toc-btn');
      tocButtons.forEach(button => {
        button.disabled = true;
        button.textContent = this.t('downloading');
      });

      // 更新状态
      this.updateTOCExportStatus(this.t('gettingToc'), 'info');
      if (redirectContext) {
        this.updateRedirectStatus(this.t('downloadingCurrentToc'), 'info');
      }

      // 获取TOC结构
      const tocData = await this.getTOCData();

      // 转换为JSON格式
      const tocJson = JSON.stringify(tocData, null, 2);

      // 生成文件名
      const fileName = `toc-${Date.now()}.json`;

      // 下载文件
      this.downloadFile(fileName, tocJson);

      // 显示成功消息
      this.updateTOCExportStatus(this.t('tocDownloaded'), 'success');
      if (redirectContext) {
        this.updateRedirectStatus(this.t('currentTocDownloaded'), 'success');
      }
      this.showStatus(this.t('tocDownloadDone'), 'success');
    } catch (error) {
      console.error('TOC导出失败:', error);
      this.updateTOCExportStatus(this.t('tocExportFailed', { message: error.message }), 'error');
      if (redirectContext) {
        this.updateRedirectStatus(this.t('tocDownloadFailed', { message: error.message }), 'error');
      }
      this.showError(this.t('tocExportFailed', { message: error.message }));
    } finally {
      // 启用下载TOC按钮
      const tocButtons = this.container.querySelectorAll('#export-toc-btn, #redirect-download-toc-btn');
      tocButtons.forEach(button => {
        button.disabled = false;
      });
      const exportTOCBtn = this.container.querySelector('#export-toc-btn');
      const redirectDownloadTocBtn = this.container.querySelector('#redirect-download-toc-btn');
      if (exportTOCBtn) exportTOCBtn.textContent = this.t('downloadToc');
      if (redirectDownloadTocBtn) redirectDownloadTocBtn.textContent = this.t('downloadCurrentToc');
    }
  }

  // 获取TOC数据
  async getTOCData(forceRefresh = false) {
    // 如果已有TOC数据，直接返回
    if (this.tocData && !forceRefresh) {
      return this.tocData;
    }

    // 尝试从API获取TOC数据
    try {
      // 获取当前标签页URL
      const currentUrl = await URLUtils.getCurrentTabUrl();
      
      // 从URL中提取产品ID
      const productID = URLUtils.getProductIDFromURL(currentUrl);
      
      // 从URL中提取页面类型
      const pageType = URLUtils.getPageTypeFromURL(currentUrl);
      
      if (!productID) {
        throw new Error(this.t('productIdMissing'));
      }

      // 获取文档版本信息
      const versions = await DocsAPI.getDocVersions(productID);
      
      // 根据页面类型选择正确的TOC对象
      let tocData;
      if (pageType === 'DemoEdit' && versions.demoToc && versions.demoToc.tocItemDrafts) {
        tocData = versions.demoToc;
      } else {
        // 默认使用 helpdoc 的 TOC
        tocData = versions.toc;
      }
      
      // 保存TOC数据
      this.tocData = tocData;
      return tocData;
    } catch (error) {
      console.error('获取TOC数据失败:', error);
      throw new Error(this.t('tocDataMissing'));
    }
  }

  // 更新TOC导出状态
  updateTOCExportStatus(message, type = 'info') {
    const statusDiv = this.container.querySelector('#toc-export-status') || this.container.querySelector('#export-status');
    if (statusDiv) {
      statusDiv.className = `export-status ${type}`;
      statusDiv.innerHTML = `<p class="${type}">${this.escapeHtml(message)}</p>`;
    }
  }

  // 更新导出状态
  updateExportStatus(message, type = 'info') {
    const statusDiv = this.container.querySelector('#export-status');
    if (statusDiv) {
      statusDiv.className = `export-status ${type}`;
      statusDiv.innerHTML = `<p class="${type}">${this.escapeHtml(message)}</p>`;
    }
  }

  // 处理导出操作
  async handleExport() {
    try {
      // 检查JSZip是否加载
      if (!window.JSZip) {
        throw new Error(this.t('jsZipMissing'));
      }

      // 禁用导出按钮
      const exportBtn = this.container.querySelector('.export-confirm-btn');
      if (exportBtn) {
        exportBtn.disabled = true;
        exportBtn.textContent = this.t('exporting');
      }

      // 获取导出选项
      const createFolders = this.container.querySelector('#export-with-folder').checked;
      const includeTitle = this.container.querySelector('#export-include-title').checked;

      // 更新状态
      this.updateExportStatus(this.t('preparingExport'), 'info');

      // 调用导出方法
      await this.exportMarkdownFiles(createFolders, includeTitle);

      // 显示成功消息
      this.updateExportStatus(this.t('exportDone'), 'success');
      this.showStatus(this.t('markdownExportDone'), 'success');
    } catch (error) {
      console.error('导出失败:', error);
      this.updateExportStatus(this.t('exportFailed', { message: error.message }), 'error');
      this.showError(this.t('exportFailed', { message: error.message }));
    } finally {
      // 启用导出按钮
      const exportBtn = this.container.querySelector('.export-confirm-btn');
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.textContent = this.t('startExport');
      }
    }
  }

  // 导出 Markdown 文件
  async exportMarkdownFiles(createFolders, includeTitle) {
    const zip = new window.JSZip();
    let fileCount = 0;
    
    // 使用 BaseComponent 的 processDocuments 方法处理所有文档
    await this.processDocuments(async (docData) => {
      const { content, item } = docData;
      
      if (!content || !content.markdownContent) {
        console.warn(`跳过无内容的文档: ${item.text}`);
        return;
      }

      // 使用tocItemId作为文件名
      let fileName = item.tocItemId ? `${item.tocItemId}.md` : this.sanitizeFileName(item.text) + '.md';
      
      // 构建文件路径（如果需要创建文件夹）
      let filePath = '';
      if (createFolders && item.documentPath) {
        // 从 documentPath 提取路径
        let folderPath = item.documentPath;
        // 移除开头的斜杠
        if (folderPath.startsWith('/')) {
          folderPath = folderPath.substring(1);
        }
        // 移除文件名部分
        const lastSlashIndex = folderPath.lastIndexOf('/');
        if (lastSlashIndex > 0) {
          filePath = folderPath.substring(0, lastSlashIndex) + '/';
        }
      }

      // 构建完整的文件内容
      let fileContent = content.markdownContent;
      
      // 如果需要包含标题
      if (includeTitle && item.text) {
        fileContent = `# ${item.text}\n\n${fileContent}`;
      }

      // 添加到zip文件
      zip.file(filePath + fileName, fileContent);
      fileCount++;
    });

    // 生成zip文件并下载
    if (fileCount > 0) {
      this.updateExportStatus(this.t('generatingZip'), 'info');
      
      try {
        const content = await zip.generateAsync({ type: 'blob' });
        this.downloadFile('markdown-export.zip', content);
      } catch (error) {
        console.error('生成ZIP文件失败:', error);
        throw new Error(this.t('generateZipFailed'));
      }
    } else {
      throw new Error(this.t('noMarkdown'));
    }
  }

  // 清理文件名，移除或替换特殊字符
  sanitizeFileName(fileName) {
    if (!fileName) return `file-${Date.now()}`;
    
    return fileName
      .replace(/[<>:"/\\|?*]/g, '_') // 移除 Windows 不允许的字符
      .replace(/\s+/g, ' ') // 替换多个空格为单个空格
      .trim() // 移除首尾空格
      .substring(0, 200); // 限制文件名长度
  }

  // 下载文件
  downloadFile(filename, content, mimeType = 'text/markdown;charset=utf-8;') {
    // 创建 Blob
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    
    // 创建下载链接
    const link = document.createElement('a');
    
    // 创建 URL
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    // 添加到 DOM 并触发点击
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 释放 URL 对象
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }
}

export default ExportMarkdownComponent;
