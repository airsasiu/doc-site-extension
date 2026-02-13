import BaseComponent from '../base/BaseComponent.js';
import DocsAPI from '../../services/api.js';
import URLUtils from '../../services/urlUtils.js';
import { extractPreservedContent, mergeContent } from '../../../utils/contentMerger.js';

class ExportMarkdownComponent extends BaseComponent {
  constructor(progressBar) {
    super(progressBar);
    this.initContent();
    this.loadJSZip();
  }

  initContent() {
    // 获取文档操作tab元素
    const documentOperationsTab = document.getElementById('document-operations-tab');
    
    // 创建导出操作内容区域
    const exportContent = document.createElement('div');
    exportContent.className = 'export-operations-content';
    exportContent.innerHTML = `
      <div class="export-tabs">
        <button class="export-tab-btn active" data-tab="export-markdown">导出 Markdown</button>
        <button class="export-tab-btn" data-tab="rewrite-markdown">重写文档</button>
        <button class="export-tab-btn" data-tab="export-params">批量导出参数</button>
        <button class="export-tab-btn" data-tab="import-markdown">导入 Markdown</button>
      </div>
      
      <!-- 导出操作内容 -->
      <div class="export-content">
        <!-- 导出 Markdown 选项卡 -->
        <div class="export-tab-content active" id="export-markdown-tab">
          <div class="form-group">
            <label>导出设置:</label>
            <div class="export-options">
              <div class="export-option">
                <input type="checkbox" id="export-with-folder" checked>
                <label for="export-with-folder">按目录结构创建文件夹</label>
              </div>
              <div class="export-option">
                <input type="checkbox" id="export-include-title" checked>
                <label for="export-include-title">包含页面标题</label>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>导出状态:</label>
            <div class="export-status" id="export-status">
              <p>准备就绪</p>
            </div>
          </div>
        </div>
        
        <!-- 重写文档选项卡 -->
        <div class="export-tab-content" id="rewrite-markdown-tab">
          <div class="form-group">
            <label>重写设置:</label>
            <div class="rewrite-options">
              <div class="rewrite-option">
                <input type="text" id="rewrite-download-url" placeholder="输入下载URL">
                <label for="rewrite-download-url">下载 URL</label>
              </div>
              <div class="rewrite-option">
                <button class="analyze-btn" id="analyze-jscodemine-btn">从当前页面分析 jscodemine 链接</button>
                <label>分析链接</label>
              </div>
              <div class="rewrite-option">
                <input type="checkbox" id="rewrite-force" checked>
                <label for="rewrite-force">强制重写（清除缓存）</label>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>分析结果:</label>
            <div class="analyze-result" id="analyze-result">
              <p>点击上方按钮从当前页面分析 jscodemine 链接</p>
            </div>
          </div>
          <div class="form-group">
            <label>重写状态:</label>
            <div class="rewrite-status" id="rewrite-status">
              <p>准备就绪</p>
            </div>
          </div>
          <div class="form-group">
            <label>重写进度:</label>
            <div class="rewrite-progress" id="rewrite-progress">
              <p>等待开始</p>
            </div>
          </div>
          <div class="form-group">
            <label>重写结果:</label>
            <div class="rewrite-result" id="rewrite-result">
              <p>无结果</p>
            </div>
          </div>
        </div>
        
        <!-- 批量导出参数选项卡 -->
        <div class="export-tab-content" id="export-params-tab">
          <div class="form-group">
            <label>导出设置:</label>
            <div class="export-params-options">
              <div class="export-params-option">
                <input type="checkbox" id="export-params-include-jscodemine" checked>
                <label for="export-params-include-jscodemine">包含 jscodemine 链接</label>
              </div>
              <div class="export-params-option">
                <input type="checkbox" id="export-params-include-metadata" checked>
                <label for="export-params-include-metadata">包含文档元数据</label>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>导出状态:</label>
            <div class="export-params-status" id="export-params-status">
              <p>准备就绪</p>
            </div>
          </div>
          <div class="form-group">
            <label>导出进度:</label>
            <div class="export-params-progress" id="export-params-progress">
              <p>等待开始</p>
            </div>
          </div>
        </div>
        
        <!-- 导入 Markdown 选项卡 -->
        <div class="export-tab-content" id="import-markdown-tab">
          <div class="form-group">
            <label>导入设置:</label>
            <div class="import-options">
              <div class="import-option">
                <input type="file" id="import-file" accept=".zip,.md">
                <label for="import-file">选择文件 (ZIP或MD)</label>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>导入状态:</label>
            <div class="import-status" id="import-status">
              <p>准备就绪</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="export-actions">
        <button class="export-confirm-btn" id="export-action-btn">开始导出</button>
        <button class="export-confirm-btn" id="export-toc-btn">下载 TOC</button>
        <button class="export-confirm-btn" id="rewrite-action-btn">开始重写</button>
        <button class="export-confirm-btn" id="export-params-action-btn">批量导出参数</button>
        <button class="import-confirm-btn" id="import-action-btn">开始导入</button>
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
      this.showError('无法加载JSZip库，导出功能可能无法正常工作');
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
    
    // 绑定文档重写按钮事件
    const rewriteBtn = this.container.querySelector('#rewrite-action-btn');
    if (rewriteBtn) {
      rewriteBtn.addEventListener('click', () => this.handleRewrite());
    }
    
    // 绑定分析jscodemine链接按钮事件
    const analyzeBtn = this.container.querySelector('#analyze-jscodemine-btn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => this.analyzeJscodemineLinks());
    }
    
    // 绑定导入按钮事件
    const importBtn = this.container.querySelector('#import-action-btn');
    if (importBtn) {
      importBtn.addEventListener('click', () => this.handleImport());
    }
    
    // 绑定批量导出参数按钮事件
    const exportParamsBtn = this.container.querySelector('#export-params-action-btn');
    if (exportParamsBtn) {
      exportParamsBtn.addEventListener('click', () => this.handleExportParams());
    }
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
      });
    });
  }

  // 处理导入操作
  async handleImport() {
    try {
      // 禁用导入按钮
      const importBtn = this.container.querySelector('.import-confirm-btn');
      if (importBtn) {
        importBtn.disabled = true;
        importBtn.textContent = '导入中...';
      }

      // 更新状态
      this.updateImportStatus('正在准备导入...', 'info');

      // 这里可以添加导入逻辑
      // 例如：读取文件、解析内容、上传到服务器等

      // 显示成功消息
      this.updateImportStatus('导入功能开发中...', 'info');
      this.showStatus('导入功能开发中', 'info');
    } catch (error) {
      console.error('导入失败:', error);
      this.updateImportStatus(`导入失败: ${error.message}`, 'error');
      this.showError(`导入失败: ${error.message}`);
    } finally {
      // 启用导入按钮
      const importBtn = this.container.querySelector('.import-confirm-btn');
      if (importBtn) {
        importBtn.disabled = false;
        importBtn.textContent = '开始导入';
      }
    }
  }

  // 处理文档重写操作
  async handleRewrite() {
    try {
      // 禁用重写按钮
      const rewriteBtn = this.container.querySelector('#rewrite-action-btn');
      if (rewriteBtn) {
        rewriteBtn.disabled = true;
        rewriteBtn.textContent = '重写中...';
      }

      // 获取下载URL
      let downloadUrl = this.container.querySelector('#rewrite-download-url').value.trim();
      if (!downloadUrl) {
        throw new Error('请输入下载URL');
      }

      // 处理jscodemine链接，添加handler=DownloadProject参数
      if (downloadUrl.includes('jscodemine.grapecity.com')) {
        if (!downloadUrl.includes('?handler=DownloadProject')) {
          // 检查是否已有查询参数
          const separator = downloadUrl.includes('?') ? '&' : '?';
          downloadUrl += `${separator}handler=DownloadProject`;
        }
      }

      // 获取强制重写选项
      const forceRewrite = this.container.querySelector('#rewrite-force').checked;

      // 获取Node服务器地址
      const config = await this.getConfig();
      const SERVER_URL = config.nodeServerUrl;
      if (!SERVER_URL) {
        throw new Error('请在配置页面设置Node服务器地址');
      }

      // 如果强制重写，先清除缓存
      if (forceRewrite) {
        this.updateRewriteStatus('正在清除缓存...', 'info');
        this.updateRewriteProgress('清除缓存中...');
        
        try {
          // 计算缓存键（使用下载URL的SHA256哈希）
          const cacheKey = await this.generateCacheKey(downloadUrl);
          
          // 构建缓存清理URL
          const cacheUrl = `${SERVER_URL}/api/cache/${cacheKey}`;
          
          // 发送清除缓存请求
          const cacheResult = await new Promise((resolve) => {
            chrome.runtime.sendMessage(
              { 
                type: 'clearCache', 
                cacheUrl: cacheUrl 
              },
              (response) => {
                resolve(response);
              }
            );
          });
          
          if (cacheResult && cacheResult.success) {
            this.updateRewriteStatus('缓存清除成功，开始重写文档...', 'info');
            this.updateRewriteProgress('缓存清除成功，开始重写...');
          } else {
            console.warn('缓存清除失败或无响应，继续执行重写');
            this.updateRewriteStatus('缓存清除失败，继续重写文档...', 'info');
            this.updateRewriteProgress('缓存清除失败，继续重写...');
          }
        } catch (cacheError) {
          console.warn('清除缓存时出错，继续执行重写:', cacheError);
          this.updateRewriteStatus('清除缓存时出错，继续重写文档...', 'info');
          this.updateRewriteProgress('清除缓存时出错，继续重写...');
        }
      } else {
        // 更新状态
        this.updateRewriteStatus('正在重写文档...', 'info');
        this.updateRewriteProgress('开始重写文档...');
      }
      
      this.updateRewriteResult('无结果');

      // 通过 background script 发送请求，避免 CORS 错误
      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { 
            type: 'rewriteDocument', 
            serverUrl: SERVER_URL, 
            downloadUrl: downloadUrl 
          },
          (response) => {
            resolve(response);
          }
        );
      });

      if (!result.success) {
        throw new Error(result.error || '文档重写失败');
      }

      // 处理响应数据
      const data = result.data;
      const lines = data.split('\n');
      let markdown = '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const parsedData = JSON.parse(line.substring(6));
            
            if (parsedData.type === 'chunk') {
              // 实时更新进度
              markdown += parsedData.content;
              this.updateRewriteProgress(`已生成 ${markdown.length} 字符...`);
              this.updateRewriteResult(markdown);
            } else if (parsedData.type === 'complete') {
              // 生成完成
              markdown = parsedData.result.content;
              this.updateRewriteStatus('✓ 文档重写成功！', 'success');
              this.updateRewriteProgress('重写完成');
              this.updateRewriteResult(markdown);
              
              // 复制到剪贴板
              try {
                await navigator.clipboard.writeText(markdown);
                this.showStatus('重写结果已复制到剪贴板', 'success');
              } catch (clipboardError) {
                console.warn('无法复制到剪贴板:', clipboardError);
              }
            } else if (parsedData.type === 'error') {
              throw new Error(parsedData.error);
            }
          } catch (jsonError) {
            console.warn('解析响应数据失败:', jsonError);
          }
        }
      }

      // 如果没有处理任何数据，显示错误信息
      if (!markdown) {
        throw new Error('无法解析服务器响应数据');
      }

      // 获取当前页面需要保留的内容
      const currentTab = await this.getCurrentTab();
      const originalMarkdown = await this.getOriginalMarkdown(currentTab.id);
      
      // 拼接保留的内容到重写后的markdown末尾
      if (originalMarkdown) {
        markdown = mergeContent(markdown, originalMarkdown);
        this.updateRewriteResult(markdown);
      }

      // 将拼接后的内容写回到当前页面的编辑器中
      await this.writeMarkdownToEditor(currentTab.id, markdown);

    } catch (error) {
      console.error('文档重写失败:', error);
      this.updateRewriteStatus(`✗ 重写失败`, 'error');
      this.updateRewriteProgress('重写失败');
      this.updateRewriteResult(error.message);
      this.showError(`文档重写失败: ${error.message}`);
    } finally {
      // 启用重写按钮
      const rewriteBtn = this.container.querySelector('#rewrite-action-btn');
      if (rewriteBtn) {
        rewriteBtn.disabled = false;
        rewriteBtn.textContent = '开始重写';
      }
    }
  }

  // 获取当前标签页
  async getCurrentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]);
      });
    });
  }

  // 获取当前页面的原始markdown内容
  async getOriginalMarkdown(tabId) {
    return new Promise((resolve) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          func: () => {
            // 获取当前页面的markdown内容
            function getCurrentMarkdown() {
              const editorContainer = document.querySelector('.toastui-editor.md-mode');
              if (editorContainer) {
                const textarea = editorContainer.querySelector('textarea');
                if (textarea) {
                  return textarea.value;
                }
              }
              return '';
            }

            const currentMarkdown = getCurrentMarkdown();
            console.log('获取到原始markdown内容，长度:', currentMarkdown.length);
            return currentMarkdown;
          }
        },
        (results) => {
          if (results && results[0] && results[0].result) {
            resolve(results[0].result);
          } else {
            resolve('');
          }
        }
      );
    });
  }

  // 获取当前页面需要保留的内容（用于其他可能的用途）
  async getPreservedContent(tabId) {
    const originalMarkdown = await this.getOriginalMarkdown(tabId);
    if (!originalMarkdown) {
      return '';
    }
    return extractPreservedContent(originalMarkdown);
  }

  // 将markdown内容写回到编辑器中
  async writeMarkdownToEditor(tabId, markdown) {
    return new Promise((resolve) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          func: (content) => {
            // 查找编辑框容器
            const editorContainer = document.querySelector('.toastui-editor.md-mode');
            if (editorContainer) {
              // 查找textarea元素
              let textarea = editorContainer.querySelector('textarea');
              if (!textarea) {
                // 如果找不到textarea，尝试查找可能的隐藏textarea或其他输入元素
                textarea = editorContainer.querySelector('textarea, input[type="text"]');
              }
              
              if (textarea) {
                // 设置textarea的值
                textarea.value = content;
                
                // 触发input事件，让编辑器检测到内容变化
                textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                
                console.log('Markdown内容已成功写入编辑器');
                return true;
              }
            }
            console.log('无法找到编辑器元素');
            return false;
          },
          args: [markdown]
        },
        (results) => {
          if (results && results[0] && results[0].result) {
            this.showStatus('重写后的内容已成功写入编辑器', 'success');
          } else {
            this.showStatus('无法写入编辑器，内容已复制到剪贴板', 'info');
          }
          resolve();
        }
      );
    });
  }

  // 获取配置
  async getConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['docSiteHelperConfig'], (result) => {
        const config = result.docSiteHelperConfig || {};
        resolve(config);
      });
    });
  }

  // 更新重写状态
  updateRewriteStatus(message, type = 'info') {
    const statusDiv = this.container.querySelector('#rewrite-status');
    if (statusDiv) {
      statusDiv.innerHTML = `<p class="${type}">${message}</p>`;
    }
  }

  // 更新重写进度
  updateRewriteProgress(message) {
    const progressDiv = this.container.querySelector('#rewrite-progress');
    if (progressDiv) {
      progressDiv.innerHTML = `<p>${message}</p>`;
    }
  }

  // 更新重写结果
  updateRewriteResult(result) {
    const resultDiv = this.container.querySelector('#rewrite-result');
    if (resultDiv) {
      resultDiv.innerHTML = `<pre>${result}</pre>`;
    }
  }

  // 分析当前页面的jscodemine链接
  async analyzeJscodemineLinks() {
    try {
      // 更新分析结果状态
      this.updateAnalyzeResult('正在分析页面...');

      // 获取当前标签页URL
      const currentUrl = await URLUtils.getCurrentTabUrl();
      const productID = URLUtils.getProductIDFromURL(currentUrl);
      const pageType = URLUtils.getPageTypeFromURL(currentUrl);
      
      if (!productID) {
        throw new Error('无法获取产品ID，请确保在文档编辑页面使用此扩展');
      }

      // 从URL中提取tocItemId
      const urlParams = new URLSearchParams(currentUrl.split('?')[1] || '');
      const tocItemId = urlParams.get('tocItemId');
      
      if (!tocItemId) {
        throw new Error('无法获取页面ID，请确保在文档编辑页面使用此扩展');
      }

      // 获取TOC数据
      const tocData = await this.getTOCData();
      
      // 从TOC数据中查找正确的ID
      const tocItem = this.findTocItemById(tocData.tocItemDrafts, tocItemId);
      
      if (!tocItem || !tocItem.id) {
        throw new Error('无法从TOC数据中找到页面信息，请确保文档结构已加载');
      }
      
      console.log('找到的TOC项:', tocItem);
      console.log('使用的页面ID:', tocItem.id);

      // 获取当前页面的markdown内容
      const docContent = await DocsAPI.getDocContent(tocItem.id, productID, pageType);
      
      if (!docContent || typeof docContent !== 'object') {
        throw new Error('无法获取页面内容，API返回的数据格式不正确');
      }

      // 尝试从不同的属性中获取markdown内容
      const markdown = docContent.markdownContent || docContent.content;
      
      if (!markdown) {
        throw new Error('无法获取页面内容，API返回的数据中没有markdown内容');
      }

      // 分析jscodemine链接
      const jscodemineLinks = this.extractJscodemineLinks(markdown);

      if (jscodemineLinks.length === 0) {
        this.updateAnalyzeResult('未找到jscodemine链接');
        this.showStatus('未找到jscodemine链接', 'info');
      } else {
        // 显示分析结果
        const linksText = jscodemineLinks.map((link, index) => `${index + 1}. ${link}`).join('\n');
        this.updateAnalyzeResult(`找到 ${jscodemineLinks.length} 个jscodemine链接:\n${linksText}`);
        
        // 自动填充第一个链接到下载URL输入框
        this.container.querySelector('#rewrite-download-url').value = jscodemineLinks[0];
        
        this.showStatus(`成功分析出 ${jscodemineLinks.length} 个jscodemine链接`, 'success');
      }

    } catch (error) {
      console.error('分析jscodemine链接失败:', error);
      this.updateAnalyzeResult(`分析失败: ${error.message}`);
      this.showError(`分析失败: ${error.message}`);
    }
  }

  // 递归查找TOC中指定ID的项
  findTocItemById(tocData, targetId) {
    // 处理数组类型的TOC
    if (Array.isArray(tocData)) {
      for (const item of tocData) {
        const result = this.findTocItemById(item, targetId);
        if (result) {
          return result;
        }
      }
    }
    // 处理对象类型的TOC项
    else if (typeof tocData === 'object' && tocData !== null) {
      // 检查当前项
      if (tocData.tocItemId === targetId || tocData.id === targetId) {
        return tocData;
      }
      
      // 递归检查子项
      const childrenKeys = ['children', 'items', 'tocItemDrafts', 'subItems', 'subsections'];
      for (const key of childrenKeys) {
        if (tocData[key]) {
          const result = this.findTocItemById(tocData[key], targetId);
          if (result) {
            return result;
          }
        }
      }
    }
    
    return null;
  }

  // 从markdown内容中提取jscodemine链接
  extractJscodemineLinks(markdown) {
    const links = [];
    
    // 1. 提取所有markdown链接
    const linkRegex = /(?<!\!)\[(.*?)\]\((.*?)\)/g;
    let match;
    while ((match = linkRegex.exec(markdown)) !== null) {
      const url = match[2];
      if (url.includes('jscodemine')) {
        links.push(url);
      }
    }
    
    // 2. 匹配codemineBlock中的链接
    const codemineBlockRegex = /\$\$codemineBlock[\s\S]*?"exportedShaToken":"([^"]+)"[\s\S]*?\$\$/g;
    while ((match = codemineBlockRegex.exec(markdown)) !== null) {
      const token = match[1];
      const codemineLink = `https://jscodemine.grapecity.com/share/${token}`;
      links.push(codemineLink);
    }
    
