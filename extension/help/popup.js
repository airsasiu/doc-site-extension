import { getStoredLanguage, setActiveLanguage, setText } from '../shared/localization.js';

const TEXTS = {
  cn: {
    title: 'Documentation Helper',
    eyebrow: 'Documentation Helper',
    heading: '快速入口',
    lead: '打开侧边栏、配置扩展，或者直接看帮助文档。',
    openSidebar: '打开搜索侧边栏',
    openOptions: '扩展配置',
    openHelp: '查看帮助文档',
    shortcutsTitle: '常用快捷键',
    format: '格式化代码',
    checkSpan: '检查 SPAN 标签',
    upload: '上传图片',
    link: '提取链接',
    footer: '版本 1.0'
  },
  en: {
    title: 'Documentation Helper',
    eyebrow: 'Documentation Helper',
    heading: 'Quick access',
    lead: 'Open the sidebar, change settings, or jump straight to the help guide.',
    openSidebar: 'Open search sidebar',
    openOptions: 'Settings',
    openHelp: 'View help',
    shortcutsTitle: 'Common shortcuts',
    format: 'Format code',
    checkSpan: 'Check SPAN tags',
    upload: 'Upload images',
    link: 'Extract links',
    footer: 'Version 1.0'
  }
};

function applyPopupLanguage(language) {
  const text = TEXTS[language] || TEXTS.cn;
  setActiveLanguage(language);
  document.documentElement.lang = language === 'en' ? 'en-US' : 'zh-CN';
  document.title = text.title;
  setText('.popup-header .eyebrow', text.eyebrow);
  setText('.popup-header h1', text.heading);
  setText('.popup-header .lead', text.lead);
  setText('#openSidebar', text.openSidebar);
  setText('#openOptions', text.openOptions);
  setText('#openHelp', text.openHelp);
  setText('.popup-shortcuts .section-title', 'Shortcuts');
  setText('.popup-shortcuts h2', text.shortcutsTitle);
  const shortcutRows = document.querySelectorAll('.shortcut-item span:first-child');
  if (shortcutRows[0]) shortcutRows[0].textContent = text.format;
  if (shortcutRows[1]) shortcutRows[1].textContent = text.checkSpan;
  if (shortcutRows[2]) shortcutRows[2].textContent = text.upload;
  if (shortcutRows[3]) shortcutRows[3].textContent = text.link;
  setText('.popup-footer', text.footer);
}

document.addEventListener('DOMContentLoaded', async () => {
  const language = await getStoredLanguage();
  applyPopupLanguage(language);

  document.getElementById('openSidebar').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.sidePanel.open({ tabId: tabs[0].id });
    });
    window.close();
  });
  
  // 打开配置页面按钮
  document.getElementById('openOptions').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
    window.close();
  });
  
  // 打开帮助文档按钮
  document.getElementById('openHelp').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('help/help.html') });
    window.close();
  });
});
