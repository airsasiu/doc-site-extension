// 处理 Markdown 中的图片和链接
(function() {
  console.log('Markdown link processor script loaded and executing');
  
  try {
    // 获取选中的文本
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    console.log('Selected text:', selectedText);
    
    if (!selectedText) {
      window.docSiteUtils.showNotification('未选择任何文本', 'error');
      return;
    }
    
    // 处理 Markdown 链接
    processMarkdownLinks(selectedText);
    
  } catch (error) {
    console.error("处理 Markdown 链接时出错:", error);
    window.docSiteUtils.showNotification(`处理链接时出错: ${error.message}`, 'error');
  }
})();

// 处理 Markdown 中的图片和链接
async function processMarkdownLinks(markdown) {
  let processedMarkdown = markdown;
  let imageCount = 0;
  let linkCount = 0;
  let processedImages = 0;
  let processedLinks = 0;
  
  // 匹配所有链接，预先计算总数
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  let totalItems = 0;
  let imageMatches = [];
  let linkMatches = [];
  let match;
  
  // 计算图片总数
  while ((match = imageRegex.exec(markdown)) !== null) {
    const imageUrl = match[2];
    if (!isImageAlreadyProcessed(imageUrl)) {
      imageMatches.push(match);
      totalItems++;
    }
  }
  
  // 计算链接总数
  while ((match = linkRegex.exec(markdown)) !== null) {
    // 跳过图片链接（已经处理过）
    if (match[0].startsWith('![')) {
      continue;
    }
    const url = match[2];
    if (!isLinkAlreadyProcessed(url)) {
      linkMatches.push(match);
      totalItems++;
    }
  }
  
  if (totalItems === 0) {
    window.docSiteUtils.showNotification('未找到需要处理的图片或链接', 'info');
    return;
  }
  
  // 显示开始处理的提示和焦点提醒
  window.docSiteUtils.showNotification(`开始处理 ${totalItems} 个项目...\n\n⚠️ 处理过程中请保持焦点在当前浏览器页面，否则剪贴板写入可能会失败`, 'info', 10000);
  
  let processedItems = 0;
  
  // 1. 先处理图片
  processedMarkdown = await processImages(processedMarkdown, (count, total) => {
    imageCount = total;
    processedImages = count;
    processedItems = processedImages + processedLinks;
    window.docSiteUtils.updateProgress(processedItems, totalItems, `正在处理项目 ${processedItems}/${totalItems}`);
  });
  
  // 2. 再处理普通链接
  processedMarkdown = await processLinks(processedMarkdown, (count, total) => {
    linkCount = total;
    processedLinks = count;
    processedItems = processedImages + processedLinks;
    window.docSiteUtils.updateProgress(processedItems, totalItems, `正在处理项目 ${processedItems}/${totalItems}`);
  });
  
  // 3. 复制处理后的文本到剪贴板
  if (processedImages > 0 || processedLinks > 0) {
    await window.docSiteUtils.copyToClipboard(processedMarkdown);
    window.docSiteUtils.showNotification(`处理完成: ${processedImages}/${imageCount} 张图片上传成功, ${processedLinks}/${linkCount} 个链接处理成功。内容已复制到剪贴板，请手动粘贴替换。`, 'success', 8000);
  } else {
    window.docSiteUtils.showNotification('未找到需要处理的图片或链接', 'info');
  }
}

