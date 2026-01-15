import SearchComponent from './components/search/SearchComponent.js';
import CheckComponent from './components/check/CheckComponent.js';
import ProgressBar from './components/progress/ProgressBar.js';
import BatchAddComponent from './components/BatchAddComponent.js';
import URLUtils from './services/urlUtils.js';
import DocsAPI from './services/api.js';

document.addEventListener('DOMContentLoaded', () => {
  const progressBar = new ProgressBar('.search-progress-container');
  const searchComponent = new SearchComponent(progressBar);
  const checkComponent = new CheckComponent(progressBar);
  const batchAddComponent = new BatchAddComponent(progressBar);
  
  // 绑定事件监听
  document.querySelector('.search-button')
    .addEventListener('click', () => searchComponent.handleSearch());
    
  document.querySelector('.routine-check-button')
    .addEventListener('click', () => checkComponent.handleCheck());
    

    
  // 绑定批量添加页面按钮事件
  document.querySelector('.batch-add-button')
    .addEventListener('click', () => batchAddComponent.openModal());
  
  // 监听来自 content script 的消息
  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.type === 'copyEnglishDoc') {
      console.log('收到复制英文文档请求:', request);
      await handleCopyEnglishDoc(request, sendResponse);
      return true; // 保持消息通道打开
    }
  });
}); 
