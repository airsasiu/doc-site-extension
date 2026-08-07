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
  
  chrome.contextMenus.create({
    id: "clean_link_urls",
    title: "清理选中文本中的链接URL",
    contexts: ["selection"]
  });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "open_sidebar") {
    await chrome.sidePanel.open({ tabId: tab.id });
  } else if (info.menuItemId === "upload_selected_images") {
    try {
      await requestImageHostPermissions(tab, info.selectionText);

      // 先按顺序注入依赖脚本
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [
          'scripts/utils.js',
          'scripts/shared-url-utils.js',
          'scripts/markdown-link-processor.js'
        ]
      });
      
      console.log('Markdown link processor script injected and executed');
    } catch (error) {
      console.error('Error during Markdown link processing:', error);
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
  } else if (info.menuItemId === "clean_link_urls") {
    try {
      // 先注入工具脚本
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['scripts/utils.js']
      });
      
      // 然后注入并执行 Markdown 链接 URL 清理脚本
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['scripts/markdown-link-cleaner.js']
      });
      
      console.log('Markdown link URL cleaner script injected and executed');
    } catch (error) {
      console.error('Error during Markdown link URL cleaning:', error);
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
        files: [
          'scripts/prettier/standalone.js',
          'scripts/prettier/parser-babel.js',
          'scripts/prettier/parser-html.js'
        ]
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
  } else if (command === "upload_images") {
    console.log('Upload images command triggered');
    
    try {
      await requestImageHostPermissions(activeTab);

      // 先按顺序注入依赖脚本
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: [
          'scripts/utils.js',
          'scripts/shared-url-utils.js',
          'scripts/markdown-link-processor.js'
        ]
      });
      
      console.log('Image upload script injected and executed');
    } catch (error) {
      console.error('Error during image upload operation:', error);
    }
  } else if (command === "copy_english_doc") {
    console.log('Copy English doc command triggered');
    
    try {
      // 注入工具脚本和文档复制脚本
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['scripts/utils.js']
      });
      
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['scripts/copy-doc-markdown.js']
      });
      
      console.log('Copy English doc script injected and executed');
    } catch (error) {
      console.error('Error during copy English doc operation:', error);
    }
  } else if (command === "clean_link_urls") {
    console.log('Clean link URLs command triggered');
    
    try {
      // 先注入工具脚本
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['scripts/utils.js']
      });
      
      // 然后注入并执行 Markdown 链接 URL 清理脚本
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['scripts/markdown-link-cleaner.js']
      });
      
      console.log('Markdown link URL cleaner script injected and executed');
    } catch (error) {
      console.error('Error during Markdown link URL cleaning:', error);
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

async function requestImageHostPermissions(tab, selectionText = null) {
  if (!chrome.permissions?.contains || !chrome.permissions?.request || !tab?.id) {
    return;
  }

  const markdown = selectionText || await getSelectedText(tab.id);
  const origins = getImageOriginsFromMarkdown(markdown, tab.url);
  if (origins.length === 0) {
    return;
  }

  const missingOrigins = [];
  for (const origin of origins) {
    const hasPermission = await hasPermissionForOrigins([origin]);
    if (!hasPermission) {
      missingOrigins.push(origin);
    }
  }

  if (missingOrigins.length === 0) {
    return;
  }

  const granted = await requestPermissionsForOrigins(missingOrigins);
  if (!granted) {
    throw new Error(`缺少图片域名访问权限: ${missingOrigins.join(', ')}`);
  }
}

function hasPermissionForOrigins(origins) {
  return new Promise(resolve => {
    chrome.permissions.contains({ origins }, resolve);
  });
}

function requestPermissionsForOrigins(origins) {
  return new Promise(resolve => {
    chrome.permissions.request({ origins }, resolve);
  });
}

async function getSelectedText(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === 'TEXTAREA' ||
          (active.tagName === 'INPUT' && /^(text|search|url|email|tel|password)?$/i.test(active.type || 'text'))) &&
        typeof active.selectionStart === 'number' &&
        typeof active.selectionEnd === 'number'
      ) {
        return active.value.substring(active.selectionStart, active.selectionEnd);
      }

      const selectionText = window.getSelection().toString();
      if (selectionText) {
        return selectionText;
      }

      const toastuiTextarea = document.querySelector('.toastui-editor textarea');
      if (
        toastuiTextarea &&
        typeof toastuiTextarea.selectionStart === 'number' &&
        typeof toastuiTextarea.selectionEnd === 'number'
      ) {
        return toastuiTextarea.value.substring(toastuiTextarea.selectionStart, toastuiTextarea.selectionEnd);
      }

      return '';
    }
  });

  return results?.[0]?.result || '';
}

function getImageOriginsFromMarkdown(markdown, pageUrl) {
  const origins = new Set();
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
  let match;

  while ((match = imageRegex.exec(markdown || '')) !== null) {
    const imageUrl = resolveImageUrlForPermission(match[2], pageUrl);
    const origin = getOriginFromUrl(imageUrl);

    if (origin && !imageUrl.startsWith('data:')) {
      origins.add(`${origin}/*`);
    }
  }

  return [...origins];
}

