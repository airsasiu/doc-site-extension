// 添加初始化日志
console.log('Background script loaded');

// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "open_sidebar",
    title: "打开搜索侧边栏",
    contexts: ["page", "selection"]
  });
  
  chrome.contextMenus.create({
    id: "upload_selected_images",
    title: "上传选中文本中的图片",
    contexts: ["selection"]
  });
  
  chrome.contextMenus.create({
    id: "remove_br_tags",
    title: "移除选中文本中的换行标签",
    contexts: ["selection"]
  });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "open_sidebar") {
    await chrome.sidePanel.open({ tabId: tab.id });
  } else if (info.menuItemId === "upload_selected_images") {
    try {
      // 先注入工具脚本
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['scripts/utils.js']
      });
      
      // 然后注入并执行图片上传脚本
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['scripts/image-uploader.js']
      });
      
      console.log('Image upload script injected and executed');
    } catch (error) {
      console.error('Error during image upload operation:', error);
    }
  } else if (info.menuItemId === "remove_br_tags") {
    try {
      // 先注入工具脚本
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['scripts/utils.js']
      });
      
      // 然后执行移除换行符脚本
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: removeBrTagsFromSelection
      });
      
      console.log('BR tags removal executed');
    } catch (error) {
      console.error('Error during BR tags removal:', error);
    }
  }
});

// 从选中文本中移除换行标签和多余空行的函数
function removeBrTagsFromSelection() {
  try {
    // 获取选中的文本
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    if (!selectedText) {
      window.docSiteUtils.showNotification('未选择任何文本', 'error');
      return;
    }
    
    // 清理 Markdown
    const processedText = window.docSiteUtils.cleanupMarkdown(selectedText);
    
    // 复制到剪贴板
    window.docSiteUtils.copyToClipboard(processedText)
      .then(() => {
        window.docSiteUtils.showNotification('换行标签和多余空行已移除，内容已复制到剪贴板，请手动粘贴替换。', 'success', 5000);
      })
      .catch(err => {
        console.error('复制到剪贴板失败:', err);
        window.docSiteUtils.showNotification('复制到剪贴板失败: ' + err.message, 'error');
      });
  } catch (error) {
    console.error('处理换行标签和空行时出错:', error);
    window.docSiteUtils.showNotification('处理换行标签和空行时出错: ' + error.message, 'error');
  }
}

// 处理快捷键命令
chrome.commands.onCommand.addListener(async (command) => {
  console.log('Command triggered:', command);
  
  // 获取当前活动标签页
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  
  if (command === "format_code") {
    console.log('Format code command triggered');
    
    try {
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
  } else if (command === "check_span_tags") {
    console.log('Check span tags command triggered');
    
    try {
      // 首先确保脚本已注入
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['scripts/span-checker.js']
      });
      
      // 然后执行检查函数
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => {
          if (typeof window.checkForSpanTags === 'function') {
            window.checkForSpanTags();
          } else {
            console.error('checkForSpanTags 函数未找到');
          }
        }
      });
      
      console.log('Span check completed');
    } catch (error) {
      console.error('Error during span check operation:', error);
    }
  } else if (command === "upload_images") {
    console.log('Upload images command triggered');
    
    try {
      // 先注入工具脚本
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['scripts/utils.js']
      });
      
      // 然后注入并执行图片上传脚本
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['scripts/image-uploader.js']
      });
      
      console.log('Image upload script injected and executed');
    } catch (error) {
      console.error('Error during image upload operation:', error);
    }
  } else if (command === "extract_link") {
    console.log('Extract link command triggered');
    
    try {
      // 首先注入工具脚本
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['scripts/utils.js']
      });
      
      // 然后注入并执行链接提取脚本
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['scripts/extract-link.js']
      });
      
      console.log('Link extraction script injected and executed');
    } catch (error) {
      console.error('Error during link extraction:', error);
    }
  } else if (command === "open_help") {
    console.log('Open help command triggered');
    
    try {
      chrome.tabs.create({ url: chrome.runtime.getURL('help/help.html') });
    } catch (error) {
      console.error('Error opening help:', error);
    }
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