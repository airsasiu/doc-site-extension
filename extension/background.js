// 添加初始化日志
console.log('Background script loaded');

// 处理快捷键命令
chrome.commands.onCommand.addListener(async (command) => {
  console.log('Command received:', command);
  
  if (command === "format_code") {
    console.log('Format code command triggered');
    
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('Active tab:', tabs[0]);
      const activeTab = tabs[0];
      
      // 使用内联代码注入prettier
      console.log('Injecting prettier directly...');
      
      // 首先注入prettier库
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: injectPrettier
      });
      
      // 然后执行格式化
      console.log('Executing format function...');
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: formatCode
      });
      
      console.log('Format command completed');
    } catch (error) {
      console.error('Error during format operation:', error);
    }
  }
});

// 注入prettier库
function injectPrettier() {
  return new Promise((resolve) => {
    // 如果prettier已经加载，直接返回
    if (window.prettier && window.prettierPlugins) {
      console.log('Prettier already loaded');
      resolve();
      return;
    }
    
    console.log('Loading prettier from CDN...');
    
    // 加载prettier
    const prettierScript = document.createElement('script');
    prettierScript.src = 'https://cdn.jsdelivr.net/npm/prettier@2.8.8/standalone.js';
    prettierScript.onload = () => {
      console.log('Prettier loaded');
      
      // 加载babel解析器
      const babelScript = document.createElement('script');
      babelScript.src = 'https://cdn.jsdelivr.net/npm/prettier@2.8.8/parser-babel.js';
      babelScript.onload = () => {
        console.log('Babel parser loaded');
        resolve();
      };
      document.head.appendChild(babelScript);
    };
    document.head.appendChild(prettierScript);
  });
}

// 格式化代码
function formatCode() {
  console.log('formatCode function called');
  try {
    // 获取选中的文本
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    console.log('Selected text:', selectedText ? `${selectedText.substring(0, 50)}...` : 'none');
    
    if (!selectedText) {
      showNotification('没有选中任何文本', 'error');
      return;
    }
    
    // 检查prettier是否可用
    if (typeof prettier === 'undefined') {
      console.error('Prettier is not defined!');
      showNotification('格式化库未加载', 'error');
      return;
    }
    
    // 使用prettier格式化代码
    console.log('Formatting code with prettier...');
    const formattedCode = prettier.format(selectedText, {
      parser: "babel",
      plugins: prettierPlugins,
      semi: true,
      singleQuote: true,
      tabWidth: 2
    });
    
    console.log('Code formatted successfully');
    
    // 替换选中的文本
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(formattedCode));
      console.log('Replaced selected text with formatted code');
    }
    
    showNotification('代码格式化成功', 'success');
  } catch (error) {
    console.error("格式化代码时出错:", error);
    showNotification(`格式化失败: ${error.message}`, 'error');
  }
}

// 显示通知
function showNotification(message, type) {
  console.log(`Showing notification: ${message} (${type})`);
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${type === 'success' ? '#52c41a' : '#ff4d4f'};
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  `;
  document.body.appendChild(notification);
  
  // 3秒后移除通知
  setTimeout(() => {
    notification.remove();
  }, 3000);
}