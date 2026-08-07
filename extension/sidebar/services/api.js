class DocsAPI {
  // 缓存对象，存储 API 请求结果
  static cache = new Map();
  // 缓存过期时间（毫秒），默认 1 小时
  static CACHE_EXPIRY = 60 * 60 * 1000;
  static DOC_API_PATH = '/documentsite/api';

  static async getBaseUrl() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(['docSiteHelperConfig'], (result) => {
        const configuredUrl = result.docSiteHelperConfig?.docApiUrl;
        if (configuredUrl) {
          resolve(configuredUrl.replace(/\/+$/, ''));
          return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          try {
            resolve(`${new URL(tabs[0]?.url).origin}${this.DOC_API_PATH}`);
          } catch (error) {
            reject(new Error('请在扩展配置页填写文档站 API URL，或先打开一个 DocSite 页面'));
          }
        });
      });
    });
  }

  // 从缓存中获取数据
  static getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // 检查缓存是否过期
    if (Date.now() - cached.timestamp > this.CACHE_EXPIRY) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // 将数据存入缓存
  static setToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 通用 API 请求方法
   * @param {string} endpoint - API 端点
   * @param {Object} options - 请求选项
   * @param {string} [options.method] - HTTP 方法，默认 GET
   * @param {Object} [options.headers] - 请求头
   * @param {Object|Array} [options.body] - 请求体
   * @param {string} [errorMessage] - 错误消息
   * @returns {Promise<Object>} - 请求结果
   */
  static async request(endpoint, options = {}, errorMessage = 'API 请求失败') {
    try {
      const url = `${await this.getBaseUrl()}${endpoint}`;
      const config = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      // 处理请求体
      if (config.body && typeof config.body !== 'string') {
        config.body = JSON.stringify(config.body);
      }

      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${errorMessage}: ${errorText || response.statusText}`);
      }
      
      try {
        const data = await response.json();
        return data;
      } catch (jsonError) {
        // 处理空响应体或JSON解析错误
        if (jsonError instanceof SyntaxError) {
          console.warn('响应体不是有效的JSON，返回空对象:', jsonError.message);
          return {};
        }
        throw jsonError;
      }
    } catch (error) {
      console.error(`${errorMessage}错误:`, error);
      throw error;
    }
  }

  static async getDocVersions(productID) {
    return this.request(`/docversion/version/${productID}`, {}, '获取文档版本失败');
  }

  static async getDocContent(docId, productId = null, pageType = null) {
    const cacheKey = `docContent_${docId}_${productId || 'unknown'}_${pageType || 'unknown'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('使用缓存的文档内容数据');
      return cached;
    }

    try {
      console.log(`尝试获取文档内容，端点: /document/draft/${docId}`);
      const data = await this.request(`/document/draft/${docId}`, {}, '获取文档内容失败');
      
      if (data) {
        console.log('成功获取文档内容，响应数据:', JSON.stringify(data, null, 2));
        
        // 检查是否包含 markdownContent 字段
        if (data.markdownContent) {
          console.log('找到 markdownContent 字段');
          this.setToCache(cacheKey, data);
          return data;
        } else {
          console.warn('响应数据中没有 markdownContent 字段:', Object.keys(data));
          throw new Error('API返回的数据中没有markdownContent字段');
        }
      } else {
        console.warn('API返回空数据');
        throw new Error('API返回空数据');
      }
    } catch (error) {
      console.error('获取文档内容失败:', error);
      throw error;
    }
  }
  
  // 清除特定缓存
  static clearCache(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
  
  /**
   * 创建新的文档页面
   * @param {Object} pageData - 页面数据
   * @param {string} pageData.displayName - 页面显示名称
   * @param {string} pageData.documentPath - 页面文档路径
   * @param {string} pageData.parentId - 父页面 ID
   * @param {string} pageData.text - 页面文本
   * @param {string} pageData.tocId - 目录 ID
   * @param {string} pageData.type - 页面类型
   * @returns {Promise<Object>} - 创建结果
   */
  static async createDocPage(pageData) {
    return this.request('/toc/item/', {
      method: 'POST',
      body: pageData
    }, '创建页面失败');
  }
  
  /**
   * 批量创建文档页面
   * @param {Array<Object>} pagesData - 页面数据数组
   * @param {Function} [progressCallback] - 进度回调函数
   * @returns {Promise<Array<Object>>} - 创建结果数组
   */
  static async batchCreateDocPages(pagesData, progressCallback) {
    const results = [];
    
    for (let i = 0; i < pagesData.length; i++) {
      try {
        const result = await this.createDocPage(pagesData[i]);
        results.push({ success: true, data: result, index: i });
      } catch (error) {
        results.push({ success: false, error: error.message, index: i });
      }
      
      // 调用进度回调
      if (progressCallback && typeof progressCallback === 'function') {
        progressCallback(i + 1, pagesData.length);
      }
    }
    
    return results;
  }
  
  /**
   * 将文档页面移至回收站
   * @param {string} pageId - 页面 ID
   * @returns {Promise<Object>} - 操作结果
   */
  static async moveToRecycleBin(pageId) {
    return this.request(`/toc/item/move-to-recycle-bin/${pageId}`, {
      method: 'DELETE'
    }, '移至回收站失败');
  }
  
  /**
   * 彻底删除文档页面
   * @param {string} pageId - 页面 ID
   * @returns {Promise<Object>} - 操作结果
   */
  static async permanentlyDeleteDocPage(pageId) {
    return this.request(`/toc/item/${pageId}`, {
      method: 'DELETE'
    }, '彻底删除失败');
  }
  
  /**
   * 批量删除文档页面（可选择删除方式）
   * @param {Array<string>} pageIds - 页面 ID 数组
   * @param {boolean} permanent - 是否彻底删除，默认 false（移至回收站）
   * @param {Function} [progressCallback] - 进度回调函数
   * @returns {Promise<Array<Object>>} - 删除结果数组
   */
  static async batchDeleteDocPages(pageIds, permanent = false, progressCallback) {
    const results = [];
    
    for (let i = 0; i < pageIds.length; i++) {
      try {
        const result = permanent 
          ? await this.permanentlyDeleteDocPage(pageIds[i])
          : await this.moveToRecycleBin(pageIds[i]);
        results.push({ success: true, data: result, index: i, pageId: pageIds[i] });
      } catch (error) {
        results.push({ success: false, error: error.message, index: i, pageId: pageIds[i] });
      }
      
      // 调用进度回调
      if (progressCallback && typeof progressCallback === 'function') {
        progressCallback(i + 1, pageIds.length);
      }
    }
    
    return results;
  }

  /**
   * 搜索文档
   * @param {string} productId - 产品 ID
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array<Object>>} - 搜索结果数组
   */
  static async searchDocs(productId, keyword) {
    const cacheKey = `searchDocs_${productId}_${keyword}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('使用缓存的搜索结果');
      return cached;
    }

    const data = await this.request(`/docversion/version/${productId}/tocItem/search?keyword=${encodeURIComponent(keyword)}`, {}, '搜索请求失败');
    
    // 合并所有结果
    const allResults = [
      ...(data.helpDocResult || []),
      ...(data.apiDocResult || []),
      ...(data.demoDocResult || [])
    ];
    
    // 排序：完全匹配的结果放在前面
    const keywordLower = keyword.toLowerCase();
    allResults.sort((a, b) => {
      const aExactMatch = a.text.toLowerCase() === keywordLower || a.displayName.toLowerCase() === keywordLower;
      const bExactMatch = b.text.toLowerCase() === keywordLower || b.displayName.toLowerCase() === keywordLower;
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      return 0;
    });
    
    this.setToCache(cacheKey, allResults);
    return allResults;
  }
}

export default DocsAPI;
