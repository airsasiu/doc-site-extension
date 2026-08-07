export const DEFAULT_LANGUAGE = 'cn';

export function normalizeLanguage(language) {
  const value = String(language || '').trim().toLowerCase();
  return value.startsWith('en') ? 'en' : DEFAULT_LANGUAGE;
}

export function setActiveLanguage(language) {
  const normalized = normalizeLanguage(language);
  globalThis.__docSiteHelperLanguage = normalized;
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = normalized === 'en' ? 'en-US' : 'zh-CN';
  }
  return normalized;
}

export function getActiveLanguage() {
  return normalizeLanguage(globalThis.__docSiteHelperLanguage);
}

export function getStoredLanguage(defaultLanguage = DEFAULT_LANGUAGE) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['docSiteHelperConfig'], (result) => {
      resolve(normalizeLanguage(result.docSiteHelperConfig?.language || defaultLanguage));
    });
  });
}

export function setText(selector, value, root = document) {
  const element = root?.querySelector?.(selector);
  if (element) {
    element.textContent = value;
  }
}

export function setAttr(selector, attr, value, root = document) {
  const element = root?.querySelector?.(selector);
  if (element) {
    element.setAttribute(attr, value);
  }
}

export function applyTextMap(textMap, root = document) {
  if (!textMap || !root?.querySelectorAll) {
    return;
  }

  Object.entries(textMap).forEach(([selector, value]) => {
    const nodes = root.querySelectorAll(selector);
    nodes.forEach((node) => {
      node.textContent = typeof value === 'function' ? value(node) : value;
    });
  });
}
