// 提取选中文本的链接
(function() {
  console.log('链接提取脚本已加载并执行');
  
  /**
   * 从选中文本中查找链接元素
   * @param {Selection} selection - 用户选中的内容
   * @returns {HTMLAnchorElement|null} - 找到的链接元素或null
   */
  function findLinkFromSelection(selection) {
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const selectedText = selection.toString().trim();
    
    // 如果选中的是文本节点，检查其父元素是否为链接
    if (container.nodeType === Node.TEXT_NODE) {
      if (container.parentElement.tagName === 'A') {
        return container.parentElement;
      } else {
        // 向上查找最近的 A 标签
        let parent = container.parentElement;
        while (parent && parent.tagName !== 'A') {
          parent = parent.parentElement;
        }
        return parent;
      }
    } 
    // 如果选中的是元素节点，检查是否为链接或包含链接
    else if (container.nodeType === Node.ELEMENT_NODE) {
      if (container.tagName === 'A') {
        return container;
      } else {
        // 查找选中范围内的链接
        const links = container.querySelectorAll('a');
        for (const link of links) {
          if (link.textContent.includes(selectedText)) {
            return link;
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * 主函数：提取并处理链接
   */
  async function extractAndProcessLink() {
    try {
      // 获取选中的文本
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      console.log('选中文本长度:', selectedText.length);
      
      if (!selectedText) {
        window.docSiteUtils.showNotification('未选择任何文本', 'error');
        return;
      }
      
      // 查找链接元素
      const linkElement = findLinkFromSelection(selection);
      
      if (linkElement && linkElement.href) {
        // 获取原始链接
        const originalUrl = linkElement.href;
        console.log('找到原始链接:', originalUrl);
        
        // 检查是否为 mescius 链接
        const isMesciusLink = originalUrl.includes('developer.mescius.com');
        
        // 使用 utils 中的函数转换链接
        const transformedUrl = window.docSiteUtils.transformLinkUrl(originalUrl);
        
        // 使用 utils 中的函数复制到剪贴板
        await window.docSiteUtils.copyToClipboard(transformedUrl);
        
        // 根据链接类型显示不同的通知
        if (isMesciusLink) {
          window.docSiteUtils.showNotification('Mescius 链接已转换并复制到剪贴板: ' + transformedUrl, 'success');
          
          // 创建一个新的标签页来验证链接
          const verifyLink = document.createElement('a');
          verifyLink.href = '#';
          verifyLink.textContent = '点击验证链接';
          verifyLink.style.color = 'white';
          verifyLink.style.textDecoration = 'underline';
          verifyLink.style.marginLeft = '10px';
          verifyLink.style.cursor = 'pointer';
          
          verifyLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(transformedUrl, '_blank');
          });
          
          // 将验证链接添加到通知中
          const notification = document.querySelector('.custom-notification');
          if (notification) {
            notification.appendChild(document.createTextNode(' '));
            notification.appendChild(verifyLink);
          }
        } else {
          // 非 mescius 链接给出特别提示
          window.docSiteUtils.showNotification('注意：这不是 Mescius 链接，已原样复制: ' + transformedUrl, 'warning');
        }
      } else {
        console.log('未找到链接');
        window.docSiteUtils.showNotification('未找到与选中文本相关的链接', 'warning');
      }
    } catch (error) {
      console.error("提取链接时出错:", error);
      window.docSiteUtils.showNotification(`提取链接时出错: ${error.message}`, 'error');
    }
  }
  
  // 执行主函数
  extractAndProcessLink();
})(); 