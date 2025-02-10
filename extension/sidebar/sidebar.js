document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('.search-input');
  const searchButton = document.querySelector('.search-button');
  const resultsContainer = document.querySelector('.search-results');
  const routineCheckButton = document.querySelector('.routine-check-button');

  // 从URL中提取productID
  function getProductIDFromURL(url) {
    const match = url.match(/ArticleEdit\/([^?]+)/);
    return match ? match[1] : null;
  }

  // 获取当前标签页的URL
  async function getCurrentTabUrl() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0].url;
  }

  // 获取文档版本信息
  async function getDocVersions(productID) {
    try {
      const response = await fetch(`https://docs.grapecity.com.cn/documentsite/api/docversion/version/${productID}`);
      if (!response.ok) {
        throw new Error('获取文档版本失败');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取文档版本错误:', error);
      throw error;
    }
  }

  // 获取文档内容
  async function getDocContent(docId) {
    try {
      const response = await fetch(`https://docs.grapecity.com.cn/documentsite/api/document/draft/${docId}`);
      if (!response.ok) {
        throw new Error('获取文档内容失败');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取文档内容错误:', error);
      throw error;
    }
  }

  // 搜索文档内容
  function searchInMarkdown(markdown, searchText) {
    if (!markdown || !searchText) return false;
    return markdown.toLowerCase().includes(searchText.toLowerCase());
  }

  // 从markdown中提取相关内容片段
  function extractContext(markdown, searchText, contextLength = 100) {
    const lowerMarkdown = markdown.toLowerCase();
    const lowerSearchText = searchText.toLowerCase();
    const index = lowerMarkdown.indexOf(lowerSearchText);
    if (index === -1) return '';
    
    const start = Math.max(0, index - contextLength);
    const end = Math.min(markdown.length, index + searchText.length + contextLength);
    let context = markdown.substring(start, end);
    
    if (start > 0) context = '...' + context;
    if (end < markdown.length) context = context + '...';
    
    return context;
  }

  // 创建或更新进度显示
  function updateProgress(processedCount, totalCount) {
    let progressContainer = document.querySelector('.search-progress-container');
    let progressDiv = progressContainer.querySelector('.search-progress');
    
    if (!progressDiv) {
      progressDiv = document.createElement('div');
      progressDiv.className = 'search-progress';
      progressContainer.appendChild(progressDiv);
    }
    
    progressDiv.textContent = `检查进度：${processedCount}/${totalCount}`;
  }

  // 在当前标签页导航到指定URL
  async function navigateCurrentTab(url) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      await chrome.tabs.update(tabs[0].id, { url: url });
    }
  }

  // 添加单个搜索结果
  function addSearchResult(result, productID) {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    
    resultItem.innerHTML = `
      <div class="result-title">${result.title}</div>
      <div class="result-content">${result.content}</div>
      <div class="result-path">${result.path}</div>
    `;
    
    resultItem.addEventListener('click', async () => {
      const url = `https://docs.grapecity.com.cn/manage/ArticleEdit/${productID}?tocItemId=${result.tocItemId}`;
      await navigateCurrentTab(url);
    });

    const progressDiv = document.querySelector('.search-progress');
    if (progressDiv) {
      progressDiv.insertAdjacentElement('afterend', resultItem);
    } else {
      resultsContainer.appendChild(resultItem);
    }
  }

  // 初始化搜索结果容器
  function initializeSearchResults() {
    resultsContainer.innerHTML = '';
    const resultsCountDiv = document.createElement('div');
    resultsCountDiv.className = 'results-count';
    resultsCountDiv.textContent = '找到 0 个结果';
    resultsContainer.appendChild(resultsCountDiv);
  }

  // 更新结果计数
  function updateResultsCount(count) {
    const resultsCountDiv = document.querySelector('.results-count');
    if (resultsCountDiv) {
      resultsCountDiv.textContent = `找到 ${count} 个结果`;
    }
  }

  // 搜索实现
  async function performSearch(searchText) {
    initializeSearchResults();
    let resultCount = 0;
    
    try {
      const currentUrl = await getCurrentTabUrl();
      const productID = getProductIDFromURL(currentUrl);
      
      if (!productID) {
        throw new Error('无法获取产品ID');
      }

      const versions = await getDocVersions(productID);
      let processedCount = 0;
      const totalCount = versions.toc.tocItemDrafts.length;
      
      // 遍历所有文档
      for (const item of versions.toc.tocItemDrafts) {
        if (item.id && item.hasDoc) {
          try {
            const docContent = await getDocContent(item.id);
            processedCount++;
            updateProgress(processedCount, totalCount);
            
            if (docContent && docContent.markdownContent) {
              if (searchInMarkdown(docContent.markdownContent, searchText)) {
                const result = {
                  title: docContent.title || item.text || item.displayName,
                  content: extractContext(docContent.markdownContent, searchText),
                  path: item.documentPath,
                  tocItemId: item.tocItemId
                };
                addSearchResult(result, productID);
                resultCount++;
                updateResultsCount(resultCount);
              }
            }
          } catch (error) {
            console.error(`处理文档 ${item.id} 时出错:`, error);
            continue;
          }
        }
      }

      if (resultCount === 0) {
        resultsContainer.innerHTML = '<div class="no-results">未找到相关结果</div>';
      }
    } catch (error) {
      resultsContainer.innerHTML = `<div class="error">搜索出错：${error.message}</div>`;
      console.error('搜索错误:', error);
    }
  }

  // 添加一个变量来跟踪当前搜索
  let currentSearch = null;

  // 修改 performRoutineCheck 函数
  async function performRoutineCheck() {
    // 如果有正在进行的搜索，取消它
    if (currentSearch) {
      currentSearch.abort = true;
    }
    
    // 创建新的搜索上下文
    currentSearch = {
      abort: false
    };
    
    const thisSearch = currentSearch;
    createTabsContainer();
    
    try {
      const currentUrl = await getCurrentTabUrl();
      const productID = getProductIDFromURL(currentUrl);
      
      if (!productID) {
        throw new Error('无法获取产品ID');
      }

      const versions = await getDocVersions(productID);
      let processedCount = 0;
      const totalCount = versions.toc.tocItemDrafts.length;
      
      // 更新初始进度
      updateProgress(processedCount, totalCount);
      
      for (const item of versions.toc.tocItemDrafts) {
        // 检查是否被取消
        if (thisSearch.abort) {
          return;
        }
        
        if (item.id && item.hasDoc) {
          try {
            const docContent = await getDocContent(item.id);
            processedCount++;
            updateProgress(processedCount, totalCount);
            
            if (docContent && docContent.markdownContent) {
              const content = docContent.markdownContent;
              const title = docContent.title || item.text || item.displayName;
              
              // 检查每个配置项
              Object.entries(CHECK_ITEMS).forEach(([key, config]) => {
                if (config.check(content)) {
                  const result = {
                    title,
                    message: typeof config.message === 'function' ? 
                      config.message(content) : config.message,
                    path: item.documentPath,
                    tocItemId: item.tocItemId,
                    productID,
                    id: `${item.id}-${key}` // 用于去重
                  };
                  
                  // 获取或创建该类型的结果集
                  const typeResults = checkResults.get(key) || new Map();
                  // 使用id去重
                  if (!typeResults.has(result.id)) {
                    typeResults.set(result.id, result);
                    checkResults.set(key, typeResults);
                    // 更新对应的tab
                    updateTab(key, Array.from(typeResults.values()));
                  }
                }
              });
            }
          } catch (error) {
            console.error(`处理文档 ${item.id} 时出错:`, error);
            continue;
          }
        }
      }
      
      // 确保最后显示100%的进度
      updateProgress(totalCount, totalCount);
      
    } catch (error) {
      console.error('检查错误:', error);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error';
      errorDiv.textContent = `检查出错：${error.message}`;
      document.querySelector('.tab-content').appendChild(errorDiv);
    } finally {
      // 清理搜索状态
      if (currentSearch === thisSearch) {
        currentSearch = null;
      }
    }
  }

  // 修改按钮事件监听
  routineCheckButton.addEventListener('click', () => {
    routineCheckButton.disabled = true;
    routineCheckButton.textContent = '检查中...';
    
    performRoutineCheck().finally(() => {
      routineCheckButton.disabled = false;
      routineCheckButton.textContent = '常规检查';
    });
  });

  searchButton.addEventListener('click', () => {
    const searchText = searchInput.value.trim();
    if (searchText) {
      searchButton.disabled = true;
      searchButton.textContent = '搜索中...';
      
      performRoutineCheck().finally(() => {
        searchButton.disabled = false;
        searchButton.textContent = '搜索';
      });
    }
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const searchText = searchInput.value.trim();
      if (searchText) {
        searchButton.click();
      }
    }
  });

  // 定义检查项配置
  const CHECK_ITEMS = {
    mescius: {
      label: 'Mescius',
      check: (content) => content.toLowerCase().includes('mescius'),
      message: '包含 "mescius" 字样'
    },
    span: {
      label: 'SPAN 标签',
      check: (content) => content.includes('</span>'),
      message: '包含 SPAN 标签'
    },

    dsProducts: {
      label: '包含 DS 产品字样',
      check: (content) => {
        const products = ['DsExcel', 'DsPdf', 'DsWord'];
        return products.some(p => content.includes(p));

      },
      message: (content) => {
        const products = ['DsExcel', 'DsPdf', 'DsWord'];
        const found = products.filter(p => content.includes(p));
        return `包含 DS 产品字样: ${found.join(', ')}`;
      }
    },
    base64: {
      label: 'Base64',
      check: (content) => content.includes(';base64'),
      message: '可能包含 base64 编码内容，请仔细检查，也可能是代码中包含'
    }
  };

  // 存储所有检查结果
  let checkResults = new Map();

  function createTabsContainer() {
    const tabHeader = document.querySelector('.tab-header');
    const tabContent = document.querySelector('.tab-content');
    const progressContainer = document.querySelector('.search-progress-container');
    const clearResultsContainer = document.querySelector('.clear-results-container');
    
    // 清空现有内容
    tabHeader.innerHTML = '';
    tabContent.innerHTML = '';
    progressContainer.innerHTML = '';
    
    // 添加清除按钮到底部容器
    clearResultsContainer.innerHTML = `
      <button class="clear-results">清除所有结果</button>
    `;
    const clearButton = clearResultsContainer.querySelector('.clear-results');
    clearButton.onclick = clearAllResults;
  }

  function clearAllResults() {
    checkResults.clear();
    createTabsContainer();
  }

  function updateTab(checkType, results) {
    const tabHeader = document.querySelector('.tab-header');
    const tabContent = document.querySelector('.tab-content');
    
    let tabButton = tabHeader.querySelector(`[data-tab="${checkType}"]`);
    let tabPanel = tabContent.querySelector(`[data-tab="${checkType}"]`);
    
    if (results.length === 0) {
      if (tabButton) tabButton.remove();
      if (tabPanel) tabPanel.remove();
      return;
    }
    
    if (!tabButton) {
      tabButton = document.createElement('button');
      tabButton.className = 'tab-button';
      tabButton.setAttribute('data-tab', checkType);
      tabButton.innerHTML = `
        <span>${CHECK_ITEMS[checkType].label}</span>
        <span class="count">${results.length}</span>
        <span class="close">×</span>
      `;
      
      // 添加关闭按钮事件
      const closeBtn = tabButton.querySelector('.close');
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        checkResults.delete(checkType);
        tabButton.remove();
        tabPanel?.remove();
        
        // 如果还有其他tab，切换到第一个
        const firstTab = tabHeader.querySelector('.tab-button');
        if (firstTab) {
          switchTab(firstTab.getAttribute('data-tab'));
        }
      };
      
      tabButton.onclick = () => switchTab(checkType);
      tabHeader.appendChild(tabButton);
    } else {
      tabButton.querySelector('.count').textContent = results.length;
    }
    
    if (!tabPanel) {
      tabPanel = document.createElement('div');
      tabPanel.className = 'tab-panel';
      tabPanel.setAttribute('data-tab', checkType);
      tabContent.appendChild(tabPanel);
    }
    
    updateTabContent(checkType, results);
    
    if (tabHeader.querySelectorAll('.tab-button').length === 1) {
      switchTab(checkType);
    }
  }

  function switchTab(checkType) {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(button => {
      button.classList.toggle('active', button.getAttribute('data-tab') === checkType);
    });
    
    tabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.getAttribute('data-tab') === checkType);
    });
  }

  function updateTabContent(checkType, results) {
    const tabPanel = document.querySelector(`.tab-panel[data-tab="${checkType}"]`);
    tabPanel.innerHTML = ''; // 清空现有内容
    
    results.forEach(result => {
      const resultItem = document.createElement('div');
      resultItem.className = 'result-item';
      
      resultItem.innerHTML = `
        <div class="result-title">${result.title}</div>
        <div class="result-content">${result.message}</div>
        <div class="result-path">${result.path}</div>
      `;
      
      resultItem.addEventListener('click', () => {
        const url = `https://docs.grapecity.com.cn/manage/ArticleEdit/${result.productID}?tocItemId=${result.tocItemId}`;
        navigateCurrentTab(url);
      });
      
      tabPanel.appendChild(resultItem);
    });
  }
}); 