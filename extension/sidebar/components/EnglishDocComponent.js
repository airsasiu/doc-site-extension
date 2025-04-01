class EnglishDocComponent {
  constructor() {
    this.initButtons();
  }

  initButtons() {
    const container = document.createElement('div');
    container.className = 'english-docs-buttons';

    // SpreadJS 按钮
    const spreadjsButton = document.createElement('button');
    spreadjsButton.className = 'english-doc-button spreadjs';
    spreadjsButton.innerHTML = '🌐 SJS EN';
    spreadjsButton.title = '打开 SpreadJS 英文文档';
    spreadjsButton.addEventListener('click', () => this.openEnglishDoc('spreadjs'));

    // GcExcel 按钮
    const gcexcelButton = document.createElement('button');
    gcexcelButton.className = 'english-doc-button gcexcel';
    gcexcelButton.innerHTML = '🌐 GC EN';
    gcexcelButton.title = '打开 GcExcel 英文文档';
    gcexcelButton.addEventListener('click', () => this.openEnglishDoc('gcexcel'));

    // SpreadJS 切换域名按钮
    const spreadjsSwitchButton = document.createElement('button');
    spreadjsSwitchButton.className = 'english-doc-button switch-domain';
    spreadjsSwitchButton.innerHTML = '🔄 SJS';
    spreadjsSwitchButton.title = '切换到 docs.grapecity.com.cn';
    spreadjsSwitchButton.addEventListener('click', () => this.switchDomain('spreadjs'));

    // GcExcel 切换域名按钮
    const gcexcelSwitchButton = document.createElement('button');
    gcexcelSwitchButton.className = 'english-doc-button switch-domain';
    gcexcelSwitchButton.innerHTML = '🔄 GC';
    gcexcelSwitchButton.title = '切换到 docs.grapecity.com.cn';
    gcexcelSwitchButton.addEventListener('click', () => this.switchDomain('gcexcel'));

    container.appendChild(spreadjsButton);
    container.appendChild(gcexcelButton);
    container.appendChild(spreadjsSwitchButton);
    container.appendChild(gcexcelSwitchButton);
    document.querySelector('.sidebar-container').appendChild(container);
  }

  async openEnglishDoc(type) {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) return;

      const currentUrl = tabs[0].url;
      let englishUrl = '';

      if (type === 'spreadjs') {
        // 处理 SpreadJS URL
        if (currentUrl.includes('demo.grapecity.com.cn/spreadjs/help/docs/') ||
            currentUrl.includes('docs.grapecity.com.cn/spreadjs/help/docs/')) {
          englishUrl = currentUrl
            .replace(/demo\.grapecity\.com\.cn\/spreadjs\/help\/docs\//, 'developer.mescius.com/spreadjs/docs/')
            .replace(/docs\.grapecity\.com\.cn\/spreadjs\/help\/docs\//, 'developer.mescius.com/spreadjs/docs/');
        }
      } else if (type === 'gcexcel') {
        // 处理 GcExcel URL
        if (currentUrl.includes('www.grapecity.com.cn/developer/grapecitydocuments/excel-java/docs/') ||
            currentUrl.includes('docs.grapecity.com.cn/developer/grapecitydocuments/excel-java/docs/')) {
          englishUrl = currentUrl
            .replace(/www\.grapecity\.com\.cn\/developer\/grapecitydocuments\/excel-java\/docs\//, 'developer.mescius.com/document-solutions/java-excel-api/docs/online/')
            .replace(/docs\.grapecity\.com\.cn\/developer\/grapecitydocuments\/excel-java\/docs\//, 'developer.mescius.com/document-solutions/java-excel-api/docs/online/');
        }
      }

      if (englishUrl) {
        await chrome.tabs.create({ url: englishUrl });
      } else {
        console.log('当前页面不是支持的文档页面');
      }
    } catch (error) {
      console.error('打开英文文档时出错:', error);
    }
  }

  async switchDomain(type) {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) return;

      const currentUrl = tabs[0].url;
      let newUrl = '';

      if (type === 'spreadjs') {
        // 处理 SpreadJS URL
        if (currentUrl.includes('demo.grapecity.com.cn/spreadjs/help/docs/')) {
          newUrl = currentUrl.replace('demo.grapecity.com.cn', 'docs.grapecity.com.cn');
        }
      } else if (type === 'gcexcel') {
        // 处理 GcExcel URL
        if (currentUrl.includes('www.grapecity.com.cn/developer/grapecitydocuments/excel-java/docs/')) {
          newUrl = currentUrl.replace('www.grapecity.com.cn', 'docs.grapecity.com.cn');
        }
      }

      if (newUrl) {
        await chrome.tabs.update(tabs[0].id, { url: newUrl });
      } else {
        console.log('当前页面不是支持的文档页面');
      }
    } catch (error) {
      console.error('切换域名时出错:', error);
    }
  }
}

export default EnglishDocComponent; 