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
      
      // 首先注入prettier库
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['scripts/prettier/standalone.js', 'scripts/prettier/parser-babel.js']
      });
      
      // 然后注入并执行格式化脚本
      console.log('Injecting format-code.js...');
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['scripts/format-code.js']
      });
      
      console.log('Format script injected and executed');
    } catch (error) {
      console.error('Error during format operation:', error);
    }
  }
});

// 在文档站点页面加载时注入span标签检测脚本
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.includes('docs.grapecity.com.cn')) {
    console.log('文档站点页面加载完成，注入span标签检测脚本');
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['scripts/span-observer.js']
    }).catch(error => console.error('注入span-observer.js时出错:', error));
  }
});

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