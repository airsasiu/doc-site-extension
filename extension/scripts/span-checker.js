// 按需检查 span 标签的脚本
(function() {
  console.log('span 标签检查脚本已加载，等待快捷键触发');
  
  function checkForSpanTags() {
    console.log('开始检查 span 标签');
    
    try {
      // 查找编辑器元素
      const editors = document.querySelectorAll('div.toastui-editor.md-mode');
      if (editors.length === 0) {
        showNotification('未找到编辑器元素', 'warning');
        return;
      }
      
      console.log(`找到 ${editors.length} 个编辑器元素`);
      
      let foundSpanTags = false;
      let highlightedCount = 0;
      
      // 检查每个编辑器
      editors.forEach((editor, index) => {
        // 获取编辑器的文本内容
        const text = editor.innerText || '';
        
        // 检查是否包含 </span>
        if (text.includes('</span>')) {
          console.warn(`编辑器 #${index + 1} 中检测到 </span> 标签！`);
          foundSpanTags = true;
          
          // 高亮包含 </span> 的元素
          highlightedCount += highlightSpanElements(editor);
        }
      });
      
      // 显示结果通知
      if (foundSpanTags) {
        showNotification(`检测到 ${highlightedCount} 处 HTML span 标签，已高亮显示`, 'error');
      } else {
        showNotification('未检测到 span 标签，文档内容正常', 'success');
      }
    } catch (error) {
      console.error("检查 span 标签时出错:", error);
      showNotification(`检查出错: ${error.message}`, 'error');
    }
  }
  
  // 高亮包含 </span> 的元素
  function highlightSpanElements(rootElement) {
    // 移除之前的高亮
    const oldHighlights = rootElement.querySelectorAll('.span-warning-highlight');
    oldHighlights.forEach(el => {
      const parent = el.parentNode;
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
    });
    
    let highlightCount = 0;
    
    // 查找包含 </span> 的文本节点
    const walker = document.createTreeWalker(
      rootElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          return node.textContent.includes('</span>') 
            ? NodeFilter.FILTER_ACCEPT 
            : NodeFilter.FILTER_SKIP;
        }
      }
    );
    
    // 遍历文本节点
    let node;
    while (node = walker.nextNode()) {
      // 创建高亮容器
      const span = document.createElement('span');
      span.className = 'span-warning-highlight';
      span.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
      span.style.border = '1px solid red';
      span.style.padding = '2px';
      span.style.borderRadius = '3px';
      
      // 替换原节点
      const parent = node.parentNode;
      parent.insertBefore(span, node);
      span.appendChild(node);
      
      highlightCount++;
    }
    
    return highlightCount;
  }
  
  // 显示通知
  function showNotification(message, type) {
    // 移除现有通知
    const existingNotification = document.querySelector('.span-check-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // 创建新通知
    const notification = document.createElement('div');
    notification.className = 'span-check-notification';
    notification.textContent = message;
    
    // 根据类型设置样式
    let bgColor;
    switch (type) {
      case 'success':
        bgColor = 'rgba(82, 196, 26, 0.9)';
        break;
      case 'warning':
        bgColor = 'rgba(255, 165, 0, 0.9)';
        break;
      case 'error':
        bgColor = 'rgba(255, 77, 79, 0.9)';
        break;
      default:
        bgColor = 'rgba(0, 0, 0, 0.7)';
    }
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 20px;
      background-color: ${bgColor};
      color: white;
      border-radius: 5px;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(notification);
    
    // 5秒后移除通知
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
  
  // 将检查函数暴露给全局，以便后续调用
  window.checkForSpanTags = checkForSpanTags;
  
  console.log('span 标签检查脚本初始化完成');
})(); 