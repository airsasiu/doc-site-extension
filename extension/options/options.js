import {
  DEFAULT_LANGUAGE,
  getStoredLanguage,
  normalizeLanguage,
  setActiveLanguage,
  setAttr,
  setText
} from '../shared/localization.js';

const DEFAULT_LINK_LOCALIZATION_RULES = [];
const DEFAULT_CUSTOM_CHECK_RULES = [];

const DEFAULT_CONFIG = {
  language: DEFAULT_LANGUAGE,
  sourceBaseUrl: '',
  sourceProductId: '',
  docApiUrl: '',
  copyToClipboard: true,
  linkRules: {
    default: {
      apiPathPattern: '/api/',
      replaceWith: '/'
    }
  },
  linkLocalizationRules: DEFAULT_LINK_LOCALIZATION_RULES,
  customCheckRules: DEFAULT_CUSTOM_CHECK_RULES
};

const TEXTS = {
  cn: {
    title: 'Documentation Helper 配置',
    headerEyebrow: 'Extension settings',
    headerTitle: 'Documentation Helper 配置',
    headerLead: '把源站、链接规则和团队检查规则放在同一处管理。调整后会直接影响侧边栏里的搜索、复制和检查流程。',
    chips: ['DocSite', 'Host permissions', 'Custom rules'],
    languageSectionTitle: 'General',
    languageSectionHeading: '界面语言',
    languageSectionChip: 'UI',
    languageSectionLead: '选择扩展界面显示语言。切换后会立即更新当前页面文案。',
    languageLabel: '语言 / Language',
    languageNote: '这个选择会保存在配置中，并影响扩展的主要界面文案。',
    languageOptionCn: '中文（CN）',
    languageOptionEn: 'English (EN)',
    copySectionTitle: 'Document Copy',
    copySectionHeading: '文档复制配置',
    copySectionChip: 'Source',
    copySectionLead: '配置从哪个文档站点获取 Markdown 内容，以及是否自动复制到剪贴板。',
    sourceBaseUrlLabel: '源文档基础 URL',
    sourceBaseUrlPlaceholder: '例如: https://example.com/product/docs/latest',
    sourceBaseUrlNote: '要获取文档的基础 URL，可填写任意可访问的源文档站地址。',
    sourceProductIdLabel: '源文档集 ID (可选)',
    sourceProductIdPlaceholder: '例如: 文档站 API 中的产品或版本 ID',
    sourceProductIdNote: '用于获取 TOC 结构；不填时默认使用当前页面所属文档集。',
    docApiUrlLabel: '文档站 API URL',
    docApiUrlPlaceholder: '例如: https://docs.example.com/documentsite/api',
    docApiUrlNote: '留空时会根据当前 DocSite 页面的域名自动使用 /documentsite/api。',
    copyToClipboardLabel: '复制到剪贴板',
    copyToClipboardNote: '是否将获取的 Markdown 内容复制到剪贴板。',
    linkSectionTitle: 'Link Rules',
    linkSectionHeading: '链接处理规则配置',
    linkSectionChip: 'Routing',
    linkSectionLead: '配置不同文档集的 API 链接和跨站链接转换规则，方便通用化到不同域名的 DocSite。',
    linkRulesLabel: 'API 链接处理规则 (JSON对象)',
    linkRulesNote: '按文档类型配置路径匹配和替换规则，找不到匹配类型时使用 default。',
    linkLocalizationLabel: '跨站链接转换规则 (JSON数组)',
    linkLocalizationNote: '将外部文档链接映射到当前文档站版本，再继续尝试转换为站内链接。',
    checkSectionTitle: 'Checks',
    checkSectionHeading: '常规检查规则',
    checkSectionChip: 'Policy',
    checkSectionLead: '内置检查会覆盖 SPAN 标签、Base64、转义双星号和绝对链接；这里可以补充团队自己的关键词或正则。',
    customCheckLabel: '自定义检查规则 (JSON数组)',
    customCheckNote: '支持 keywords 或 pattern；设置 enabled:false 可临时禁用某条规则。',
    saveButton: '保存配置',
    resetButton: '重置为默认值',
    statusSaved: '配置已保存',
    statusReset: '已重置为默认值',
    statusRuleError: '规则格式错误: {message}'
  },
  en: {
    title: 'Documentation Helper Settings',
    headerEyebrow: 'Extension settings',
    headerTitle: 'Documentation Helper Settings',
    headerLead: 'Keep the source site, link rules, and team checks in one place. Changes take effect immediately in the sidebar search, copy, and check flow.',
    chips: ['DocSite', 'Host permissions', 'Custom rules'],
    languageSectionTitle: 'General',
    languageSectionHeading: 'Interface language',
    languageSectionChip: 'UI',
    languageSectionLead: 'Choose the language used by the extension UI. Switching updates the current page right away.',
    languageLabel: 'Language / 语言',
    languageNote: 'This choice is saved in your configuration and affects the main extension surfaces.',
    languageOptionCn: 'Chinese (CN)',
    languageOptionEn: 'English (EN)',
    copySectionTitle: 'Document Copy',
    copySectionHeading: 'Document copy settings',
    copySectionChip: 'Source',
    copySectionLead: 'Choose where Markdown is fetched from and whether it should be copied to the clipboard automatically.',
    sourceBaseUrlLabel: 'Source document base URL',
    sourceBaseUrlPlaceholder: 'For example: https://example.com/product/docs/latest',
    sourceBaseUrlNote: 'Enter any reachable source documentation site URL.',
    sourceProductIdLabel: 'Source document set ID (optional)',
    sourceProductIdPlaceholder: 'For example: product or version ID from the docs API',
    sourceProductIdNote: 'Used to fetch the TOC structure; leave blank to use the current page document set.',
    docApiUrlLabel: 'Docs API URL',
    docApiUrlPlaceholder: 'For example: https://docs.example.com/documentsite/api',
    docApiUrlNote: 'When left blank, the extension will derive /documentsite/api from the current DocSite host.',
    copyToClipboardLabel: 'Copy to clipboard',
    copyToClipboardNote: 'Whether fetched Markdown should also be copied to the clipboard.',
    linkSectionTitle: 'Link Rules',
    linkSectionHeading: 'Link processing rules',
    linkSectionChip: 'Routing',
    linkSectionLead: 'Configure API link mapping and cross-site link rewriting so the extension can adapt to different DocSite domains.',
    linkRulesLabel: 'API link processing rules (JSON object)',
    linkRulesNote: 'Define path matching and replacement rules by document type; unmatched types fall back to default.',
    linkLocalizationLabel: 'Cross-site link conversion rules (JSON array)',
    linkLocalizationNote: 'Map external documentation links to the current documentation site version, then continue rewriting to in-site links.',
    checkSectionTitle: 'Checks',
    checkSectionHeading: 'Routine check rules',
    checkSectionChip: 'Policy',
    checkSectionLead: 'Built-in checks cover SPAN tags, Base64, escaped double asterisks, and absolute links. Add team-specific keywords or regex here.',
    customCheckLabel: 'Custom check rules (JSON array)',
    customCheckNote: 'Supports keywords or pattern. Set enabled:false to temporarily disable a rule.',
    saveButton: 'Save settings',
    resetButton: 'Reset to defaults',
    statusSaved: 'Settings saved',
    statusReset: 'Reset to defaults',
    statusRuleError: 'Rule format error: {message}'
  }
};

