// 格式化选中的代码
(function() {
  console.log('Format-code script loaded and executing');
  
  try {
    // 获取选中的文本
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    console.log('Selected text length:', selectedText.length);
    
    if (!selectedText) {
      console.error('No text selected');
      return;
    }
    
    // 检查prettier是否可用
    if (typeof prettier === 'undefined' || typeof prettierPlugins === 'undefined') {
      console.error('Prettier or plugins not available');
      return;
    }
    
    // 使用prettier格式化代码，使用更接近VSCode默认配置的选项
    console.log('Formatting code with prettier...');
    const formattedCode = prettier.format(selectedText, {
      parser: "babel",
      plugins: prettierPlugins,
      semi: true,                 // 语句末尾使用分号
      singleQuote: true,          // 使用单引号
      tabWidth: 4,                // 制表符宽度（当显示时）
      useTabs: false,              // 使用制表符而不是空格
      printWidth: 1000000,        // 设置极大的行宽，实际上不限制宽度
      bracketSpacing: true,       // 对象字面量中的括号之间添加空格
      arrowParens: 'always',      // 箭头函数参数始终使用括号
      trailingComma: 'es5',       // ES5中允许的尾随逗号（对象、数组等）
      jsxBracketSameLine: false,  // JSX标签的>放在最后一行的末尾，而不是单独放在下一行
      endOfLine: 'lf'             // 行尾使用LF
    });
    
    console.log('Code formatted successfully');
        
    // 替换选中的文本
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(formattedCode));
      console.log('Replaced selected text with formatted code');
      
      // 显示通知
      const notification = document.createElement('div');
      notification.textContent = '代码已格式化完成';
      notification.style.position = 'fixed';
      notification.style.top = '20px';
      notification.style.left = '50%';
      notification.style.transform = 'translateX(-50%)';
      notification.style.padding = '10px 20px';
      notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      notification.style.color = 'white';
      notification.style.borderRadius = '5px';
      notification.style.zIndex = '9999';
      document.body.appendChild(notification);
      
      // 2秒后移除通知
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 2000);
    }
  } catch (error) {
    console.error("格式化代码时出错:", error);
    
    // 显示错误通知
    const notification = document.createElement('div');
    notification.textContent = '格式化代码时出错: ' + error.message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.padding = '10px 20px';
    notification.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
    notification.style.color = 'white';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '9999';
    document.body.appendChild(notification);
    
    // 3秒后移除错误通知
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  }
})();

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