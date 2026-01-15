// 从配置的源地址复制 Markdown 到剪贴板
(function() {
  console.log('文档 Markdown 复制脚本已加载并执行');

  // 主函数：直接执行文档复制操作
  async function copyDocMarkdown() {
    try {
      // 1. 获取当前页面 URL
      const currentUrl = window.location.href;
      console.log('当前 URL:', currentUrl);
      
      // 2. 从 URL 中提取关键信息
      const productIdMatch = currentUrl.match(/manage\/ArticleEdit\/([^?]+)|ArticleEdit\/([^?]+)/);
      const currentProductId = productIdMatch[1] || productIdMatch[2];
      
      if (!currentProductId) {
        window.docSiteUtils.showNotification('无法从 URL 提取产品 ID', 'error');
        return;
      }
      console.log('提取到的当前产品 ID:', currentProductId);
      
      // 3. 从存储中获取配置
      const config = await new Promise((resolve) => {
        chrome.storage.sync.get(['docSiteHelperConfig'], (result) => {
          resolve(result.docSiteHelperConfig || {});
        });
      });
      
      console.log('获取到的配置:', config);
      
      // 4. 验证配置
      if (!config.sourceBaseUrl) {
        window.docSiteUtils.showNotification('请先配置源文档基础 URL', 'error');
        return;
      }
      
      // 5. 从 URL 获取 tocItemId
      const urlParams = new URLSearchParams(currentUrl.split('?')[1]);
      const tocItemId = urlParams.get('tocItemId');
      console.log('URL 参数 - tocItemId:', tocItemId);
      
      // 6. 显示处理中通知
      window.docSiteUtils.showNotification('正在获取文档 Markdown 内容...', 'info');
      
      // 7. 获取 TOC 数据
      // 使用配置的 API URL 或默认值
      const docApiUrl = config.docApiUrl || 'https://docs.grapecity.com.cn/documentsite/api';
      const productId = config.sourceProductId || currentProductId;
      
      const tocResponse = await fetch(`${docApiUrl}/docversion/version/${productId}`);
      if (!tocResponse.ok) {
        throw new Error(`获取 TOC 失败: ${tocResponse.statusText}`);
      }
      const tocData = await tocResponse.json();
      const tocItems = tocData.toc.tocItemDrafts;
      
      // 8. 查找当前页面在 TOC 中的信息
      let pagePath = '';
      if (tocItemId) {
        const foundItem = findTocItemById(tocItems, tocItemId);
        if (foundItem) {
          console.log('找到 TOC 项:', foundItem);
          if (foundItem.documentPath) {
            pagePath = foundItem.documentPath;
          } else if (foundItem.text) {
            pagePath = foundItem.text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          }
        }
      }
      console.log('确定的页面路径:', pagePath);
      
      // 9. 处理页面路径，确保格式正确
      let finalPagePath = pagePath;
      if (finalPagePath.startsWith('/')) {
        finalPagePath = finalPagePath.substring(1);
      }
      
      // 10. 构建完整的文档 URL
      const sourceBaseUrl = config.sourceBaseUrl.endsWith('/') ? config.sourceBaseUrl : `${config.sourceBaseUrl}/`;
      const finalUrl = `${sourceBaseUrl}${finalPagePath}.md`;
      console.log('构建的文档 URL:', finalUrl);
      
      // 11. 通过 background script 获取 Markdown 内容，避免 CORS 问题
      const markdownResponse = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'fetchMarkdown', url: finalUrl }, response => {
          if (response && response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response ? response.error : '获取 Markdown 失败'));
          }
        });
      });
      
      // 12. 提取 ## Content 下面的所有内容
      const titleMatch = markdownResponse.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      const contentMatch = markdownResponse.match(/## Content\s+([\s\S]*)/m);
      let content = '';
      if (contentMatch && contentMatch[1]) {
        content = contentMatch[1].trim();
      }
      
      // 如果没有找到 Content 部分，使用整个 Markdown（除了标题）
      if (!content) {
        content = markdownResponse.replace(/^#\s+.+$/m, '').trim();
      }
      
      // 组合最终的 Markdown
      const finalMarkdown = `${content}`;
      console.log('提取的 Markdown 内容长度:', finalMarkdown.length);
      
      // 13. 复制到剪贴板
      await window.docSiteUtils.copyToClipboard(finalMarkdown);
      
      // 14. 显示成功通知
      window.docSiteUtils.showNotification('文档 Markdown 内容已复制到剪贴板', 'success', 5000);
      
    } catch (error) {
      console.error('复制文档时出错:', error);
      window.docSiteUtils.showNotification(`复制失败: ${error.message}`, 'error');
    }
  }

  /**
   * 递归查找 TOC 中指定 ID 的项
   * @param {Array|Object} tocData - TOC 数据
   * @param {string} tocItemId - 要查找的 TOC 项 ID
   * @returns {Object|null} - 找到的 TOC 项，未找到则返回 null
   */
  function findTocItemById(tocData, tocItemId) {
    // 处理数组类型的 TOC
    if (Array.isArray(tocData)) {
      for (const item of tocData) {
        const result = findTocItemById(item, tocItemId);
        if (result) {
          return result;
        }
      }
    }
    // 处理对象类型的 TOC 项
    else if (typeof tocData === 'object' && tocData !== null) {
      // 检查当前项
      if (tocData.id === tocItemId || tocData.tocItemId === tocItemId || tocData.guid === tocItemId) {
        return tocData;
      }
      
      // 递归检查子项
      const childrenKeys = ['children', 'items', 'tocItemDrafts', 'subItems', 'subsections'];
      for (const key of childrenKeys) {
        if (tocData[key]) {
          const result = findTocItemById(tocData[key], tocItemId);
          if (result) {
            return result;
          }
        }
      }
    }
    
    return null;
  }

  // 直接执行主函数
  copyDocMarkdown();
})();