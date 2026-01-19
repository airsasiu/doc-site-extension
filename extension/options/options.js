// 配置页面的JavaScript

// 默认配置
const DEFAULT_CONFIG = {
  sourceBaseUrl: '',
  sourceProductId: '',
  docApiUrl: 'https://docs.grapecity.com.cn/documentsite/api',
  copyToClipboard: true,
  linkRules: {
    "java": {
      "apiPathPattern": "/document-solutions/.*?/api/online/",
      "replaceWith": "/"
    },
    "js": {
      "apiPathPattern": "/api/",
      "replaceWith": "/"
    },
    "csharp": {
      "apiPathPattern": "/api/",
      "replaceWith": "/"
    }
  }
};

// 保存配置
function saveOptions() {
  try {
    const linkRulesText = document.getElementById('linkRules').value.trim();
    let linkRules = {};
    
    if (linkRulesText) {
      linkRules = JSON.parse(linkRulesText);
    }
    
    const config = {
      sourceBaseUrl: document.getElementById('sourceBaseUrl').value.trim(),
      sourceProductId: document.getElementById('sourceProductId').value.trim(),
      docApiUrl: document.getElementById('docApiUrl').value.trim(),
      copyToClipboard: document.getElementById('copyToClipboard').checked,
      linkRules: linkRules
    };

    chrome.storage.sync.set({ docSiteHelperConfig: config }, () => {
      showStatus('配置已保存', 'success');
    });
  } catch (error) {
    showStatus('链接规则格式错误: ' + error.message, 'error');
  }
}

// 加载配置
function loadOptions() {
  chrome.storage.sync.get(['docSiteHelperConfig'], (result) => {
    const config = { ...DEFAULT_CONFIG, ...result.docSiteHelperConfig };
    
    document.getElementById('sourceBaseUrl').value = config.sourceBaseUrl;
    document.getElementById('sourceProductId').value = config.sourceProductId;
    document.getElementById('docApiUrl').value = config.docApiUrl;
    document.getElementById('copyToClipboard').checked = config.copyToClipboard;
    document.getElementById('linkRules').value = JSON.stringify(config.linkRules, null, 2);
  });
}

// 重置为默认值
function resetOptions() {
  document.getElementById('sourceBaseUrl').value = DEFAULT_CONFIG.sourceBaseUrl;
  document.getElementById('sourceProductId').value = DEFAULT_CONFIG.sourceProductId;
  document.getElementById('docApiUrl').value = DEFAULT_CONFIG.docApiUrl;
  document.getElementById('copyToClipboard').checked = DEFAULT_CONFIG.copyToClipboard;
  document.getElementById('linkRules').value = JSON.stringify(DEFAULT_CONFIG.linkRules, null, 2);
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