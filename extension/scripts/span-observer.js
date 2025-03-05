// 监控 toastui-editor md-mode 元素变更并检查 span 标签
(function() {
  console.log('监控 toastui-editor md-mode 元素变更的脚本已加载');
  
  try {
    // 创建 MutationObserver 实例
    const observer = new MutationObserver((mutations) => {
      // 遍历所有变更
      mutations.forEach((mutation) => {
        // 检查变更的节点
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          checkForSpanTags(mutation.target);
        }
      });
    });
    
    // 查找所有 toastui-editor md-mode 类的元素
    const findAndObserveEditors = () => {
      const editors = document.querySelectorAll('div.toastui-editor.md-mode');
      if (editors.length === 0) {
        console.log('未找到 toastui-editor md-mode 元素，将继续尝试');
        setTimeout(findAndObserveEditors, 1000); // 1秒后重试
        return;
      }
      
      console.log(`找到 ${editors.length} 个编辑器元素，开始监控`);
      
      // 对每个编辑器设置观察
      editors.forEach((editor, index) => {
        console.log(`开始监控编辑器 #${index + 1}`);
        
        // 配置 observer
        const config = { 
          childList: true,      // 监控子节点变更
          subtree: true,        // 监控所有后代节点
          characterData: true   // 监控文本内容变更
        };
        
        // 开始观察
        observer.observe(editor, config);
        
        // 初始检查
        checkForSpanTags(editor);
      });
    };
    
    // 检查元素及其子元素是否包含 </span>
    function checkForSpanTags(element) {
      // 获取元素的所有文本内容
      const text = element.innerText || '';
      
      // 检查是否包含 </span>
      if (text.includes('</span>')) {
        console.warn('检测到 </span> 标签！');
        showWarningNotification('检测到 HTML span 标签，请检查并移除');
        
        // 高亮包含 </span> 的元素
        highlightSpanElements(element);
      }
    }
    
    // 高亮包含 </span> 的元素
    function highlightSpanElements(rootElement) {
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
        // 创建一个临时容器
        const span = document.createElement('span');
        span.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
        span.style.border = '1px solid red';
        span.style.padding = '2px';
        span.style.borderRadius = '3px';
        
        // 替换原节点
        const parent = node.parentNode;
        parent.insertBefore(span, node);
        span.appendChild(node);
      }
    }
    
    // 显示警告通知
    function showWarningNotification(message) {
      const notification = document.createElement('div');
      notification.textContent = message;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        background-color: rgba(255, 165, 0, 0.9);
        color: white;
        border-radius: 5px;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(notification);
      
      // 3秒后移除通知
      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
    
    // 开始查找并监控编辑器
    findAndObserveEditors();
    
    // 监听 DOM 变更，以便在编辑器动态加载时进行监控
    const documentObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);
          const hasEditor = addedNodes.some(node => 
            node.nodeType === Node.ELEMENT_NODE && 
            (node.classList?.contains('toastui-editor') || 
             node.querySelector?.('.toastui-editor.md-mode'))
          );
          
          if (hasEditor) {
            console.log('检测到新的编辑器元素被添加，重新设置监控');
            findAndObserveEditors();
          }
        }
      });
    });
    
    // 监控整个文档的变更
    documentObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    
  } catch (error) {
    console.error("监控编辑器时出错:", error);
  }
})();
