import { getActiveLanguage } from '../../../shared/localization.js';

const BUILTIN_TEXTS = {
  cn: {
    spanName: 'SPAN 标签',
    spanMessage: '包含 SPAN 标签',
    base64Message: '可能包含 base64 编码内容，请仔细检查，也可能是代码中包含',
    escapedAsterisksName: '转义双星号',
    escapedAsterisksMessage: '包含转义双星号 "\\*\\*"',
    absoluteLinkName: '绝对文档链接',
    absoluteLinkMessage: '包含绝对链接，如需要跨环境迁移，建议确认是否应转换为站内链接',
    matched: '匹配到 {name}'
  },
  en: {
    spanName: 'SPAN tags',
    spanMessage: 'Contains SPAN tags',
    base64Message: 'May contain Base64-encoded content. Please check carefully; it may also simply be embedded code.',
    escapedAsterisksName: 'Escaped double asterisks',
    escapedAsterisksMessage: 'Contains escaped double asterisks "\\*\\*"',
    absoluteLinkName: 'Absolute doc links',
    absoluteLinkMessage: 'Contains absolute links. If you need to migrate across environments, confirm whether they should be rewritten to in-site links.',
    matched: 'Matched {name}'
  }
};

function formatMessage(template, params = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

function t(language, key, params = {}) {
  const template = BUILTIN_TEXTS[language]?.[key] || BUILTIN_TEXTS.cn[key] || key;
  return formatMessage(template, params);
}

function buildBuiltInCheckItems(language) {
  return {
    span: {
      id: 'span',
      name: t(language, 'spanName'),
      check: (content) => content.includes('</span>'),
      message: t(language, 'spanMessage')
    },
    base64: {
      id: 'base64',
      name: 'Base64',
      check: (content) => content.includes(';base64'),
      message: t(language, 'base64Message')
    },
    escapedAsterisks: {
      id: 'escapedAsterisks',
      name: t(language, 'escapedAsterisksName'),
      check: (content) => content.includes('\\*\\*'),
      message: t(language, 'escapedAsterisksMessage')
    },
    absoluteDocLink: {
      id: 'absoluteDocLink',
      name: t(language, 'absoluteLinkName'),
      check: (content) => {
        const regex = /https?:\/\/[^\s"')]+\/(?:[^\s"')]+|"[^"]*"|\([^)]*\))/gi;
        return regex.test(content);
      },
      message: t(language, 'absoluteLinkMessage')
    }
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildCustomCheck(rule, index, language) {
  const id = rule.id || `customRule${index + 1}`;
  const name = rule.name || id;
  const flags = rule.flags || 'i';
  const pattern = rule.pattern || (rule.keywords || []).map(escapeRegExp).join('|');

  if (!pattern) {
    return null;
  }

  let regex;
  try {
    regex = new RegExp(pattern, flags);
  } catch (error) {
    console.warn(`忽略无效检查规则 ${name}:`, error);
    return null;
  }

  return {
    id,
    name,
    check: (content) => {
      regex.lastIndex = 0;
      return regex.test(content);
    },
    message: (content) => {
      regex.lastIndex = 0;
      const matches = content.match(regex) || [];
      const uniqueMatches = [...new Set(matches)].slice(0, 10);
      if (uniqueMatches.length > 0) {
        return `${rule.message || t(language, 'matched', { name })}: ${uniqueMatches.join(', ')}`;
      }
      return rule.message || t(language, 'matched', { name });
    }
  };
}

export function buildCheckItems(customRules = []) {
  const language = getActiveLanguage();
  const builtInItems = buildBuiltInCheckItems(language);
  const customItems = customRules
    .map((rule, index) => buildCustomCheck(rule, index, language))
    .filter(Boolean)
    .reduce((items, item) => {
      items[item.id] = item;
      return items;
    }, {});

  return {
    ...builtInItems,
    ...customItems
  };
}