function resolveImageUrlForPermission(imageUrl, pageUrl) {
  const trimmedUrl = (imageUrl || '').trim();
  if (!trimmedUrl || trimmedUrl.startsWith('data:')) {
    return trimmedUrl;
  }

  if (/^https?:/i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  if (trimmedUrl.startsWith('//')) {
    try {
      return `${new URL(pageUrl).protocol}${trimmedUrl}`;
    } catch (error) {
      return `https:${trimmedUrl}`;
    }
  }

  try {
    return new URL(trimmedUrl, pageUrl).href;
  } catch (error) {
    return trimmedUrl;
  }
}

function getOriginFromUrl(url) {
  try {
    return new URL(url).origin;
  } catch (error) {
    return null;
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

// 添加消息监听器来处理图片请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'fetchImage') {
    if (!request.url) {
      sendResponse({ success: false, error: '缺少图片 URL' });
      return true;
    }

    hasPermissionForUrl(request.url)
      .then(hasPermission => {
        if (!hasPermission) {
          throw new Error(`缺少图片域名访问权限: ${new URL(request.url).origin}/*`);
        }
        return fetch(request.url, { credentials: 'include' });
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const mimeType = response.headers.get('content-type') || 'application/octet-stream';
        return response.arrayBuffer().then(buffer => ({ buffer, mimeType }));
      })
      .then(({ buffer, mimeType }) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }
        sendResponse({
          success: true,
          data: `data:${mimeType};base64,${btoa(binary)}`,
          mimeType
        });
      })
      .catch(error => {
        console.error('获取图片失败:', error);
        sendResponse({ success: false, error: `获取图片失败 (${request.url}): ${error.message}` });
      });
    return true; // 保持消息通道打开
  }

  if (request.type === 'uploadImage') {
    if (!request.url) {
      sendResponse({ success: false, error: '缺少图片 URL' });
      return true;
    }

    uploadImageFromUrl(request.url, request.rootId, request.docApiUrl)
      .then(uploadedUrl => {
        sendResponse({ success: true, data: uploadedUrl });
      })
      .catch(error => {
        console.error('上传图片失败:', error);
        sendResponse({ success: false, error: `上传图片失败 (${request.url}): ${error.message}` });
      });
    return true;
  }
  
  // 处理获取 Markdown 文档的请求
  if (request.type === 'fetchMarkdown') {
    fetch(request.url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(markdown => {
        sendResponse({ success: true, data: markdown });
      })
      .catch(error => {
        console.error('获取 Markdown 失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道打开
  }
  
});

async function uploadImageFromUrl(url, rootId, docApiUrl) {
  const hasPermission = await hasPermissionForUrl(url);
  if (!hasPermission) {
    throw new Error(`缺少图片域名访问权限: ${new URL(url).origin}/*`);
  }

  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const mimeType = response.headers.get('content-type') || getMimeTypeFromUrl(url);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const blob = new Blob([bytes], { type: mimeType });

  const formData = new FormData();
  formData.append('file', blob, sanitizeFilename(getFilenameFromUrl(url)));
  if (rootId) {
    formData.append('rootId', rootId);
  }

  const uploadResponse = await fetch(`${String(docApiUrl || '').replace(/\/+$/, '')}/document/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });

  if (!uploadResponse.ok) {
    throw new Error(`上传失败: ${uploadResponse.status}`);
  }

  const responseText = await uploadResponse.text();
  const uploadedUrl = parseUploadResponse(responseText);
  if (!uploadedUrl) {
    throw new Error('上传成功但返回的数据无效');
  }

  return uploadedUrl;
}

function hasPermissionForUrl(url) {
  let origin;
  try {
    origin = `${new URL(url).origin}/*`;
  } catch (error) {
    return Promise.resolve(false);
  }

  return hasPermissionForOrigins([origin]);
}

function sanitizeFilename(filename) {
  const fallback = `image-${Date.now()}.png`;
  const safeFilename = String(filename || '').trim();
  if (!safeFilename) {
    return fallback;
  }

  const lastDotIndex = safeFilename.lastIndexOf('.');
  let name = lastDotIndex > 0 ? safeFilename.slice(0, lastDotIndex) : safeFilename;
  let extension = lastDotIndex > 0 ? safeFilename.slice(lastDotIndex) : '';

  name = name
    .replace(/[%&=?+#]/g, '')
    .replace(/[^\w\-\.]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!name) {
    name = `image-${Date.now()}`;
  }

  if (!extension || !/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(extension)) {
    extension = '.png';
  }

  return `${name}${extension}`;
}

function getFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const filename = urlObj.pathname.split('/').pop();
    return filename || `image-${Date.now()}.png`;
  } catch (error) {
    return `image-${Date.now()}.png`;
  }
}

function getMimeTypeFromUrl(url) {
  const pathname = (() => {
    try {
      return new URL(url).pathname;
    } catch (error) {
      return url || '';
    }
  })().toLowerCase();

  if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
  if (pathname.endsWith('.gif')) return 'image/gif';
  if (pathname.endsWith('.webp')) return 'image/webp';
  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  if (pathname.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

function parseUploadResponse(responseText) {
  const trimmedText = String(responseText || '').trim();
  if (!trimmedText) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmedText);
    if (typeof parsed === 'string') {
      return parsed.trim();
    }

    if (parsed && typeof parsed === 'object') {
      for (const key of ['url', 'fileUrl', 'fileURL', 'path', 'link', 'href', 'data']) {
        const value = parsed[key];
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }
    }
  } catch (error) {
    if (/^https?:\/\//i.test(trimmedText) || trimmedText.startsWith('/')) {
      return trimmedText;
    }
  }

  return null;
}
