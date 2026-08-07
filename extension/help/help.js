import { getStoredLanguage, setActiveLanguage, setText } from '../shared/localization.js';

const TEXTS = {
  cn: {
    title: 'Documentation Helper 使用帮助',
    eyebrow: 'Documentation Helper',
    heading: '使用帮助',
    lead: '搜索、检查、格式化、图片上传和链接提取都在这里。页面按工作流排布，方便快速定位功能。',
    summary: ['Search', 'Checks', 'Markdown'],
    overviewTitle: '功能概览',
    overviewLead: '扩展面向文档站编辑流程，目标是把常见的搜索、检查和整理动作放在一个不打扰页面的工作台里。',
    cards: [
      ['Search', '文档搜索', '快速搜索当前产品文档中的内容，支持列表视图和树形视图。', '使用方法：', '按 Alt+, 打开侧边栏，输入搜索内容并点击“搜索”。'],
      ['Checks', '常规检查', '自动检查文档中的常见问题，以及配置页里定义的团队规则。', '使用方法：', '在侧边栏中点击“常规检查”。'],
      ['Markdown', '代码格式化', '一键格式化选中的代码块，使代码更规整、易读。', '使用方法：', '选中代码后按 Alt+Shift+F。'],
      ['HTML', 'SPAN 标签检查', '检查编辑器中是否存在 SPAN 标签，避免 HTML 标签混入 Markdown 内容。', '使用方法：', '按 Alt+Shift+S 执行检查。'],
      ['Images', '图片上传', '自动上传 Markdown 中的图片到服务器，并替换为新的链接。', '使用方法：', '选中包含图片的 Markdown 文本后按 Alt+Shift+U。'],
      ['Links', '链接提取', '快速提取选中文本所在的链接地址，并复制到剪贴板。', '使用方法：', '选中链接文本后按 Alt+L。']
    ],
    shortcutsTitle: '快捷键一览',
    tableHeader: ['功能', 'Windows/Linux', 'Mac'],
    shortcutActions: [
      '打开搜索侧边栏',
      '格式化选中代码',
      '检查 SPAN 标签',
      '上传 Markdown 中的图片',
      '提取选中文本的链接'
    ],
    workflowTitle: '详细功能说明',
    workflowLead: '文档站 API、源文档地址、链接转换规则和团队检查规则都可以在扩展配置页中调整。',
    notes: [
      ['文档搜索', '支持列表视图和树形视图；点击结果可直接跳转到对应文档页面。'],
      ['常规检查', '会扫描 SPAN 标签、Base64、转义双星号、绝对链接以及自定义规则。'],
      ['代码格式化', '支持 JavaScript、TypeScript、JSON、HTML、XML 和带花括号结构的片段；识别失败时会回退到通用缩进格式化。'],
      ['SPAN 标签检查', '用于快速发现 Markdown 中混入的 HTML 标签，方便在保存前清理。'],
      ['链接提取', '选中链接文本后执行快捷键即可复制链接地址，适合在页面改写时快速搬运引用。']
    ],
    faqTitle: '常见问题',
    faqs: [
      ['扩展无法正常工作？', '请确认你正在访问已配置的文档站页面，并且浏览器已允许扩展在该站点上运行。'],
      ['快捷键不起作用？', '可能和其他扩展或系统快捷键冲突。可以在浏览器的扩展管理页中调整快捷键。']
    ],
    footer: 'Documentation Helper © 2023'
  },
  en: {
    title: 'Documentation Helper Help',
    eyebrow: 'Documentation Helper',
    heading: 'Help',
    lead: 'Search, checks, formatting, image upload, and link extraction all live here. The page follows the workflow so you can find things quickly.',
    summary: ['Search', 'Checks', 'Markdown'],
    overviewTitle: 'Overview',
    overviewLead: 'This extension is built for documentation editing workflows, keeping common search, check, and cleanup actions in one quiet workspace.',
    cards: [
      ['Search', 'Document search', 'Search content in the current product docs with list and tree views.', 'How to use:', 'Open the sidebar with Alt+, type your query, and click Search.'],
      ['Checks', 'Routine checks', 'Automatically checks common doc issues and the team rules defined in settings.', 'How to use:', 'Click Routine check in the sidebar.'],
      ['Markdown', 'Code formatting', 'Format selected code in one step so it is cleaner and easier to read.', 'How to use:', 'Select code and press Alt+Shift+F.'],
      ['HTML', 'SPAN tag check', 'Checks whether the editor contains SPAN tags so HTML does not leak into Markdown.', 'How to use:', 'Press Alt+Shift+S to run the check.'],
      ['Images', 'Image upload', 'Uploads Markdown images to the server and replaces them with new links.', 'How to use:', 'Select Markdown that contains images and press Alt+Shift+U.'],
      ['Links', 'Link extraction', 'Quickly extract the link target from selected text and copy it to the clipboard.', 'How to use:', 'Select link text and press Alt+L.']
    ],
    shortcutsTitle: 'Shortcut reference',
    tableHeader: ['Action', 'Windows/Linux', 'Mac'],
    shortcutActions: [
      'Open search sidebar',
      'Format selected code',
      'Check SPAN tags',
      'Upload Markdown images',
      'Extract selected text link'
    ],
    workflowTitle: 'Workflow details',
    workflowLead: 'The docs API, source base URL, link rewrite rules, and team checks can all be adjusted in the extension settings page.',
    notes: [
      ['Document search', 'Supports list and tree views; clicking a result opens the matching page.'],
      ['Routine checks', 'Scans SPAN tags, Base64, escaped double asterisks, absolute links, and custom rules.'],
      ['Code formatting', 'Supports JavaScript, TypeScript, JSON, HTML, XML, and brace-based fragments; falls back to generic indentation formatting when detection fails.'],
      ['SPAN tag check', 'Finds HTML tags mixed into Markdown so you can clean them up before saving.'],
      ['Link extraction', 'Use the shortcut on selected link text to copy the target URL while editing content.']
    ],
    faqTitle: 'FAQ',
    faqs: [
      ['The extension does not work?', 'Make sure you are on a configured doc site page and the browser allows the extension to run there.'],
      ['Shortcuts do not work?', 'They may conflict with another extension or a system shortcut. Adjust them in the browser extension shortcuts page.']
    ],
    footer: 'Documentation Helper © 2023'
  }
};

