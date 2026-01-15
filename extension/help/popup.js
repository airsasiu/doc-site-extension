document.addEventListener('DOMContentLoaded', () => {
  // 打开侧边栏按钮
  document.getElementById('openSidebar').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.sidePanel.open({ tabId: tabs[0].id });
    });
    window.close();
  });
  
  // 打开配置页面按钮
  document.getElementById('openOptions').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
    window.close();
  });
  
  // 打开帮助文档按钮
  document.getElementById('openHelp').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('help/help.html') });
    window.close();
  });
}); 