// 共享的 URL 工具函数
// 用于脚本文件中，提供与 URLUtils 相同的功能

/**
 * 从 URL 中提取产品 ID
 * @param {string} url - 文档站点 URL
 * @returns {string|null} - 产品 ID 或 null
 */
function getProductIDFromURL(url) {
  if (!url || typeof url !== 'string') {
    console.error('无效的 URL 输入:', url);
    return null;
  }
  
  // 支持多种编辑页面类型：ArticleEdit 和 DemoEdit
  // 支持带 /manage/ 前缀的情况
  const match = url.match(/manage\/(ArticleEdit|DemoEdit)\/([^?]+)|(ArticleEdit|DemoEdit)\/([^?]+)/);
  return match ? match[2] || match[4] : null;
}

/**
 * 从当前页面 URL 中提取产品 ID
 * @returns {string|null} - 产品 ID 或 null
 */
function getProductIdFromUrl() {
  const url = window.location.href;
  return getProductIDFromURL(url);
}

/**
 * 从 URL 中提取页面类型
 * @param {string} url - 文档站点 URL
 * @returns {string|null} - 页面类型（ArticleEdit 或 DemoEdit）或 null
 */
function getPageTypeFromURL(url) {
  if (!url || typeof url !== 'string') {
    console.error('无效的 URL 输入:', url);
    return null;
  }
  
  // 支持多种编辑页面类型：ArticleEdit 和 DemoEdit
  const match = url.match(/(ArticleEdit|DemoEdit)\/([^?.]+)/);
  return match ? match[1] : null;
}

/**
 * 从当前页面 URL 中提取页面类型
 * @returns {string|null} - 页面类型（ArticleEdit 或 DemoEdit）或 null
 */
function getPageTypeFromCurrentUrl() {
  const url = window.location.href;
  return getPageTypeFromURL(url);
}

/**
 * 从 URL 中提取产品 ID 和页面类型
 * @param {string} url - 文档站点 URL
 * @returns {Object|null} - 包含 productId 和 pageType 的对象或 null
 */
function getURLInfo(url) {
  if (!url || typeof url !== 'string') {
    console.error('无效的 URL 输入:', url);
    return null;
  }
  
  // 支持多种编辑页面类型：ArticleEdit 和 DemoEdit
  const match = url.match(/(ArticleEdit|DemoEdit)\/([^?.]+)/);
  if (!match) {
    return null;
  }
  
  return {
    productId: match[2],
    pageType: match[1]
  };
}

/**
 * 从当前页面 URL 中提取产品 ID 和页面类型
 * @returns {Object|null} - 包含 productId 和 pageType 的对象或 null
 */
function getCurrentURLInfo() {
  const url = window.location.href;
  return getURLInfo(url);
}

/**
 * 从 URL 中提取产品 ID（用于 getRootId 函数）
 * @param {string} url - 文档站点 URL
 * @returns {string|null} - 产品 ID 或 null
 */
function getProductIdFromRootUrl(url) {
  if (!url || typeof url !== 'string') {
    console.error('无效的 URL 输入:', url);
    return null;
  }
  
  // 支持多种编辑页面类型：ArticleEdit 和 DemoEdit
  const match = url.match(/(ArticleEdit|DemoEdit)\/([^?\/]+)/);
  return match ? match[2] : null;
}

/**
 * 从当前页面 URL 中提取产品 ID（用于 getRootId 函数）
 * @returns {string|null} - 产品 ID 或 null
 */
function getProductIdFromCurrentRootUrl() {
  const url = window.location.href;
  return getProductIdFromRootUrl(url);
}

/**
 * 从 URL 中提取页面类型（用于 getRootId 函数）
 * @param {string} url - 文档站点 URL
 * @returns {string|null} - 页面类型（ArticleEdit 或 DemoEdit）或 null
 */
function getPageTypeFromRootUrl(url) {
  if (!url || typeof url !== 'string') {
    console.error('无效的 URL 输入:', url);
    return null;
  }
  
  // 支持多种编辑页面类型：ArticleEdit 和 DemoEdit
  const match = url.match(/(ArticleEdit|DemoEdit)\/([^?\/]+)/);
  return match ? match[1] : null;
}

/**
 * 从当前页面 URL 中提取页面类型（用于 getRootId 函数）
 * @returns {string|null} - 页面类型（ArticleEdit 或 DemoEdit）或 null
 */
function getPageTypeFromCurrentRootUrl() {
  const url = window.location.href;
  return getPageTypeFromRootUrl(url);
}