function renderUsage(howLabel, usage) {
  return `<strong>${howLabel}</strong> ${usage.replace(
    /(Alt(?:\+Shift)?\+[A-Z],?|Alt\+,)/g,
    '<span class="shortcut">$1</span>'
  )}`;
}

function applyHelpLanguage(language) {
  const text = TEXTS[language] || TEXTS.cn;
  setActiveLanguage(language);
  document.documentElement.lang = language === 'en' ? 'en-US' : 'zh-CN';
  document.title = text.title;

  setText('.help-header .eyebrow', text.eyebrow);
  setText('.help-header h1', text.heading);
  setText('.help-header .lead', text.lead);
  const summaryChips = document.querySelectorAll('.help-summary .chip');
  summaryChips.forEach((chip, index) => {
    chip.textContent = text.summary[index] || chip.textContent;
  });

  setText('.help-overview .section-title', 'Overview');
  setText('.help-overview h2', text.overviewTitle);
  setText('.help-overview .overview-copy .lead', text.overviewLead);

  const cards = document.querySelectorAll('.help-grid .help-card');
  cards.forEach((card, index) => {
    const item = text.cards[index];
    if (!item) return;
    const [sectionTitle, heading, body, howLabel, usage] = item;
    const title = card.querySelector('.section-title');
    const headingNode = card.querySelector('h2');
    const paragraphs = card.querySelectorAll('p');
    if (title) title.textContent = sectionTitle;
    if (headingNode) headingNode.textContent = heading;
    if (paragraphs[1]) paragraphs[1].textContent = body;
    if (paragraphs[2]) paragraphs[2].innerHTML = renderUsage(howLabel, usage);
  });

  const sectionTitles = document.querySelectorAll('.help-section .section-head .section-title');
  if (sectionTitles[0]) sectionTitles[0].textContent = 'Shortcuts';
  setText('.help-section h2', text.shortcutsTitle);
  const tableHeaders = document.querySelectorAll('.shortcut-table th');
  if (tableHeaders[0]) tableHeaders[0].textContent = text.tableHeader[0];
  if (tableHeaders[1]) tableHeaders[1].textContent = text.tableHeader[1];
  if (tableHeaders[2]) tableHeaders[2].textContent = text.tableHeader[2];
  const shortcutRows = document.querySelectorAll('.shortcut-table tr:not(:first-child)');
  shortcutRows.forEach((row, index) => {
    const actionCell = row.querySelector('td:first-child');
    if (actionCell && text.shortcutActions[index]) {
      actionCell.textContent = text.shortcutActions[index];
    }
  });

  if (sectionTitles[1]) sectionTitles[1].textContent = 'Workflow';
  setText('.help-section:nth-of-type(3) h2', text.workflowTitle);
  const callout = document.querySelector('.help-section:nth-of-type(3) .callout');
  if (callout) {
    callout.innerHTML = `<strong>${language === 'en' ? 'Tip:' : '提示：'}</strong> ${text.workflowLead}`;
  }

  const notes = document.querySelectorAll('.help-notes .help-note');
  notes.forEach((note, index) => {
    const item = text.notes[index];
    if (!item) return;
    const [heading, body] = item;
    const noteHeading = note.querySelector('h3');
    const noteBody = note.querySelector('p');
    if (noteHeading) noteHeading.textContent = heading;
    if (noteBody) noteBody.textContent = body;
  });

  if (sectionTitles[2]) sectionTitles[2].textContent = 'FAQ';
  setText('.help-section:nth-of-type(4) h2', text.faqTitle);
  const faqs = document.querySelectorAll('.faq-item');
  faqs.forEach((item, index) => {
    const entry = text.faqs[index];
    if (!entry) return;
    const [heading, body] = entry;
    const faqHeading = item.querySelector('h3');
    const faqBody = item.querySelector('p');
    if (faqHeading) faqHeading.textContent = heading;
    if (faqBody) faqBody.textContent = body;
  });

  setText('.help-footer', text.footer);
}

document.addEventListener('DOMContentLoaded', async () => {
  const language = await getStoredLanguage();
  applyHelpLanguage(language);
});
