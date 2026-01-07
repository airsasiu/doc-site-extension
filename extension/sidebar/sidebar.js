import SearchComponent from './components/search/SearchComponent.js';
import CheckComponent from './components/check/CheckComponent.js';
import ProgressBar from './components/progress/ProgressBar.js';
import EnglishDocComponent from './components/EnglishDocComponent.js';
import BatchAddComponent from './components/BatchAddComponent.js';

document.addEventListener('DOMContentLoaded', () => {
  const progressBar = new ProgressBar('.search-progress-container');
  const searchComponent = new SearchComponent(progressBar);
  const checkComponent = new CheckComponent(progressBar);
  const englishDocComponent = new EnglishDocComponent();
  const batchAddComponent = new BatchAddComponent(progressBar);
  
  // 绑定事件监听
  document.querySelector('.search-button')
    .addEventListener('click', () => searchComponent.handleSearch());
    
  document.querySelector('.routine-check-button')
    .addEventListener('click', () => checkComponent.handleCheck());
    
  document.querySelector('.recheck-button')
    .addEventListener('click', () => checkComponent.recheckErrorPages());
    
  document.querySelector('.clear-results')
    .addEventListener('click', () => {
      checkComponent.clearResults();
      searchComponent.clearResults();
    });
    
  // 绑定批量添加页面按钮事件
  document.querySelector('.batch-add-button')
    .addEventListener('click', () => batchAddComponent.openModal());
}); 