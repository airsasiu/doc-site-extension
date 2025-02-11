class DocsAPI {
  static async getDocVersions(productID) {
    try {
      const response = await fetch(`https://docs.grapecity.com.cn/documentsite/api/docversion/version/${productID}`);
      if (!response.ok) {
        throw new Error('获取文档版本失败');
      }
      return await response.json();
    } catch (error) {
      console.error('获取文档版本错误:', error);
      throw error;
    }
  }

  static async getDocContent(docId) {
    try {
      const response = await fetch(`https://docs.grapecity.com.cn/documentsite/api/document/draft/${docId}`);
      if (!response.ok) {
        throw new Error('获取文档内容失败');
      }
      return await response.json();
    } catch (error) {
      console.error('获取文档内容错误:', error);
      throw error;
    }
  }
}

export default DocsAPI;