let currentLanguage = DEFAULT_LANGUAGE;

function formatMessage(template, params = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

function getPageText(key) {
  return TEXTS[currentLanguage]?.[key] || TEXTS.cn[key] || '';
}

function applyOptionsLanguage(language) {
  currentLanguage = normalizeLanguage(language);
  setActiveLanguage(currentLanguage);

  const page = TEXTS[currentLanguage];
  document.title = page.title;

  setText('.settings-header .eyebrow', page.headerEyebrow);
  setText('.settings-header h1', page.headerTitle);
  setText('.settings-header .lead', page.headerLead);
  setText('.settings-metrics .chip:nth-child(1)', page.chips[0]);
  setText('.settings-metrics .chip:nth-child(2)', page.chips[1]);
  setText('.settings-metrics .chip:nth-child(3)', page.chips[2]);

  setText('.language-card .section-title', page.languageSectionTitle);
  setText('.language-card h2', page.languageSectionHeading);
  setText('.language-card .chip', page.languageSectionChip);
  setText('.language-card .lead', page.languageSectionLead);
  setText('.language-card .field-label', page.languageLabel);
  setText('#uiLanguage option[value="cn"]', page.languageOptionCn);
  setText('#uiLanguage option[value="en"]', page.languageOptionEn);
  setText('.language-card .field-note', page.languageNote);

  setText('.copy-card .section-title', page.copySectionTitle);
  setText('.copy-card h2', page.copySectionHeading);
  setText('.copy-card .chip', page.copySectionChip);
  setText('.copy-card .lead', page.copySectionLead);
  setText('label[for="sourceBaseUrl"]', page.sourceBaseUrlLabel);
  setAttr('#sourceBaseUrl', 'placeholder', page.sourceBaseUrlPlaceholder);
  setText('.copy-card .field:nth-of-type(1) .field-note', page.sourceBaseUrlNote);
  setText('label[for="sourceProductId"]', page.sourceProductIdLabel);
  setAttr('#sourceProductId', 'placeholder', page.sourceProductIdPlaceholder);
  setText('.copy-card .field:nth-of-type(2) .field-note', page.sourceProductIdNote);
  setText('label[for="docApiUrl"]', page.docApiUrlLabel);
  setAttr('#docApiUrl', 'placeholder', page.docApiUrlPlaceholder);
  setText('.copy-card .field:nth-of-type(3) .field-note', page.docApiUrlNote);
  setText('label[for="copyToClipboard"] span', page.copyToClipboardLabel);
  setText('.copy-card .field:nth-of-type(4) .field-note', page.copyToClipboardNote);

  setText('.link-card .section-title', page.linkSectionTitle);
  setText('.link-card h2', page.linkSectionHeading);
  setText('.link-card .chip', page.linkSectionChip);
  setText('.link-card .lead', page.linkSectionLead);
  setText('label[for="linkRules"]', page.linkRulesLabel);
  setText('.link-card .field:nth-of-type(1) .field-note', page.linkRulesNote);
  setText('label[for="linkLocalizationRules"]', page.linkLocalizationLabel);
  setText('.link-card .field:nth-of-type(2) .field-note', page.linkLocalizationNote);

  setText('.check-card .section-title', page.checkSectionTitle);
  setText('.check-card h2', page.checkSectionHeading);
  setText('.check-card .chip', page.checkSectionChip);
  setText('.check-card .lead', page.checkSectionLead);
  setText('label[for="customCheckRules"]', page.customCheckLabel);
  setText('.check-card .field-note', page.customCheckNote);

  setText('#saveBtn', page.saveButton);
  setText('#resetBtn', page.resetButton);
}

async function saveOptions() {
  try {
    const linkRulesText = document.getElementById('linkRules').value.trim();
    const linkLocalizationRulesText = document.getElementById('linkLocalizationRules').value.trim();
    const customCheckRulesText = document.getElementById('customCheckRules').value.trim();
    let linkRules = {};
    let linkLocalizationRules = [];
    let customCheckRules = [];

    if (linkRulesText) {
      linkRules = JSON.parse(linkRulesText);
    }

    if (linkLocalizationRulesText) {
      linkLocalizationRules = JSON.parse(linkLocalizationRulesText);
      if (!Array.isArray(linkLocalizationRules)) {
        throw new Error('跨站链接转换规则必须是数组');
      }
    }

    if (customCheckRulesText) {
      customCheckRules = JSON.parse(customCheckRulesText);
      if (!Array.isArray(customCheckRules)) {
        throw new Error('自定义检查规则必须是数组');
      }
    }

    const config = {
      language: normalizeLanguage(document.getElementById('uiLanguage').value),
      sourceBaseUrl: document.getElementById('sourceBaseUrl').value.trim(),
      sourceProductId: document.getElementById('sourceProductId').value.trim(),
      docApiUrl: document.getElementById('docApiUrl').value.trim(),
      copyToClipboard: document.getElementById('copyToClipboard').checked,
      linkRules,
      linkLocalizationRules,
      customCheckRules
    };

    await requestConfiguredHostPermissions(config);

    chrome.storage.sync.set({ docSiteHelperConfig: config }, () => {
      applyOptionsLanguage(config.language);
      showStatus(getPageText('statusSaved'), 'success');
    });
  } catch (error) {
    showStatus(formatMessage(getPageText('statusRuleError'), { message: error.message }), 'error');
  }
}

async function requestConfiguredHostPermissions(config) {
  if (!chrome.permissions?.request) {
    return;
  }

  const origins = [
    getOriginPattern(config.docApiUrl),
    getOriginPattern(config.sourceBaseUrl),
    ...getRuleOriginPatterns(config.linkLocalizationRules)
  ].filter(Boolean);

  if (origins.length === 0) {
    return;
  }

  await chrome.permissions.request({ origins: [...new Set(origins)] });
}

function getOriginPattern(url) {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.origin}/*`;
  } catch (error) {
    return null;
  }
}

function getRuleOriginPatterns(rules = []) {
  return rules
    .map((rule) => (rule?.sourceHost ? `https://${rule.sourceHost}/*` : null))
    .filter(Boolean);
}

function loadOptions() {
  chrome.storage.sync.get(['docSiteHelperConfig'], (result) => {
    const config = { ...DEFAULT_CONFIG, ...result.docSiteHelperConfig };
    const language = normalizeLanguage(config.language);

    document.getElementById('uiLanguage').value = language;
    document.getElementById('sourceBaseUrl').value = config.sourceBaseUrl;
    document.getElementById('sourceProductId').value = config.sourceProductId;
    document.getElementById('docApiUrl').value = config.docApiUrl;
    document.getElementById('copyToClipboard').checked = config.copyToClipboard;
    document.getElementById('linkRules').value = JSON.stringify(config.linkRules, null, 2);
    document.getElementById('linkLocalizationRules').value = JSON.stringify(
      config.linkLocalizationRules || DEFAULT_LINK_LOCALIZATION_RULES,
      null,
      2
    );
    document.getElementById('customCheckRules').value = JSON.stringify(
      config.customCheckRules || DEFAULT_CUSTOM_CHECK_RULES,
      null,
      2
    );

    applyOptionsLanguage(language);
  });
}

function resetOptions() {
  document.getElementById('uiLanguage').value = DEFAULT_CONFIG.language;
  document.getElementById('sourceBaseUrl').value = DEFAULT_CONFIG.sourceBaseUrl;
  document.getElementById('sourceProductId').value = DEFAULT_CONFIG.sourceProductId;
  document.getElementById('docApiUrl').value = DEFAULT_CONFIG.docApiUrl;
  document.getElementById('copyToClipboard').checked = DEFAULT_CONFIG.copyToClipboard;
  document.getElementById('linkRules').value = JSON.stringify(DEFAULT_CONFIG.linkRules, null, 2);
  document.getElementById('linkLocalizationRules').value = JSON.stringify(
    DEFAULT_CONFIG.linkLocalizationRules,
    null,
    2
  );
  document.getElementById('customCheckRules').value = JSON.stringify(
    DEFAULT_CONFIG.customCheckRules,
    null,
    2
  );

  applyOptionsLanguage(DEFAULT_CONFIG.language);
  showStatus(getPageText('statusReset'), 'success');
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status motion-leave ${type}`;
  status.classList.remove('is-leaving');
  status.style.display = 'flex';

  setTimeout(() => {
    status.classList.add('is-leaving');
    setTimeout(() => {
      if (status.classList.contains('is-leaving')) {
        status.textContent = '';
        status.className = 'status';
        status.style.display = '';
      }
    }, 160);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', async () => {
  const initialLanguage = await getStoredLanguage();
  applyOptionsLanguage(initialLanguage);
  loadOptions();

  document.getElementById('uiLanguage').addEventListener('change', (event) => {
    applyOptionsLanguage(event.target.value);
  });
  document.getElementById('saveBtn').addEventListener('click', saveOptions);
  document.getElementById('resetBtn').addEventListener('click', resetOptions);
});
