class DocsAPI {
  // 缓存对象，存储 API 请求结果
  static cache = new Map();
  // 缓存过期时间（毫秒），默认 1 小时
  static CACHE_EXPIRY = 60 * 60 * 1000;

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

  static async getDocVersions(productID) {
    try {
      const response = await fetch(`https://docs.grapecity.com.cn/documentsite/api/docversion/version/${productID}`);
      if (!response.ok) {
        throw new Error('获取文档版本失败');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取文档版本错误:', error);
      throw error;
    }
  }

  static async getDocContent(docId) {
    const cacheKey = `docContent_${docId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('使用缓存的文档内容数据');
      return cached;
    }

    try {
      const response = await fetch(`https://docs.grapecity.com.cn/documentsite/api/document/draft/${docId}`);
      if (!response.ok) {
        throw new Error('获取文档内容失败');
      }
      const data = await response.json();
      this.setToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('获取文档内容错误:', error);
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
    try {
      const response = await fetch('https://docs.grapecity.com.cn/documentsite/api/toc/item/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`创建页面失败: ${errorText || response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('创建页面错误:', error);
      throw error;
    }
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
    try {
      const response = await fetch(`https://docs.grapecity.com.cn/documentsite/api/toc/item/move-to-recycle-bin/${pageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`移至回收站失败: ${errorText || response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('移至回收站错误:', error);
      throw error;
    }
  }
  
  /**
   * 彻底删除文档页面
   * @param {string} pageId - 页面 ID
   * @returns {Promise<Object>} - 操作结果
   */
  static async permanentlyDeleteDocPage(pageId) {
    try {
      const response = await fetch(`https://docs.grapecity.com.cn/documentsite/api/toc/item/${pageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`彻底删除失败: ${errorText || response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('彻底删除错误:', error);
      throw error;
    }
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

    try {
      const url = `https://docs.grapecity.com.cn/documentsite/api/docversion/version/${productId}/tocItem/search?keyword=${encodeURIComponent(keyword)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('搜索请求失败');
      }
      
      const data = await response.json();
      
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
    } catch (error) {
      console.error('搜索文档错误:', error);
      throw error;
    }
  }
}

export default DocsAPI;
