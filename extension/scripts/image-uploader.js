// 上传 Markdown 中的图片
(function() {
  console.log('Image uploader script loaded and executing');
  
  try {
    // 获取选中的文本
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    console.log('Selected text length:', selectedText.length);
    
    if (!selectedText) {
      window.docSiteUtils.showNotification('未选择任何文本', 'error');
      return;
    }
    
    // 查找所有图片链接
    processMarkdownImages(selectedText, selection);
    
  } catch (error) {
    console.error("处理图片上传时出错:", error);
    window.docSiteUtils.showNotification(`上传图片时出错: ${error.message}`, 'error');
  }
})();

// 处理 Markdown 中的图片和换行符
async function processMarkdownImages(markdown, selection) {
  // 首先处理换行符和空行
  let processedMarkdown = window.docSiteUtils.cleanupMarkdown(markdown);
  
  // 匹配 Markdown 图片语法: ![alt](url)
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
  let match;
  let uploadCount = 0;
  let failCount = 0;
  let replacements = [];
  let totalImages = 0;
  let processedImages = 0;
  
  // 计算需要上传的图片总数
  let imagesToUpload = [];
  while ((match = imageRegex.exec(processedMarkdown)) !== null) {
    const [fullMatch, altText, imageUrl] = match;
    
    // 跳过已经是上传服务的图片
    if (imageUrl.includes('docs.grapecity.com.cn/documentsite/api/upload') || 
        imageUrl.includes('/DOCUMENT_SITE_LINK_PREFIX_HERE/document-site-files/') ||
        imageUrl.includes('docs.grapecity.com.cn/document-site-files/')) {
      console.log('跳过已上传的图片:', imageUrl);
      continue;
    }
    
    imagesToUpload.push({fullMatch, altText, imageUrl});
  }
  
  totalImages = imagesToUpload.length;
  
  if (totalImages === 0) {
    // 即使没有图片需要上传，也返回处理过换行符的文本
    if (processedMarkdown !== markdown) {
      await window.docSiteUtils.copyToClipboard(processedMarkdown);
      window.docSiteUtils.showNotification('已移除换行标签和多余空行，内容已复制到剪贴板，请手动粘贴替换。', 'success', 5000);
    } else {
      window.docSiteUtils.showNotification('未找到需要处理的内容', 'info');
    }
    return;
  }
  
  window.docSiteUtils.showNotification(`开始处理 ${totalImages} 张图片...`, 'info');
  
  // 先获取 rootId，只获取一次
  let rootId = null;
  try {
    window.docSiteUtils.updateProgress(0, totalImages, '正在获取 rootId...');
    rootId = await getRootId();
    console.log('获取到 rootId:', rootId);
  } catch (error) {
    console.error('获取 rootId 失败:', error);
    window.docSiteUtils.showNotification('获取 rootId 失败，无法上传图片', 'error');
    return;
  }
  
  // 串行处理每个图片
  for (const {fullMatch, altText, imageUrl} of imagesToUpload) {
    processedImages++;
    window.docSiteUtils.updateProgress(processedImages, totalImages, `正在上传图片 ${processedImages}/${totalImages}: ${getShortFilename(imageUrl)}`);
    
    try {
      console.log(`处理图片 ${processedImages}/${totalImages}: ${imageUrl}`);
      const newUrl = await uploadImage(imageUrl, rootId);
      
      if (newUrl) {
        const newImageMarkdown = `![${altText}](${newUrl})`;
        replacements.push({
          original: fullMatch,
          replacement: newImageMarkdown
        });
        uploadCount++;
        console.log(`图片上传成功: ${imageUrl} -> ${newUrl}`);
        window.docSiteUtils.updateProgress(processedImages, totalImages, `图片 ${processedImages}/${totalImages} 上传成功`);
      } else {
        failCount++;
        console.error(`图片上传失败: ${imageUrl}`);
        window.docSiteUtils.updateProgress(processedImages, totalImages, `图片 ${processedImages}/${totalImages} 上传失败`, 'warning');
      }
      
      // 添加延迟，避免服务器过载
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`上传图片失败: ${imageUrl}`, error);
      failCount++;
      window.docSiteUtils.updateProgress(processedImages, totalImages, `图片 ${processedImages}/${totalImages} 上传出错: ${error.message}`, 'error');
      
      // 出错后稍微多等一会
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 替换原文本中的图片链接
  replacements.sort((a, b) => {
    return processedMarkdown.indexOf(b.original) - processedMarkdown.indexOf(a.original);
  });
  
  replacements.forEach(({ original, replacement }) => {
    processedMarkdown = processedMarkdown.replace(original, replacement);
  });
  
  // 如果有处理的图片或移除了换行符，复制到剪贴板
  if (uploadCount > 0 || failCount > 0 || processedMarkdown !== markdown) {
    await window.docSiteUtils.copyToClipboard(processedMarkdown);
    let message = '';
    if (uploadCount > 0 || failCount > 0) {
      message = `图片处理完成: ${uploadCount} 张上传成功, ${failCount} 张失败。`;
    }
    if (processedMarkdown !== markdown) {
      message += '换行标签和多余空行已移除。';
    }
    message += '内容已复制到剪贴板，请手动粘贴替换。';
    
    window.docSiteUtils.showNotification(message, failCount > 0 ? 'warning' : 'success', 8000);
  }
}

// 获取文件名的简短版本，用于显示
function getShortFilename(url) {
  try {
    const filename = getFilenameFromUrl(url);
    // 如果文件名太长，截断显示
    if (filename.length > 20) {
      return filename.substring(0, 17) + '...';
    }
    return filename;
  } catch (e) {
    return '图片';
  }
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
