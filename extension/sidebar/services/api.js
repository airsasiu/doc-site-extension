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
    const cacheKey = `docVersions_${productID}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('使用缓存的文档版本数据');
      return cached;
    }

    try {
      const response = await fetch(`https://docs.grapecity.com.cn/documentsite/api/docversion/version/${productID}`);
      if (!response.ok) {
        throw new Error('获取文档版本失败');
      }
      const data = await response.json();
      this.setToCache(cacheKey, data);
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
}

export default DocsAPI;
