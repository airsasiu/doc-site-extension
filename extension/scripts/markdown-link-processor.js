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
  
  // 匹配所有链接，预先计算总数和收集匹配项
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
  // 使用负向前瞻断言，确保链接前面不是感叹号，避免匹配到图片链接
  const linkRegex = /(?<!\!)\[(.*?)\]\((.*?)\)/g;
  let totalItems = 0;
  let imageMatches = [];
  let linkMatches = [];
  let match;
  
  // 计算图片总数并收集需要处理的图片匹配项
  while ((match = imageRegex.exec(markdown)) !== null) {
    const imageUrl = match[2];
    if (!isImageAlreadyProcessed(imageUrl)) {
      imageMatches.push({fullMatch: match[0], altText: match[1], imageUrl: imageUrl});
      totalItems++;
    }
  }
  
  // 计算链接总数并收集需要处理的链接匹配项
  while ((match = linkRegex.exec(markdown)) !== null) {
    // 跳过图片链接（已经处理过）
    if (match[0].startsWith('![')) {
      continue;
    }
    const url = match[2];
    if (!isLinkAlreadyProcessed(url)) {
      linkMatches.push({fullMatch: match[0], text: match[1], url: url});
      totalItems++;
    }
  }
  
  if (totalItems === 0) {
    window.docSiteUtils.showNotification('未找到需要处理的图片或链接', 'info');
    return;
  }
  
  // 显示开始处理的提示和焦点提醒
  window.docSiteUtils.showNotification(`开始处理 ${totalItems} 个项目...\n\n⚠️ 处理过程中请保持焦点在当前浏览器页面，否则剪贴板写入可能会失败`, 'info', 10000);
  
  // 1. 先处理图片
  imageCount = imageMatches.length;
  processedMarkdown = await processImages(processedMarkdown, imageMatches, (count) => {
    processedImages = count;
    const processedItems = processedImages + processedLinks;
    window.docSiteUtils.updateProgress(processedItems, totalItems, `正在处理项目 ${processedItems}/${totalItems}`);
  });
  
  // 2. 再处理普通链接
  linkCount = linkMatches.length;
  processedMarkdown = await processLinks(processedMarkdown, linkMatches, (count) => {
    processedLinks = count;
    const processedItems = processedImages + processedLinks;
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
async function processImages(markdown, imageMatches, progressCallback) {
  let result = markdown;
  
  if (imageMatches.length === 0) {
    if (progressCallback) progressCallback(0);
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
  for (let i = 0; i < imageMatches.length; i++) {
    const {fullMatch, altText, imageUrl} = imageMatches[i];
    
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
    if (progressCallback) progressCallback(i + 1);
    
    // 添加延迟，避免服务器过载
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return result;
}

// 从Chrome存储加载配置
async function loadConfig() {
  return new Promise((resolve) => {
    // 检查是否在浏览器环境中
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get(['docSiteHelperConfig'], (result) => {
        resolve(result.docSiteHelperConfig || {});
      });
    } else {
      // 非浏览器环境，返回默认配置
      resolve({
        linkRules: {
          "java": {
            "apiPathPattern": "/document-solutions/.*?/api/online/",
            "replaceWith": "/"
          },
          "js": {
            "apiPathPattern": "/api/",
            "replaceWith": "/"
          },
          "csharp": {
            "apiPathPattern": "/api/",
            "replaceWith": "/"
          }
        }
      });
    }
  });
}

// 检测产品类型
function detectProductType(path, versionInfo) {
  // 从 versionInfo 中提取产品类型
  if (versionInfo && versionInfo.apiRootPath) {
    if (versionInfo.apiRootPath.includes('/java/')) {
      return 'java';
    } else if (versionInfo.apiRootPath.includes('/js/') || versionInfo.apiRootPath.includes('/javascript/')) {
      return 'js';
    } else if (versionInfo.apiRootPath.includes('/csharp/') || versionInfo.apiRootPath.includes('/dotnet/')) {
      return 'csharp';
    }
  }
  
  // 从路径中检测
  if (path.includes('/java/')) {
    return 'java';
  } else if (path.includes('/js/') || path.includes('/javascript/')) {
    return 'js';
  } else if (path.includes('/csharp/') || path.includes('/dotnet/')) {
    return 'csharp';
  }
  
  // 默认返回 java
  return 'java';
}

// 应用链接处理规则
function applyLinkRules(path, productType, linkRules) {
  if (!linkRules || !linkRules[productType]) {
    return path;
  }
  
  const rule = linkRules[productType];
  if (rule.apiPathPattern && rule.replaceWith !== undefined) {
    const regex = new RegExp(rule.apiPathPattern, 'i');
    return path.replace(regex, rule.replaceWith);
  }
  
  return path;
}

// 处理 docs.grapecity.com.cn 开头的链接或相对地址链接
async function processGrapeCityLink(url, text, productId, versionInfo) {
  try {
    let originalPath = '';
    let hash = '';
    let isExternalUrl = false;
    
    // 判断是外部 URL 还是相对地址
    if (url.startsWith('https://docs.grapecity.com.cn/')) {
      // 外部 URL 处理
      isExternalUrl = true;
      const urlObj = new URL(url);
      originalPath = urlObj.pathname;
      hash = urlObj.hash; // 提取锚点部分
    } else if (url.startsWith('/')) {
      // 相对地址处理（以 / 开头）
      originalPath = url;
      // 提取锚点部分
      const hashIndex = url.indexOf('#');
      if (hashIndex !== -1) {
        hash = url.substring(hashIndex);
        originalPath = url.substring(0, hashIndex);
      }
    } else {
      // 非目标链接，直接返回
      return null;
    }
    
    if (!originalPath) {
      return null;
    }
    
    let documentPath = '';
    
    // 根据 URL 判断是普通文档还是 API 文档
    const isApiDoc = originalPath.includes('/api/');
    
    if (isApiDoc && versionInfo.apiRootPath) {
      // API 文档处理
      const apiRoot = versionInfo.apiRootPath;
      
      if (originalPath.startsWith(apiRoot)) {
        // 绝对路径且匹配 apiRootPath，提取相对于 apiRootPath 的路径
        documentPath = originalPath.substring(apiRoot.length) || '/';
      } else if (originalPath.startsWith('/')) {
        // 相对地址，应用链接处理规则
        const config = await loadConfig();
        const productType = detectProductType(originalPath, versionInfo);
        
        // 应用配置的链接处理规则
        const processedPath = applyLinkRules(originalPath, productType, config.linkRules);
        documentPath = processedPath;
      } else {
        // 其他情况，直接使用原始路径
        documentPath = originalPath;
      }
    } else if (!isApiDoc && versionInfo.rootPath) {
      // 普通文档处理
      const docRoot = versionInfo.rootPath;
      if (originalPath.startsWith(docRoot)) {
        // 绝对路径且匹配 rootPath，提取相对于 rootPath 的路径
        documentPath = originalPath.substring(docRoot.length) || '/';
      } else if (originalPath.startsWith('/')) {
        // 相对地址，应用链接处理规则
        const config = await loadConfig();
        const productType = detectProductType(originalPath, versionInfo);
        
        // 应用配置的链接处理规则
        const processedPath = applyLinkRules(originalPath, productType, config.linkRules);
        documentPath = processedPath;
      } else {
        // 其他情况，直接使用原始路径
        documentPath = originalPath;
      }
    } else {
      // 无法确定文档类型或缺少根路径信息，应用链接处理规则
      const config = await loadConfig();
      const productType = detectProductType(originalPath, versionInfo);
      const processedPath = applyLinkRules(originalPath, productType, config.linkRules);
      documentPath = processedPath;
    }
    
    // 发送请求获取对应的 tocItem
    // 直接使用documentPath，不进行完整的URL编码，因为服务器可能期望原始的路径格式
    const response = await fetch(`https://docs.grapecity.com.cn/documentsite/api/docversion/version/${productId}/tocItem?documentPath=${documentPath}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // 检查是否获取到了有效的 tocItemId
    if (data && data.tocItemId) {
      // 保留锚点
      const newLink = `gcdocsite__documentlink?toc-item-id=${data.tocItemId}${hash}`;
      return `[${text}](${newLink})`;
    }
    
    return null;
  } catch (error) {
    console.error(`处理链接失败: ${url}`, error);
    return null;
  }
}

// 从API获取版本信息
async function getVersionFromApi(productId) {
  try {
    const response = await fetch(`https://docs.grapecity.com.cn/documentsite/api/docversion/version/${productId}?includeDetail=false`);
    if (!response.ok) {
      throw new Error('获取版本信息失败');
    }
    
    const data = await response.json();
    if (data && data.name) {
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('获取版本信息时出错:', error);
    return null;
  }
}

// 处理 Markdown 中的普通链接
async function processLinks(markdown, linkMatches, progressCallback) {
  let result = markdown;
  
  if (linkMatches.length === 0) {
    if (progressCallback) progressCallback(0);
    return result;
  }
  
  // 获取产品 ID
  const productId = getProductIdFromUrl();
  if (!productId) {
    console.error('无法获取产品 ID，跳过链接处理');
    if (progressCallback) progressCallback(0);
    return result;
  }
  
  // 获取实际版本信息
  const versionInfo = await getVersionFromApi(productId);
  if (!versionInfo) {
    console.error('无法获取版本信息，跳过链接处理');
    if (progressCallback) progressCallback(0);
    return result;
  }
  
  // 处理每个链接
  for (let i = 0; i < linkMatches.length; i++) {
    const {fullMatch, text, url} = linkMatches[i];
    let newLinkMarkdown = null;
    
    // 1. 首先尝试处理 docs.grapecity.com.cn 开头的链接或相对地址
    if (url.startsWith('https://docs.grapecity.com.cn/') || url.startsWith('/')) {
      newLinkMarkdown = await processGrapeCityLink(url, text, productId, versionInfo);
    }
    
    // 2. 如果不是目标链接，或者处理失败，尝试搜索链接
    if (!newLinkMarkdown) {
      try {
        let hash = '';
        // 只有当url是绝对地址时才尝试解析
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
          const urlObj = new URL(url);
          hash = urlObj.hash; // 提取锚点部分
        } else if (url) {
          // 处理相对地址的锚点
          const hashIndex = url.indexOf('#');
          if (hashIndex !== -1) {
            hash = url.substring(hashIndex);
          }
        }
        
        const searchResults = await searchDocs(productId, text);
        
        if (searchResults.length > 0) {
          // 使用第一个结果
          const bestMatch = searchResults[0];
          const newLink = `gcdocsite__documentlink?toc-item-id=${bestMatch.tocItemId}${hash}`;
          newLinkMarkdown = `[${text}](${newLink})`;
        }
      } catch (error) {
        console.error(`处理链接失败: ${url}`, error);
      }
    }
    
    // 更新链接
    if (newLinkMarkdown) {
      result = result.replace(fullMatch, newLinkMarkdown);
      console.log(`链接处理成功: ${url} -> ${newLinkMarkdown}`);
    }
    
    // 更新进度
    if (progressCallback) progressCallback(i + 1);
    
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