    // 3. 去重
    return [...new Set(links)];
  }

  // 更新分析结果
  updateAnalyzeResult(message) {
    const resultDiv = this.container.querySelector('#analyze-result');
    if (resultDiv) {
      resultDiv.innerHTML = `<p>${message}</p>`;
    }
  }

  // 处理TOC导出操作
  async handleExportTOC() {
    try {
      // 禁用下载TOC按钮
      const exportTOCBtn = this.container.querySelector('#export-toc-btn');
      if (exportTOCBtn) {
        exportTOCBtn.disabled = true;
        exportTOCBtn.textContent = '下载中...';
      }

      // 更新状态
      this.updateTOCExportStatus('正在获取TOC结构...', 'info');

      // 获取TOC结构
      const tocData = await this.getTOCData();

      // 转换为JSON格式
      const tocJson = JSON.stringify(tocData, null, 2);

      // 生成文件名
      const fileName = `toc-${Date.now()}.json`;

      // 下载文件
      this.downloadFile(fileName, tocJson);

      // 显示成功消息
      this.updateTOCExportStatus('TOC下载完成！', 'success');
      this.showStatus('TOC下载完成', 'success');
    } catch (error) {
      console.error('TOC导出失败:', error);
      this.updateTOCExportStatus(`TOC导出失败: ${error.message}`, 'error');
      this.showError(`TOC导出失败: ${error.message}`);
    } finally {
      // 启用下载TOC按钮
      const exportTOCBtn = this.container.querySelector('#export-toc-btn');
      if (exportTOCBtn) {
        exportTOCBtn.disabled = false;
        exportTOCBtn.textContent = '下载 TOC';
      }
    }
  }

  // 获取TOC数据
  async getTOCData() {
    // 如果已有TOC数据，直接返回
    if (this.tocData) {
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
        throw new Error('无法获取产品ID，请确保在文档编辑页面使用此扩展');
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
      throw new Error('无法获取TOC数据，请确保已加载文档结构');
    }
  }

  // 更新导入状态
  updateImportStatus(message, type = 'info') {
    const statusDiv = this.container.querySelector('#import-status');
    if (statusDiv) {
      statusDiv.innerHTML = `<p class="${type}">${message}</p>`;
    }
  }

  // 更新TOC导出状态
  updateTOCExportStatus(message, type = 'info') {
    const statusDiv = this.container.querySelector('#toc-export-status');
    if (statusDiv) {
      statusDiv.innerHTML = `<p class="${type}">${message}</p>`;
    }
  }

  // 更新导出状态
  updateExportStatus(message, type = 'info') {
    const statusDiv = this.container.querySelector('#export-status');
    if (statusDiv) {
      statusDiv.innerHTML = `<p class="${type}">${message}</p>`;
    }
  }

  // 更新导出参数状态
  updateExportParamsStatus(message, type = 'info') {
    const statusDiv = this.container.querySelector('#export-params-status');
    if (statusDiv) {
      statusDiv.innerHTML = `<p class="${type}">${message}</p>`;
    }
  }

  // 更新导出参数进度
  updateExportParamsProgress(message) {
    const progressDiv = this.container.querySelector('#export-params-progress');
    if (progressDiv) {
      progressDiv.innerHTML = `<p>${message}</p>`;
    }
  }

  // 处理批量导出参数操作
  async handleExportParams() {
    try {
      // 禁用批量导出参数按钮
      const exportParamsBtn = this.container.querySelector('#export-params-action-btn');
      if (exportParamsBtn) {
        exportParamsBtn.disabled = true;
        exportParamsBtn.textContent = '导出中...';
      }

      // 获取导出选项
      const includeJscodemine = this.container.querySelector('#export-params-include-jscodemine').checked;
      const includeMetadata = this.container.querySelector('#export-params-include-metadata').checked;

      // 更新状态
      this.updateExportParamsStatus('正在准备导出参数...', 'info');
      this.updateExportParamsProgress('开始收集文档参数...');

      // 调用导出参数方法
      await this.exportRewriteParams(includeJscodemine, includeMetadata);

      // 显示成功消息
      this.updateExportParamsStatus('导出参数完成！', 'success');
      this.updateExportParamsProgress('导出参数完成');
      this.showStatus('批量导出参数完成', 'success');
    } catch (error) {
      console.error('导出参数失败:', error);
      this.updateExportParamsStatus(`导出失败: ${error.message}`, 'error');
      this.updateExportParamsProgress('导出失败');
      this.showError(`导出参数失败: ${error.message}`);
    } finally {
      // 启用批量导出参数按钮
      const exportParamsBtn = this.container.querySelector('#export-params-action-btn');
      if (exportParamsBtn) {
        exportParamsBtn.disabled = false;
        exportParamsBtn.textContent = '批量导出参数';
      }
    }
  }

  // 导出重写文档参数
  async exportRewriteParams(includeJscodemine, includeMetadata) {
    let paramsData = [];
    let processedCount = 0;
    let totalCount = 0;
    
    // 获取TOC数据以计算总文档数
    const tocData = await this.getTOCData();
    totalCount = this.countTocItems(tocData);
    
    // 使用 BaseComponent 的 processDocuments 方法处理所有文档
    await this.processDocuments(async (docData) => {
      const { content, item } = docData;
      
      if (!content || !content.markdownContent) {
        console.warn(`跳过无内容的文档: ${item.text}`);
        processedCount++;
        this.updateExportParamsProgress(`处理中... ${processedCount}/${totalCount}`);
        return;
      }

      // 构建文档参数对象
      const docParams = {
        id: item.tocItemId || item.id,
        title: item.text,
        path: item.documentPath || '',
        metadata: includeMetadata ? {
          level: item.level || 0,
          isFolder: item.isFolder || false,
          hasChildren: item.children && item.children.length > 0
        } : {}
      };

      // 如果需要包含jscodemine链接，提取链接
      if (includeJscodemine) {
        const markdown = content.markdownContent;
        const jscodemineLinks = this.extractJscodemineLinks(markdown);
        docParams.jscodemineLinks = jscodemineLinks;
      }

      // 添加到参数数据数组
      paramsData.push(docParams);
      processedCount++;
      this.updateExportParamsProgress(`处理中... ${processedCount}/${totalCount}`);
    });

    // 如果没有处理任何数据，显示错误信息
    if (paramsData.length === 0) {
      throw new Error('没有找到可导出的文档参数');
    }

    // 生成文件名
    const fileName = `rewrite-params-${Date.now()}.json`;

    // 转换为JSON格式
    const paramsJson = JSON.stringify(paramsData, null, 2);

    // 下载文件
    this.downloadFile(fileName, paramsJson);
  }

  // 计算TOC中的项目数量
  countTocItems(tocData) {
    let count = 0;
    
    function traverse(items) {
      if (Array.isArray(items)) {
        items.forEach(item => {
          count++;
          if (item.children && Array.isArray(item.children)) {
            traverse(item.children);
          }
        });
      } else if (typeof tocData === 'object' && tocData !== null) {
        if (tocData.tocItemDrafts && Array.isArray(tocData.tocItemDrafts)) {
          traverse(tocData.tocItemDrafts);
        } else if (tocData.children && Array.isArray(tocData.children)) {
          traverse(tocData.children);
        }
      }
    }
    
    traverse(tocData.tocItemDrafts || tocData.children || []);
    return count;
  }

  // 处理导出操作
  async handleExport() {
    try {
      // 检查JSZip是否加载
      if (!window.JSZip) {
        throw new Error('JSZip库未加载，请稍后重试');
      }

      // 禁用导出按钮
      const exportBtn = this.container.querySelector('.export-confirm-btn');
      if (exportBtn) {
        exportBtn.disabled = true;
        exportBtn.textContent = '导出中...';
      }

      // 获取导出选项
      const createFolders = this.container.querySelector('#export-with-folder').checked;
      const includeTitle = this.container.querySelector('#export-include-title').checked;

      // 更新状态
      this.updateExportStatus('正在准备导出...', 'info');

      // 调用导出方法
      await this.exportMarkdownFiles(createFolders, includeTitle);

      // 显示成功消息
      this.updateExportStatus('导出完成！', 'success');
      this.showStatus('Markdown 导出完成', 'success');
    } catch (error) {
      console.error('导出失败:', error);
      this.updateExportStatus(`导出失败: ${error.message}`, 'error');
      this.showError(`导出失败: ${error.message}`);
    } finally {
      // 启用导出按钮
      const exportBtn = this.container.querySelector('.export-confirm-btn');
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.textContent = '开始导出';
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
      this.updateExportStatus('正在生成ZIP文件...', 'info');
      
      try {
        const content = await zip.generateAsync({ type: 'blob' });
        this.downloadFile('markdown-export.zip', content);
      } catch (error) {
        console.error('生成ZIP文件失败:', error);
        throw new Error('生成ZIP文件失败');
      }
    } else {
      throw new Error('没有找到可导出的Markdown内容');
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
  downloadFile(filename, content) {
    // 创建 Blob
    const blob = content instanceof Blob ? content : new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    
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

  // 生成缓存键（使用SHA256哈希）
  async generateCacheKey(url) {
    try {
      // 编码URL
      const encoder = new TextEncoder();
      const data = encoder.encode(url);
      
      // 计算SHA256哈希
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      
      // 转换为十六进制字符串
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return hashHex;
    } catch (error) {
      console.error('生成缓存键失败:', error);
      // 如果哈希生成失败，使用时间戳和随机数作为备选
      return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }
}

export default ExportMarkdownComponent;