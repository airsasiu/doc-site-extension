(async function() {
function ensureUrlHelpersLoaded() {
  if (typeof getProductIdFromUrl !== 'function' || typeof getProductIdFromCurrentRootUrl !== 'function') {
    throw new Error('共享 URL 工具未加载');
  }
}

const DEFAULT_LINK_LOCALIZATION_RULES = [];
const DOC_API_PATH = '/documentsite/api';

// 处理 Markdown 中的图片和链接
(async function() {
  console.log('Markdown link processor script loaded and executing');
  
  try {
    ensureUrlHelpersLoaded();

    // 获取选中的文本
    const selectedText = getSelectedMarkdownText();
    
    console.log('Selected text:', selectedText);
    
    if (!selectedText) {
      window.docSiteUtils.showNotification('未选择任何文本', 'error');
      return;
    }
    
    // 处理 Markdown 链接
    await processMarkdownLinks(selectedText);
    
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
  let imageProgress = 0;
  let linkProgress = 0;
  const config = await loadConfig();
  
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
    if (!isImageAlreadyProcessed(imageUrl, config)) {
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
    if (!isLinkAlreadyProcessed(url, config)) {
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
  const imageResult = await processImages(processedMarkdown, imageMatches, (count) => {
    imageProgress = count;
    const processedItems = imageProgress + linkProgress;
    window.docSiteUtils.updateProgress(processedItems, totalItems, `正在处理项目 ${processedItems}/${totalItems}`);
  }, config);
  processedMarkdown = imageResult.markdown;
  processedImages = imageResult.successCount;
  
  // 2. 再处理普通链接
  linkCount = linkMatches.length;
  const linkResult = await processLinks(processedMarkdown, linkMatches, (count) => {
    linkProgress = count;
    const processedItems = imageProgress + linkProgress;
    window.docSiteUtils.updateProgress(processedItems, totalItems, `正在处理项目 ${processedItems}/${totalItems}`);
  }, config);
  processedMarkdown = linkResult.markdown;
  processedLinks = linkResult.successCount;
  
  // 3. 复制处理后的文本到剪贴板
  if (processedImages > 0 || processedLinks > 0) {
    await window.docSiteUtils.copyToClipboard(processedMarkdown);
    const failedImages = imageCount - processedImages;
    const failedLinks = linkCount - processedLinks;
    const statusType = failedImages > 0 || failedLinks > 0 ? 'warning' : 'success';
    window.docSiteUtils.showNotification(`处理完成: ${processedImages}/${imageCount} 张图片上传成功, ${processedLinks}/${linkCount} 个链接处理成功。${failedImages + failedLinks > 0 ? `失败 ${failedImages + failedLinks} 个。` : ''}内容已复制到剪贴板，请手动粘贴替换。`, statusType, 8000);
  } else {
    window.docSiteUtils.showNotification(`处理完成，但没有成功替换任何项目。图片 ${processedImages}/${imageCount}，链接 ${processedLinks}/${linkCount}。请打开扩展后台日志查看失败原因。`, 'error', 8000);
  }
}

function getSelectedMarkdownText() {
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

// 处理 Markdown 中的图片
async function processImages(markdown, imageMatches, progressCallback, config = {}) {
  let result = markdown;
  let successCount = 0;
  
  if (imageMatches.length === 0) {
    if (progressCallback) progressCallback(0);
    return { markdown: result, successCount };
  }
  
  // 获取 rootId，只获取一次
  let rootId = null;
  try {
    rootId = await getRootId(config);
    console.log('获取到 rootId:', rootId);
  } catch (error) {
    console.error('获取 rootId 失败:', error);
    window.docSiteUtils.showNotification('获取 rootId 失败，无法上传图片', 'error');
    return { markdown: result, successCount };
  }
  
  // 处理每个图片
  for (let i = 0; i < imageMatches.length; i++) {
    const {fullMatch, altText, imageUrl} = imageMatches[i];
    
    // 上传图片
    try {
      const newUrl = await uploadImage(imageUrl, rootId, config);
      
      if (newUrl) {
        const newImageMarkdown = `![${altText}](${newUrl})`;
        result = result.replace(fullMatch, newImageMarkdown);
        successCount++;
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
  
  return { markdown: result, successCount };
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
        docApiUrl: '',
        linkRules: {
          "default": {
            "apiPathPattern": "/api/",
            "replaceWith": "/"
          }
        },
        linkLocalizationRules: DEFAULT_LINK_LOCALIZATION_RULES
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
    } else if (/(\/csharp\/|\/dotnet\/|-net\/)/i.test(versionInfo.apiRootPath)) {
      return 'csharp';
    }
  }
  
  // 从路径中检测
  if (path.includes('/java/')) {
    return 'java';
  } else if (path.includes('/js/') || path.includes('/javascript/')) {
    return 'js';
  } else if (/(\/csharp\/|\/dotnet\/|-net\/)/i.test(path)) {
    return 'csharp';
  }
  
  // 默认返回 java
  return 'java';
}

// 应用链接处理规则
function applyLinkRules(path, productType, linkRules) {
  if (!linkRules) {
    return path;
  }
  
  const rule = linkRules[productType] || linkRules.default;
  if (!rule) {
    return path;
  }

  if (rule.apiPathPattern && rule.replaceWith !== undefined) {
    const regex = new RegExp(rule.apiPathPattern, 'i');
    return path.replace(regex, rule.replaceWith);
  }
  
  return path;
}

function getLinkLocalizationRules(config) {
  if (Array.isArray(config?.linkLocalizationRules) && config.linkLocalizationRules.length > 0) {
    return config.linkLocalizationRules;
  }

  return DEFAULT_LINK_LOCALIZATION_RULES;
}

function ensureTrailingSlash(path) {
  if (!path) {
    return '';
  }

  return path.endsWith('/') ? path : `${path}/`;
}

function getDocApiUrl(config = {}) {
  if (config.docApiUrl) {
    return config.docApiUrl.replace(/\/+$/, '');
  }

  return `${window.location.origin}${DOC_API_PATH}`;
}

function getDocSiteOrigin(config = {}) {
  try {
    return new URL(getDocApiUrl(config)).origin;
  } catch (error) {
    return window.location.origin;
  }
}

function applyPathReplacements(path, replacements = []) {
  return replacements.reduce((currentPath, replacement) => {
    if (!replacement?.pattern || replacement.replaceWith === undefined) {
      return currentPath;
    }

    return currentPath.replace(new RegExp(replacement.pattern, 'i'), replacement.replaceWith);
  }, path);
}

function buildTargetPath(rule, match, sourcePath) {
  if (rule.targetPath !== undefined) {
    return rule.targetPath.replace(/\$(\d+)/g, (_, index) => match[Number(index)] || '');
  }

  if (match[1] !== undefined) {
    return match[1];
  }

  return sourcePath.replace(new RegExp(rule.sourcePathPattern, 'i'), '');
}

function localizeSourceLink(url, versionInfo, config) {
  if (!url || !versionInfo) {
    return url;
  }

  let urlObj;
  try {
    urlObj = new URL(url);
  } catch (error) {
    return url;
  }

  const rules = getLinkLocalizationRules(config);
  for (const rule of rules) {
    if (rule.sourceHost && urlObj.hostname !== rule.sourceHost) {
      continue;
    }

    if (!rule.sourcePathPattern || !rule.targetRoot) {
      continue;
    }

    const sourceRegex = new RegExp(rule.sourcePathPattern, 'i');
    const match = urlObj.pathname.match(sourceRegex);
    if (!match) {
      continue;
    }

    const targetRoot = ensureTrailingSlash(versionInfo[rule.targetRoot]);
    if (!targetRoot) {
      continue;
    }

    let targetPath = buildTargetPath(rule, match, urlObj.pathname).replace(/^\/+/, '');
    targetPath = applyPathReplacements(targetPath, rule.pathReplacements);

    return `${getDocSiteOrigin(config)}${targetRoot}${targetPath}${urlObj.hash}`;
  }

  return url;
}

function getRootBasePath(rootPath) {
  if (!rootPath) {
    return '';
  }

  const trimmedRoot = rootPath.endsWith('/') ? rootPath.slice(0, -1) : rootPath;
  const parts = trimmedRoot.split('/');
  const lastSegment = parts[parts.length - 1];

  if (/^(v?\d+(?:\.\d+)*|latest)$/i.test(lastSegment)) {
    return `${parts.slice(0, -1).join('/')}/`;
  }

  return `${trimmedRoot}/`;
}

function normalizePathWithRoot(path, rootPath, rootType) {
  if (!path || !rootPath) {
    return path;
  }

  if (path.startsWith(rootPath)) {
    return path;
  }

  const basePath = getRootBasePath(rootPath);
  if (basePath && path.startsWith(basePath)) {
    return rootPath + path.substring(basePath.length);
  }

  let normalizedPath = path;
  const shortPrefix = rootType === 'api' ? '/api/' : '/docs/';

  if (normalizedPath.startsWith(shortPrefix)) {
    normalizedPath = normalizedPath.substring(shortPrefix.length);
    return rootPath + normalizedPath;
  }

  if (rootType === 'api') {
    const apiPathMatch = normalizedPath.match(/\/(classes|interfaces|enums|modules|namespaces)\//i);
    if (apiPathMatch && apiPathMatch.index > 0) {
      normalizedPath = normalizedPath.substring(apiPathMatch.index);
    }
  }

  if (normalizedPath.startsWith('/developer/')) {
    return normalizedPath;
  }

  return rootPath + normalizedPath.replace(/^\//, '');
}

// 处理当前文档站点开头的链接或相对地址链接
async function processDocSiteLink(url, text, productId, versionInfo, config = {}) {
  try {
    let originalPath = '';
    let hash = '';
    let isExternalUrl = false;
    
    // 判断是外部 URL 还是相对地址
    if (isTargetDomain(url, config)) {
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
    isExternalUrl = isTargetDomain(url);
    
    if (isApiDoc && versionInfo.apiRootPath) {
      // API 文档处理
      const apiRoot = versionInfo.apiRootPath;
      const apiBasePath = getRootBasePath(apiRoot);
      
      // 处理路径，确保生成正确的 documentPath
      let processedPath = originalPath;
      
      // 1. 先应用链接处理规则
      const isRootedApiPath = processedPath.startsWith(apiRoot) || (apiBasePath && processedPath.startsWith(apiBasePath));
      if (!isRootedApiPath) {
        const config = await loadConfig();
        const productType = detectProductType(processedPath, versionInfo);
        processedPath = applyLinkRules(processedPath, productType, config.linkRules);
      }

      // 2. 规范化 API 路径，避免把已完整的路径再次拼接到 apiRootPath 后面
      documentPath = normalizePathWithRoot(processedPath, apiRoot, 'api');
    } else if (!isApiDoc && versionInfo.rootPath) {
      // 普通文档处理
      const docRoot = versionInfo.rootPath;
      
      if (originalPath.startsWith(docRoot)) {
        if (isExternalUrl) {
          // 对于外部 URL，使用完整路径
          documentPath = originalPath;
        } else {
          // 对于内部路径，提取相对于 rootPath 的路径
          documentPath = originalPath.substring(docRoot.length) || '/';
        }
      } else if (originalPath.startsWith('/')) {
        // 相对地址处理
        // 1. 先应用链接处理规则
        const config = await loadConfig();
        const productType = detectProductType(originalPath, versionInfo);
        let processedPath = applyLinkRules(originalPath, productType, config.linkRules);

        // 2. 规范化普通文档路径，避免把已带基础路径的链接重复拼接到 rootPath 后面
        documentPath = normalizePathWithRoot(processedPath, docRoot, 'docs');
      } else {
        // 其他情况，直接使用原始路径
        documentPath = originalPath;
      }
    } else {
      // 无法确定文档类型或缺少根路径信息
      // 1. 先应用链接处理规则
      const config = await loadConfig();
      const productType = detectProductType(originalPath, versionInfo);
      let processedPath = applyLinkRules(originalPath, productType, config.linkRules);
      
      // 2. 移除不必要的前缀
      if (processedPath.startsWith('/api/')) {
        processedPath = processedPath.replace(/^\/api\//, '/');
      } else if (processedPath.startsWith('/docs/')) {
        processedPath = processedPath.replace(/^\/docs\//, '/');
      }
      
      documentPath = processedPath;
    }
    
    // 发送请求获取对应的 tocItem
    const response = await fetch(`${getDocApiUrl(config)}/docversion/version/${productId}/tocItem?documentPath=${encodeURIComponent(documentPath)}`);
    
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
async function getVersionFromApi(productId, config = {}) {
  try {
    const response = await fetch(`${getDocApiUrl(config)}/docversion/version/${productId}?includeDetail=false`);
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
async function processLinks(markdown, linkMatches, progressCallback, config = null) {
  let result = markdown;
  let successCount = 0;
  
  if (linkMatches.length === 0) {
    if (progressCallback) progressCallback(0);
    return { markdown: result, successCount };
  }

  config = config || await loadConfig();
  
  // 获取产品 ID
  const productId = getProductIdFromUrl();
  if (!productId) {
    console.error('无法获取产品 ID，跳过链接处理');
    if (progressCallback) progressCallback(0);
    return { markdown: result, successCount };
  }
  
  // 获取实际版本信息
  const versionInfo = await getVersionFromApi(productId, config);
  if (!versionInfo) {
    console.error('无法获取版本信息，跳过链接处理');
    if (progressCallback) progressCallback(0);
    return { markdown: result, successCount };
  }
  
  // 处理每个链接
  for (let i = 0; i < linkMatches.length; i++) {
    const {fullMatch, text, url} = linkMatches[i];
    let newLinkMarkdown = null;
    const localizedUrl = localizeSourceLink(url, versionInfo, config);
    if (localizedUrl !== url) {
      console.log(`英文链接已转换为中文链接: ${url} -> ${localizedUrl}`);
    }
    
    // 1. 首先尝试处理当前文档站开头的链接或相对地址
    if (isTargetDomain(localizedUrl, config) || localizedUrl.startsWith('/')) {
      newLinkMarkdown = await processDocSiteLink(localizedUrl, text, productId, versionInfo, config);
    }
    
    if (!newLinkMarkdown && localizedUrl !== url) {
      newLinkMarkdown = `[${text}](${localizedUrl})`;
      console.warn(`链接未能转换为 internal link，已回退为中文链接: ${url} -> ${localizedUrl}`);
    }

    // 更新链接
    if (newLinkMarkdown) {
      result = result.replace(fullMatch, newLinkMarkdown);
      successCount++;
      console.log(`链接处理成功: ${url} -> ${newLinkMarkdown}`);
    }
    
    // 更新进度
    if (progressCallback) progressCallback(i + 1);
    
    // 添加延迟，避免服务器过载
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return { markdown: result, successCount };
}

// 检查图片是否已经处理过
function isImageAlreadyProcessed(url, config = {}) {
  if (isPlaceholderDocumentSiteImageUrl(url)) {
    return true;
  }

  const docSiteOrigin = getDocSiteOrigin(config);
  return url.includes(`${docSiteOrigin}/documentsite/api/upload`) ||
         url.includes(`${docSiteOrigin}/document-site-files/`);
}

// 检查链接是否已经处理过
function isLinkAlreadyProcessed(url, config = {}) {
  return url.startsWith('gcdocsite__documentlink?toc-item-id') ||
         isImageAlreadyProcessed(url, config);
}

// 检查 URL 是否为当前文档站点
function isTargetDomain(url, config = {}) {
  return url.startsWith(`${getDocSiteOrigin(config)}/`);
}

function isPlaceholderDocumentSiteImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    return new URL(url, window.location.href)
      .pathname
      .startsWith('/DOCUMENT_SITE_LINK_PREFIX_HERE/document-site-files/');
  } catch (error) {
    return url.startsWith('/DOCUMENT_SITE_LINK_PREFIX_HERE/document-site-files/');
  }
}


// 上传图片到服务器
async function uploadImage(imageUrl, rootId, config = {}) {
  try {
    console.log('开始上传图片:', imageUrl);
    const fetchImageUrl = resolveImageUrl(imageUrl, config);
    console.log(`解析图片地址: ${imageUrl} -> ${fetchImageUrl}`);

    if (fetchImageUrl.startsWith('data:')) {
      const response = { success: true, data: fetchImageUrl, mimeType: getMimeTypeFromDataUrl(fetchImageUrl) };
      return uploadImageFromDataUrl(response, rootId, config, fetchImageUrl);
    }

    return await uploadImageViaBackground(fetchImageUrl, rootId, config);
  } catch (error) {
    console.error('上传图片时出错:', error);
    return null;
  }
}

async function uploadImageFromDataUrl(response, rootId, config, fetchImageUrl) {
  const base64Data = response.data.split(',')[1];
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const mimeType = response.mimeType || getMimeTypeFromUrl(fetchImageUrl);
  const blob = new Blob([bytes], { type: mimeType });

  console.log('成功获取图片数据');

  const originalFilename = getFilenameFromUrl(fetchImageUrl);
  const cleanFilename = sanitizeFilename(originalFilename);
  console.log(`清理文件名: ${originalFilename} -> ${cleanFilename}`);

  const formData = new FormData();
  formData.append('file', blob, cleanFilename);

  if (rootId) {
    formData.append('rootId', rootId);
  }

  const uploadResponse = await fetch(`${getDocApiUrl(config)}/document/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });

  if (!uploadResponse.ok) {
    throw new Error(`上传失败: ${uploadResponse.status}`);
  }

  const responseText = await uploadResponse.text();
  console.log('上传响应文本:', responseText);

  const uploadedUrl = parseUploadResponse(responseText);
  if (uploadedUrl) {
    return uploadedUrl;
  }

  console.error('上传成功但返回的数据无效:', responseText);
  return null;
}

function parseUploadResponse(responseText) {
  const trimmedText = String(responseText || '').trim();
  if (!trimmedText) {
    return null;
  }

  if (isUploadedImageUrl(trimmedText)) {
    return trimmedText;
  }

  try {
    return findUploadedImageUrl(JSON.parse(trimmedText));
  } catch (error) {
    console.error('解析上传响应失败:', error);
    return null;
  }
}

function findUploadedImageUrl(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return isUploadedImageUrl(value.trim()) ? value.trim() : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findUploadedImageUrl(item);
      if (found) {
        return found;
      }
    }
    return null;
  }

  if (typeof value === 'object') {
    const preferredKeys = ['url', 'fileUrl', 'fileURL', 'path', 'link', 'href', 'data'];
    for (const key of preferredKeys) {
      const found = findUploadedImageUrl(value[key]);
      if (found) {
        return found;
      }
    }

    for (const nestedValue of Object.values(value)) {
      const found = findUploadedImageUrl(nestedValue);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

function isUploadedImageUrl(value) {
  return /^https?:\/\//i.test(value) ||
    value.startsWith('/DOCUMENT_SITE_LINK_PREFIX_HERE/') ||
    value.startsWith('/document-site-files/');
}

function convertDocumentSiteFileUrlToInternal(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null;
  }

  let urlObj;
  try {
    urlObj = new URL(imageUrl, window.location.href);
  } catch (error) {
    return null;
  }

  const placeholderPath = '/DOCUMENT_SITE_LINK_PREFIX_HERE/document-site-files/';
  const filePath = '/document-site-files/';
  const placeholderIndex = urlObj.pathname.indexOf(placeholderPath);
  if (placeholderIndex !== -1) {
    return `${urlObj.pathname.substring(placeholderIndex)}${urlObj.search}${urlObj.hash}`;
  }

  const fileIndex = urlObj.pathname.indexOf(filePath);
  if (fileIndex !== -1) {
    return `/DOCUMENT_SITE_LINK_PREFIX_HERE${urlObj.pathname.substring(fileIndex)}${urlObj.search}${urlObj.hash}`;
  }

  return null;
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

function getMimeTypeFromUrl(url) {
  const pathname = (() => {
    try {
      return new URL(url).pathname;
    } catch (e) {
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

function getMimeTypeFromDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:([^;,]+)/i);
  return match ? match[1] : 'application/octet-stream';
}

function resolveImageUrl(imageUrl, config = {}) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('图片地址为空');
  }

  const trimmedUrl = imageUrl.trim();
  if (/^(https?:|data:)/i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  if (trimmedUrl.startsWith('//')) {
    return `${window.location.protocol || 'https:'}${trimmedUrl}`;
  }

  const baseUrl = config.sourceBaseUrl || window.location.href;
  try {
    return new URL(trimmedUrl, ensureTrailingSlash(baseUrl)).href;
  } catch (error) {
    throw new Error(`无法解析图片地址 "${imageUrl}"，请检查 sourceBaseUrl 配置`);
  }
}

async function fetchImageViaBackground(url) {
  console.log('通过 background script 获取图片...', url);

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'fetchImage', url }, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(`Background 消息失败: ${chrome.runtime.lastError.message}`));
        return;
      }

      if (response && response.success) {
        resolve(response);
        return;
      }

      const errorMessage = response && response.error
        ? response.error
        : `background 未返回图片数据: ${url}`;
      reject(new Error(errorMessage));
    });
  });
}

async function uploadImageViaBackground(imageUrl, rootId, config = {}) {
  console.log('通过 background script 直接上传图片...', imageUrl);

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: 'uploadImage',
      url: imageUrl,
      rootId,
      docApiUrl: getDocApiUrl(config)
    }, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(`Background 消息失败: ${chrome.runtime.lastError.message}`));
        return;
      }

      if (response && response.success) {
        resolve(response.data || null);
        return;
      }

      const errorMessage = response && response.error
        ? response.error
        : `background 未返回图片上传结果: ${imageUrl}`;
      reject(new Error(errorMessage));
    });
  });
}

// 获取当前文档的 rootId
async function getRootId(config = {}) {
  try {
    // 从URL中获取产品ID
    // 使用共享工具函数
    const productId = getProductIdFromCurrentRootUrl();
    if (!productId) {
      console.warn('无法从URL获取产品ID');
      return null;
    }
    console.log('获取到产品ID:', productId);
    
    // 请求API获取TOC信息
    const response = await fetch(`${getDocApiUrl(config)}/docversion/version/${productId}`);
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
})();
