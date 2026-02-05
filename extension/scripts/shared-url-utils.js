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
