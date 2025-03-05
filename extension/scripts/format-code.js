// 格式化选中的代码
function formatSelectedCode() {
  try {
    // 获取选中的文本
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    if (!selectedText) {
      showNotification('没有选中任何文本', 'error');
      return;
    }
    
    // 使用prettier格式化代码
    const formattedCode = prettier.format(selectedText, {
      parser: "babel",
      plugins: prettierPlugins,
      semi: true,
      singleQuote: true,
      tabWidth: 2
    });
    
    // 替换选中的文本
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(formattedCode));
    }
    
    showNotification('代码格式化成功', 'success');
  } catch (error) {
    console.error("格式化代码时出错:", error);
    showNotification(`格式化失败: ${error.message}`, 'error');
  }
}

// 显示通知
function showNotification(message, type) {
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