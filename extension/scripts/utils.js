// 通用工具函数

// 移除 <br> 标签和多余空行
function cleanupMarkdown(markdown) {
  if (!markdown) return '';
  
  // 移除 HTML <br> 标签（包括带空格和属性的变体）
  let result = markdown.replace(/<br\s*\/?>/gi, '');
  
  // 移除 Markdown 换行符 \
  result = result.replace(/\\$/gm, '');
  
  // 移除连续的空行（超过两个换行符）
  result = result.replace(/\n{3,}/g, '\n\n');
  
  // 移除每段开头和结尾的空白行
  result = result.replace(/^\s*\n+/gm, '');
  result = result.replace(/\n+\s*$/gm, '');
  
  // 移除段落之间多余的空行，只保留一个
  result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return result;
}

// 复制文本到剪贴板
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('内容已复制到剪贴板');
    return true;
  } catch (err) {
    console.error('复制到剪贴板失败:', err);
    
    // 备用方法
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (err) {
      console.error('备用复制方法也失败:', err);
      return false;
    }
  }
}

// 显示通知
function showNotification(message, type = 'info', duration = 5000, className = 'custom-notification') {
  // 移除现有通知（如果不是进度通知）
  if (className !== 'progress-notification') {
    const existingNotification = document.querySelector('.custom-notification:not(.progress-notification)');
    if (existingNotification) {
      existingNotification.remove();
    }
  } else {
    // 如果是进度通知，移除之前的进度通知
    const existingProgress = document.querySelector('.progress-notification');
    if (existingProgress) {
      existingProgress.remove();
    }
  }
  
  // 创建新通知
  const notification = document.createElement('div');
  notification.className = `custom-notification ${className}`;
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
    case 'info':
    default:
      bgColor = 'rgba(24, 144, 255, 0.9)';
  }
  
  // 设置通知位置，进度通知在顶部，其他通知在下方
  const top = className === 'progress-notification' ? '20px' : '80px';
  
  notification.style.cssText = `
    position: fixed;
    top: ${top};
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    background-color: ${bgColor};
    color: white;
    border-radius: 5px;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    max-width: 80%;
    word-wrap: break-word;
  `;
  
  document.body.appendChild(notification);
  
  // 如果指定了持续时间，则在指定时间后移除通知
  if (duration > 0) {
    setTimeout(() => {
      notification.remove();
    }, duration);
  }
  
  return notification;
}

// 更新进度通知
function updateProgress(current, total, message, type = 'info') {
  const percentage = Math.round((current / total) * 100);
  const progressMessage = `${message} (${percentage}%)`;
  
  // 更新或创建进度通知
  const duration = (percentage === 100) ? 3000 : 0; // 如果是100%，3秒后自动消失
  showNotification(progressMessage, type, duration, 'progress-notification');
}

// 导出工具函数
window.docSiteUtils = {
  cleanupMarkdown,
  copyToClipboard,
  showNotification,
  updateProgress
};
