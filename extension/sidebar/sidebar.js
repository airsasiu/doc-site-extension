import SearchComponent from './components/search/SearchComponent.js';
import CheckComponent from './components/check/CheckComponent.js';
import ProgressBar from './components/progress/ProgressBar.js';
import BatchAddComponent from './components/BatchAddComponent.js';
import ExportMarkdownComponent from './components/export/ExportMarkdownComponent.js';
import URLUtils from './services/urlUtils.js';
import DocsAPI from './services/api.js';

document.addEventListener('DOMContentLoaded', () => {
  // 为每个tab创建独立的进度条
  const searchProgressBar = new ProgressBar('#search-tab .search-progress-container');
  const documentOperationsProgressBar = new ProgressBar('#document-operations-tab .document-progress-container');
  const pageOperationsProgressBar = new ProgressBar('#page-operations-tab .batch-progress-container');
  
  // 使用对应的进度条初始化组件
  const searchComponent = new SearchComponent(searchProgressBar);
  const checkComponent = new CheckComponent(searchProgressBar);
  const exportMarkdownComponent = new ExportMarkdownComponent(documentOperationsProgressBar);
  const batchAddComponent = new BatchAddComponent(pageOperationsProgressBar);
  
  // 主要Tab切换功能
  const mainTabs = document.querySelectorAll('.main-tab-btn');
  const mainTabContents = document.querySelectorAll('.main-tab-content');
  
  mainTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      
      // 移除所有active类
      mainTabs.forEach(t => t.classList.remove('active'));
      mainTabContents.forEach(c => c.classList.remove('active'));
      
      // 添加当前tab的active类
      tab.classList.add('active');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
  
  // 绑定事件监听
  document.querySelector('.search-button')
    .addEventListener('click', () => searchComponent.handleSearch());
    
  document.querySelector('.routine-check-button')
    .addEventListener('click', () => checkComponent.handleCheck());
    

  
  // 监听来自 content script 的消息
  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.type === 'copyEnglishDoc') {
      console.log('收到复制英文文档请求:', request);
      await handleCopyEnglishDoc(request, sendResponse);
      return true; // 保持消息通道打开
    }
  });
}); 