// 处理 Markdown 中的图片
async function processImages(markdown, progressCallback) {
  let result = markdown;
  
  // 匹配 Markdown 图片语法: ![alt](url)
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
  let match;
  let imageMatches = [];
  let processableImages = [];
  
  // 收集所有图片匹配项
  while ((match = imageRegex.exec(markdown)) !== null) {
    imageMatches.push({fullMatch: match[0], altText: match[1], imageUrl: match[2]});
  }
  
  // 过滤出需要处理的图片
  for (const image of imageMatches) {
    if (!isImageAlreadyProcessed(image.imageUrl)) {
      processableImages.push(image);
    }
  }
  
  const totalProcessable = processableImages.length;
  
  if (totalProcessable === 0) {
    if (progressCallback) progressCallback(0, 0);
    return result;
  }
  
  // 获取 rootId，只获取一次
  let rootId = null;
  try {
    rootId = await getRootId();
    console.log('获取到 rootId:', rootId);
  } catch (error) {
    console.error('获取 rootId 失败:', error);
    window.docSiteUtils.showNotification('获取 rootId 失败，无法上传图片', 'error');
    return result;
  }
  
  // 处理每个图片
  for (let i = 0; i < processableImages.length; i++) {
    const {fullMatch, altText, imageUrl} = processableImages[i];
    
    // 上传图片
    try {
      const newUrl = await uploadImage(imageUrl, rootId);
      
      if (newUrl) {
        const newImageMarkdown = `![${altText}](${newUrl})`;
        result = result.replace(fullMatch, newImageMarkdown);
        console.log(`图片上传成功: ${imageUrl} -> ${newUrl}`);
      }
    } catch (error) {
      console.error(`上传图片失败: ${imageUrl}`, error);
    }
    
    // 更新进度
    if (progressCallback) progressCallback(i + 1, totalProcessable);
    
    // 添加延迟，避免服务器过载
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return result;
}

// 处理 Markdown 中的普通链接
async function processLinks(markdown, progressCallback) {
  let result = markdown;
  
  // 匹配 Markdown 链接语法: [text](url)
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  let match;
  let linkMatches = [];
  let processableLinks = [];
  
  // 收集所有链接匹配项
  while ((match = linkRegex.exec(markdown)) !== null) {
    // 跳过图片链接（已经处理过）
    if (match[0].startsWith('![')) {
      continue;
    }
    linkMatches.push({fullMatch: match[0], text: match[1], url: match[2]});
  }
  
  // 过滤出需要处理的链接
  for (const link of linkMatches) {
    if (!isLinkAlreadyProcessed(link.url)) {
      processableLinks.push(link);
    }
  }
  
  const totalProcessable = processableLinks.length;
  
  if (totalProcessable === 0) {
    if (progressCallback) progressCallback(0, 0);
    return result;
  }
  
  // 获取产品 ID
  const productId = getProductIdFromUrl();
  if (!productId) {
    console.error('无法获取产品 ID，跳过链接处理');
    if (progressCallback) progressCallback(0, totalProcessable);
    return result;
  }
  
  // 处理每个链接
  for (let i = 0; i < processableLinks.length; i++) {
    const {fullMatch, text, url} = processableLinks[i];
    
    // 搜索链接
    try {
      const searchResults = await searchDocs(productId, text);
      
      if (searchResults.length > 0) {
        // 使用第一个结果
        const bestMatch = searchResults[0];
        const newLink = `gcdocsite__documentlink?toc-item-id=${bestMatch.tocItemId}`;
        const newLinkMarkdown = `[${text}](${newLink})`;
        result = result.replace(fullMatch, newLinkMarkdown);
        console.log(`链接处理成功: ${url} -> ${newLink}`);
      }
    } catch (error) {
      console.error(`处理链接失败: ${url}`, error);
    }
    
    // 更新进度
    if (progressCallback) progressCallback(i + 1, totalProcessable);
    
    // 添加延迟，避免服务器过载
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return result;
}

// 检查图片是否已经处理过
function isImageAlreadyProcessed(url) {
  return url.includes('docs.grapecity.com.cn/documentsite/api/upload') || 
         url.includes('/DOCUMENT_SITE_LINK_PREFIX_HERE/document-site-files/') ||
         url.includes('docs.grapecity.com.cn/document-site-files/');
}

// 检查链接是否已经处理过
function isLinkAlreadyProcessed(url) {
  return url.startsWith('gcdocsite__documentlink?toc-item-id') ||
         isImageAlreadyProcessed(url);
}

// 从 URL 获取产品 ID
function getProductIdFromUrl() {
  const url = window.location.href;
  const match = url.match(/ArticleEdit\/([^?.]+)/);
    return match ? match[1] : null;
}

// 搜索文档
async function searchDocs(productId, keyword) {
  const url = `https://docs.grapecity.com.cn/documentsite/api/docversion/version/${productId}/tocItem/search?keyword=${encodeURIComponent(keyword)}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('搜索请求失败');
  }
  
  const data = await response.json();
  
  // 合并所有结果
  const allResults = [
    ...(data.helpDocResult || []),
    ...(data.apiDocResult || []),
    ...(data.demoDocResult || [])
  ];
  
  // 排序：完全匹配的结果放在前面
  const keywordLower = keyword.toLowerCase();
  allResults.sort((a, b) => {
    const aExactMatch = a.text.toLowerCase() === keywordLower || a.displayName.toLowerCase() === keywordLower;
    const bExactMatch = b.text.toLowerCase() === keywordLower || b.displayName.toLowerCase() === keywordLower;
    
    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;
    return 0;
  });
  
  return allResults;
}

// 上传图片到服务器
async function uploadImage(imageUrl, rootId) {
  try {
    console.log('开始上传图片:', imageUrl);
    
    let blob;
    
    // 通过 background script 获取图片
    console.log('通过 background script 获取图片...');
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'fetchImage', url: imageUrl }, response => {
        if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error(response ? response.error : '获取图片失败'));
        }
      });
    });
    
    // 将 base64 转换回 blob
    const base64Data = response.data.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // 根据图片类型设置 MIME type
    const isGif = imageUrl.toLowerCase().endsWith('.gif');
    blob = new Blob([bytes], { type: isGif ? 'image/gif' : 'image/png' });
    
    console.log('成功获取图片数据');
    
    // 获取并清理文件名
    const originalFilename = getFilenameFromUrl(imageUrl);
    const cleanFilename = sanitizeFilename(originalFilename);
    console.log(`清理文件名: ${originalFilename} -> ${cleanFilename}`);
    
    // 创建 FormData 对象
    const formData = new FormData();
    formData.append('file', blob, cleanFilename);
    
    // 添加 rootId
    if (rootId) {
      formData.append('rootId', rootId);
    }
    
    // 上传到服务器
    const uploadResponse = await fetch('https://docs.grapecity.com.cn/documentsite/api/document/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`上传失败: ${uploadResponse.status}`);
    }
    
    // 尝试解析响应
    const responseText = await uploadResponse.text();
    console.log('上传响应文本:', responseText);
    
    // 检查响应是否是URL格式
    if (responseText && (
        responseText.startsWith('/DOCUMENT_SITE_LINK_PREFIX_HERE/') || 
        responseText.startsWith('http') ||
        responseText.startsWith('/')
      )) {
      // 直接返回URL字符串
      return responseText;
    } else {
      // 尝试解析为JSON
      try {
        const result = JSON.parse(responseText);
        if (result && result.url) {
          return result.url;
        } else {
          console.error('上传成功但返回的数据无效:', result);
          return null;
        }
      } catch (e) {
        console.error('解析响应失败:', e);
        return null;
      }
    }
  } catch (error) {
    console.error('上传图片时出错:', error);
    return null;
  }
}

// 清理文件名，移除或替换特殊字符
function sanitizeFilename(filename) {
  if (!filename) return `image-${Date.now()}.png`;
  
  // 提取文件扩展名
  const lastDotIndex = filename.lastIndexOf('.');
  let name = filename;
  let extension = '';
  
  if (lastDotIndex !== -1) {
    name = filename.substring(0, lastDotIndex);
    extension = filename.substring(lastDotIndex);
  }
  
  // 移除或替换特殊字符
  name = name
    .replace(/[%&=?+#]/g, '') // 移除URL特殊字符
    .replace(/[^\w\-\.]/g, '_') // 将其他非字母数字字符替换为下划线
    .replace(/_{2,}/g, '_') // 将多个连续下划线替换为单个下划线
    .replace(/^_+|_+$/g, ''); // 移除开头和结尾的下划线
  
  // 如果名称为空，使用时间戳
  if (!name) {
    name = `image-${Date.now()}`;
  }
  
  // 确保扩展名是有效的
  if (!extension || !/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(extension)) {
    // 尝试从MIME类型推断扩展名
    extension = '.png'; // 默认为.png
  }
  
  return name + extension;
}

// 获取当前文档的 rootId
async function getRootId() {
  try {
    // 从URL中获取产品ID
    const url = window.location.href;
    const match = url.match(/ArticleEdit\/([^?\/]+)/);
    if (!match || !match[1]) {
      console.warn('无法从URL获取产品ID');
      return null;
    }
    
    const productId = match[1];
    console.log('获取到产品ID:', productId);
    
    // 请求API获取TOC信息
    const response = await fetch(`https://docs.grapecity.com.cn/documentsite/api/docversion/version/${productId}`);
    if (!response.ok) {
      throw new Error(`获取TOC信息失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 从返回数据中提取tocId
    if (data && data.toc && data.toc.tocItemDrafts && data.toc.tocItemDrafts.length > 0) {
      const tocId = data.toc.tocItemDrafts[0].tocId;
      console.log('获取到tocId:', tocId);
      return tocId;
    } else {
      console.warn('无法从API响应中获取tocId');
      return null;
    }
  } catch (error) {
    console.error('获取rootId时出错:', error);
    throw error; // 向上传递错误，因为这是关键步骤
  }
}

// 从URL中提取文件名
function getFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    return filename || `image-${Date.now()}.png`;
  } catch (e) {
    return `image-${Date.now()}.png`;
  }
}