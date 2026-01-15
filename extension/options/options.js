// 配置页面的JavaScript

// 默认配置
const DEFAULT_CONFIG = {
  sourceProductId: '',
  targetProductId: '',
  docApiUrl: 'https://docs.grapecity.com.cn/documentsite/api'
};

// 保存配置
function saveOptions() {
  const config = {
    sourceProductId: document.getElementById('sourceProductId').value.trim(),
    targetProductId: document.getElementById('targetProductId').value.trim(),
    docApiUrl: document.getElementById('docApiUrl').value.trim()
  };

  chrome.storage.sync.set({ docSiteHelperConfig: config }, () => {
    showStatus('配置已保存', 'success');
  });
}

// 加载配置
function loadOptions() {
  chrome.storage.sync.get(['docSiteHelperConfig'], (result) => {
    const config = { ...DEFAULT_CONFIG, ...result.docSiteHelperConfig };
    
    document.getElementById('sourceProductId').value = config.sourceProductId;
    document.getElementById('targetProductId').value = config.targetProductId;
    document.getElementById('docApiUrl').value = config.docApiUrl;
  });
}

// 重置为默认值
function resetOptions() {
  document.getElementById('sourceProductId').value = DEFAULT_CONFIG.sourceProductId;
  document.getElementById('targetProductId').value = DEFAULT_CONFIG.targetProductId;
  document.getElementById('docApiUrl').value = DEFAULT_CONFIG.docApiUrl;
  showStatus('已重置为默认值', 'success');
}

// 显示状态信息
function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  
  setTimeout(() => {
    status.textContent = '';
    status.className = 'status';
  }, 3000);
}

// 绑定事件
document.addEventListener('DOMContentLoaded', loadOptions);
document.getElementById('saveBtn').addEventListener('click', saveOptions);
document.getElementById('resetBtn').addEventListener('click', resetOptions);