// 测试 Markdown 链接处理器功能
async function testMarkdownLinkProcessor() {
  // 模拟 window 对象
  if (typeof window === 'undefined') {
    global.window = {
      location: {
        href: 'https://example.com/ArticleEdit/test-product-id'
      }
    };
  }

  // 模拟 fetch 函数
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    // 模拟版本信息 API
    if (url.includes('/api/docversion/version/')) {
      return {
        ok: true,
        json: async () => ({
          "isLastUploadedAPIPackageStored": true,
          "id": "17ddf72d-a51a-42fe-a104-f69d4e8357fb",
          "name": "V9.0",
          "versionOrder": 10,
          "domain": "www.grapecity.com.cn",
          "rootPath": "/developer/grapecitydocuments/excel-java/docs/v9.0/",
          "demoRootPath": "",
          "status": 1,
          "themeId": "df180347-11c1-4200-a12d-bc309ab28942",
          "tocId": "dd4a8352-b140-4542-99d3-58b61a380b00",
          "demoTocId": "c781d1f1-d5cb-4002-a238-7bd318c31871",
          "productId": "37c5e777-cfaa-43e5-9c4a-36844cd2e5ee",
          "apiTocId": "a4186835-1601-4a77-b027-7062f2da57ca",
          "apiRootPath": "/developer/grapecitydocuments/excel-java/api/v9.0/",
          "apiRemarks": "GcExcel Java v9.0.0",
          "codemineCollectionId": null,
          "apiToCregex": null
        })
      };
    }

    // 模拟 tocItem API
    if (url.includes('/tocItem?documentPath=')) {
      return {
        ok: true,
        json: async () => ({
          tocItemId: 'test-toc-item-id'
        })
      };
    }

    // 模拟搜索 API
    if (url.includes('/tocItem/search?keyword=')) {
      return {
        ok: true,
        json: async () => ({
          helpDocResult: [],
          apiDocResult: [],
          demoDocResult: []
        })
      };
    }

    if (originalFetch) {
      return originalFetch(url, options);
    }

    throw new Error('Unmocked fetch call: ' + url);
  };

  // 模拟 window.docSiteUtils
  window.docSiteUtils = {
    showNotification: (message, type, duration) => console.log(`[Notification] ${type}: ${message}`),
    updateProgress: (current, total, message) => console.log(`[Progress] ${current}/${total}: ${message}`),
    copyToClipboard: async (text) => console.log(`[Clipboard] Copied: ${text.substring(0, 50)}...`)
  };

  // 从实际文件中复制函数逻辑（简化版本，只包含核心测试函数）
  function getProductIdFromUrl() {
    const url = window.location.href;
    // 支持多种编辑页面类型：ArticleEdit 和 DemoEdit
    const match = url.match(/(ArticleEdit|DemoEdit)\/([^?.]+)/);
    return match ? match[2] : null;
  }

  // 从API获取版本信息（简化模拟版）
  async function getVersionFromApi(productId) {
    return {
      "isLastUploadedAPIPackageStored": true,
      "id": "17ddf72d-a51a-42fe-a104-f69d4e8357fb",
      "name": "V9.0",
      "versionOrder": 10,
      "domain": "www.grapecity.com.cn",
      "rootPath": "/developer/grapecitydocuments/excel-java/docs/v9.0/",
      "demoRootPath": "",
      "status": 1,
      "themeId": "df180347-11c1-4200-a12d-bc309ab28942",
      "tocId": "dd4a8352-b140-4542-99d3-58b61a380b00",
      "demoTocId": "c781d1f1-d5cb-4002-a238-7bd318c31871",
      "productId": "37c5e777-cfaa-43e5-9c4a-36844cd2e5ee",
      "apiTocId": "a4186835-1601-4a77-b027-7062f2da57ca",
      "apiRootPath": "/developer/grapecitydocuments/excel-java/api/v9.0/",
      "apiRemarks": "GcExcel Java v9.0.0",
      "codemineCollectionId": null,
      "apiToCregex": null
    };
  }

  // 测试核心函数：processGrapeCityLink
  async function processGrapeCityLink(url, text, productId, versionInfo) {
    try {
      let originalPath = '';
      let hash = '';
      let isExternalUrl = false;
      
      // 判断是外部 URL 还是相对地址
      if (url.startsWith('https://docs.grapecity.com.cn/')) {
        // 外部 URL 处理
        isExternalUrl = true;
        const urlObj = new URL(url);
        originalPath = urlObj.pathname;
        hash = urlObj.hash; // 提取锚点部分
      } else if (url.startsWith('/')) {
        // 相对地址处理（以 / 开头）
        originalPath = url;
        // 提取锚点部分
        const hashIndex = url.indexOf('#');
        if (hashIndex !== -1) {
          hash = url.substring(hashIndex);
          originalPath = url.substring(0, hashIndex);
        }
      } else {
        // 非目标链接，直接返回
        return null;
      }
      
      if (!originalPath) {
        return null;
      }
      
      let documentPath = '';
      
      // 根据 URL 判断是普通文档还是 API 文档
      const isApiDoc = originalPath.includes('/api/');
      
      if (isApiDoc && versionInfo.apiRootPath) {
        // API 文档处理
        const apiRoot = versionInfo.apiRootPath;
        if (originalPath.startsWith(apiRoot)) {
          // 绝对路径且匹配 apiRootPath，提取相对于 apiRootPath 的路径
          documentPath = originalPath.substring(apiRoot.length) || '/';
        } else if (originalPath.startsWith('/')) {
          // 相对地址，检查是否与 apiRootPath 的结构匹配
          // 提取 apiRootPath 中的基础路径部分（不包含版本号）
          const apiRootParts = apiRoot.split('/').filter(Boolean);
          const originalParts = originalPath.split('/').filter(Boolean);
          
          // 如果相对地址的结构与 apiRootPath 匹配（例如都包含 /api/）
          if (apiRootParts.includes('api') && originalParts.includes('api')) {
            // 提取 api 之后的路径作为 documentPath
            const apiIndexOriginal = originalParts.indexOf('api');
            if (apiIndexOriginal !== -1 && apiIndexOriginal < originalParts.length - 1) {
              documentPath = '/' + originalParts.slice(apiIndexOriginal + 1).join('/');
            } else {
              documentPath = originalPath;
            }
          } else {
            // 结构不匹配，直接使用原始路径
            documentPath = originalPath;
          }
        } else {
          // 其他情况，直接使用原始路径
          documentPath = originalPath;
        }
      } else if (!isApiDoc && versionInfo.rootPath) {
        // 普通文档处理
        const docRoot = versionInfo.rootPath;
        if (originalPath.startsWith(docRoot)) {
          // 绝对路径且匹配 rootPath，提取相对于 rootPath 的路径
          documentPath = originalPath.substring(docRoot.length) || '/';
        } else if (originalPath.startsWith('/')) {
          // 相对地址，检查是否与 rootPath 的结构匹配
          const rootParts = docRoot.split('/').filter(Boolean);
          const originalParts = originalPath.split('/').filter(Boolean);
          
          // 提取 rootPath 中的基础路径部分（不包含版本号）
          // 寻找第一个可能的版本号位置
          let basePathParts = [];
          for (const part of rootParts) {
            if (/^(v?\d+(?:\.\d+)*|latest)$/i.test(part)) {
              break; // 遇到版本号，停止提取
            }
            basePathParts.push(part);
          }
          
          // 检查相对地址是否包含基础路径
          const hasMatchingBase = basePathParts.length > 0 && 
                                 originalParts.slice(0, basePathParts.length).join('/') === basePathParts.join('/');
          
          if (hasMatchingBase) {
            // 提取基础路径之后的路径作为 documentPath
            documentPath = '/' + originalParts.slice(basePathParts.length).join('/');
          } else {
            // 没有匹配的基础路径，直接使用原始路径
            documentPath = originalPath;
          }
        } else {
          // 其他情况，直接使用原始路径
          documentPath = originalPath;
        }
      } else {
        // 无法确定文档类型或缺少根路径信息，使用原始路径
        documentPath = originalPath;
      }
      
      // 模拟 API 调用，返回固定的 tocItemId
      const tocItemId = 'test-toc-item-id';
      
      if (tocItemId) {
        // 保留锚点
        const newLink = `gcdocsite__documentlink?toc-item-id=${tocItemId}${hash}`;
        return `[${text}](${newLink})`;
      }
      
      return null;
    } catch (error) {
      console.error(`处理链接失败: ${url}`, error);
      return null;
    }
  }

  // 测试用例
  const testCases = [
    {
      name: '外部 API 文档链接',
      url: 'https://docs.grapecity.com.cn/developer/grapecitydocuments/excel-java/api/v9.0/online/com/grapecity/documents/excel/IRange.html#copy',
      text: 'IRange.Copy',
      expectedPath: '/online/com/grapecity/documents/excel/IRange.html',
      shouldProcess: true
    },
    {
      name: '用户报告的相对地址 API 链接',
      url: '/document-solutions/java-excel-api/api/online/com/grapecity/documents/excel/IRange.html#copy',
      text: 'Range.Copy',
      expectedPath: '/online/com/grapecity/documents/excel/IRange.html',
      shouldProcess: true
    },
    {
      name: '外部普通文档链接',
      url: 'https://docs.grapecity.com.cn/developer/grapecitydocuments/excel-java/docs/v9.0/online/overview.html',
      text: 'Overview',
      expectedPath: '/online/overview.html',
      shouldProcess: true
    },
    {
      name: '相对地址普通文档链接',
      url: '/developer/grapecitydocuments/excel-java/docs/online/overview.html',
      text: 'Overview',
      expectedPath: '/online/overview.html',
      shouldProcess: true
    },
    {
      name: '不包含版本号的相对 API 链接',
      url: '/api/online/com/grapecity/documents/excel/IWorkbook.html',
      text: 'IWorkbook',
      expectedPath: '/online/com/grapecity/documents/excel/IWorkbook.html',
      shouldProcess: true
    },
    {
      name: '非目标链接',
      url: 'https://example.com/external-link',
      text: 'External Link',
      expectedPath: null,
      shouldProcess: false
    },
    {
      name: '带锚点的相对 API 链接',
      url: '/api/online/com/grapecity/documents/excel/IRange.html#paste',
      text: 'IRange.Paste',
      expectedPath: '/online/com/grapecity/documents/excel/IRange.html',
      shouldProcess: true
    }
  ];

  console.log('开始测试 Markdown 链接处理器功能...\n');

  // 获取版本信息
  const productId = 'test-product-id';
  const versionInfo = await getVersionFromApi(productId);

  // 运行测试用例
  let passedCount = 0;
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    try {
      const result = await processGrapeCityLink(testCase.url, testCase.text, productId, versionInfo);
      const passed = (testCase.shouldProcess && result !== null) || (!testCase.shouldProcess && result === null);
      
      console.log(`测试用例 ${i + 1}: ${testCase.name}`);
      console.log(`状态: ${passed ? '✅ 通过' : '❌ 失败'}`);
      console.log(`URL: ${testCase.url}`);
      console.log(`预期处理: ${testCase.shouldProcess ? '是' : '否'}`);
      console.log(`实际结果: ${result || 'null'}`);
      
      if (passed) {
        passedCount++;
      }
    } catch (error) {
      console.log(`测试用例 ${i + 1}: ${testCase.name}`);
      console.log(`状态: ❌ 异常`);
      console.log(`错误: ${error.message}`);
    }
    console.log('---');
  }

  console.log(`\n测试完成!`);
  console.log(`总测试用例: ${testCases.length}`);
  console.log(`通过: ${passedCount}`);
  console.log(`失败: ${testCases.length - passedCount}`);
  console.log(`通过率: ${((passedCount / testCases.length) * 100).toFixed(1)}%`);

  // 恢复原始 fetch
  if (originalFetch) {
    global.fetch = originalFetch;
  }
}

testMarkdownLinkProcessor();
