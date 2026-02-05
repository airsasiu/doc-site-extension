class URLUtils {
  /**
   * 从 URL 中提取产品 ID
   * @param {string} url - 文档站点 URL
   * @returns {string|null} - 产品 ID 或 null
   */
  static getProductIDFromURL(url) {
    if (!url || typeof url !== 'string') {
      console.error('无效的 URL 输入:', url);
      return null;
    }
    
    // 支持多种编辑页面类型：ArticleEdit 和 DemoEdit
    const match = url.match(/(ArticleEdit|DemoEdit)\/([^?.]+)/);
    return match ? match[2] : null;
  }

  /**
   * 从 URL 中提取页面类型
   * @param {string} url - 文档站点 URL
   * @returns {string|null} - 页面类型（ArticleEdit 或 DemoEdit）或 null
   */
  static getPageTypeFromURL(url) {
    if (!url || typeof url !== 'string') {
      console.error('无效的 URL 输入:', url);
      return null;
    }
    
    // 支持多种编辑页面类型：ArticleEdit 和 DemoEdit
    const match = url.match(/(ArticleEdit|DemoEdit)\/([^?.]+)/);
    return match ? match[1] : null;
  }

  /**
   * 从 URL 中提取产品 ID 和页面类型
   * @param {string} url - 文档站点 URL
   * @returns {Object|null} - 包含 productId 和 pageType 的对象或 null
   */
  static getURLInfo(url) {
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
   * 获取当前活动标签页的 URL
   * @returns {Promise<string>} - 当前标签页 URL
   * @throws {Error} - 如果无法获取当前标签页
   */
  static async getCurrentTabUrl() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tabs || tabs.length === 0) {
        throw new Error('无法获取当前标签页');
      }
      
      const currentTab = tabs[0];
      if (!currentTab.url) {
        throw new Error('当前标签页没有 URL');
      }
      
      return currentTab.url;
    } catch (error) {
      console.error('获取当前标签页 URL 失败:', error);
      throw error;
    }
  }

  /**
   * 导航到指定 URL
   * @param {string} url - 目标 URL
   * @returns {Promise<void>}
   * @throws {Error} - 如果导航失败
   */
  static async navigateCurrentTab(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('无效的 URL:', url);
    }
    
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tabs || tabs.length === 0) {
        throw new Error('无法获取当前标签页');
      }
      
      const currentTab = tabs[0];
      await chrome.tabs.update(currentTab.id, { url: url });
    } catch (error) {
      console.error('导航到 URL 失败:', error);
      throw error;
    }
  }
}

export default URLUtils;
