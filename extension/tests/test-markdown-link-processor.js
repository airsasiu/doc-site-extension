// 测试 Markdown 链接处理器功能
async function testMarkdownLinkProcessor() {
  let lastTocItemRequestUrl = null;

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
    // 模拟 tocItem API
    if (url.includes('/tocItem?documentPath=')) {
      lastTocItemRequestUrl = url;
      return {
        ok: true,
        json: async () => ({
          tocItemId: 'test-toc-item-id'
        })
      };
    }

    // 模拟版本信息 API
    if (url.includes('/api/docversion/version/') && !url.includes('/tocItem')) {
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

  function applyLinkRules(path, productType, linkRules) {
    if (!linkRules || !linkRules[productType]) {
      return path;
    }

    const rule = linkRules[productType];
    if (rule.apiPathPattern && rule.replaceWith !== undefined) {
      const regex = new RegExp(rule.apiPathPattern, 'i');
      return path.replace(regex, rule.replaceWith);
    }

    return path;
  }

  function getRootBasePath(rootPath) {
    if (!rootPath) {
      return '';
    }

    const trimmedRoot = rootPath.endsWith('/') ? rootPath.slice(0, -1) : rootPath;
    const parts = trimmedRoot.split('/');
    const lastSegment = parts[parts.length - 1];

    if (/^(v?\d+(?:\.\d+)*|latest)$/i.test(lastSegment)) {
      return `${parts.slice(0, -1).join('/')}/`;
    }

    return `${trimmedRoot}/`;
  }

  function detectProductType(path, versionInfo) {
    if (versionInfo && versionInfo.apiRootPath) {
      if (versionInfo.apiRootPath.includes('/java/')) {
        return 'java';
      } else if (versionInfo.apiRootPath.includes('/js/') || versionInfo.apiRootPath.includes('/javascript/')) {
        return 'js';
      } else if (/(\/csharp\/|\/dotnet\/|-net\/)/i.test(versionInfo.apiRootPath)) {
        return 'csharp';
      }
    }

    if (path.includes('/java/')) {
      return 'java';
    } else if (path.includes('/js/') || path.includes('/javascript/')) {
      return 'js';
    } else if (/(\/csharp\/|\/dotnet\/|-net\/)/i.test(path)) {
      return 'csharp';
    }

    return 'java';
  }

  function normalizePathWithRoot(path, rootPath, rootType) {
    if (!path || !rootPath) {
      return path;
    }

    if (path.startsWith(rootPath)) {
      return path;
    }

    const basePath = getRootBasePath(rootPath);
    if (basePath && path.startsWith(basePath)) {
      return rootPath + path.substring(basePath.length);
    }

    let normalizedPath = path;
    const shortPrefix = rootType === 'api' ? '/api/' : '/docs/';

    if (normalizedPath.startsWith(shortPrefix)) {
      normalizedPath = normalizedPath.substring(shortPrefix.length);
      return rootPath + normalizedPath;
    }

    if (rootType === 'api') {
      const apiPathMatch = normalizedPath.match(/\/(classes|interfaces|enums|modules|namespaces)\//i);
      if (apiPathMatch && apiPathMatch.index > 0) {
        normalizedPath = normalizedPath.substring(apiPathMatch.index);
      }
    }

    if (normalizedPath.startsWith('/developer/')) {
      return normalizedPath;
    }

    return rootPath + normalizedPath.replace(/^\//, '');
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
        const apiBasePath = getRootBasePath(apiRoot);
        const config = {
          linkRules: {
            "java": {
              "apiPathPattern": "/document-solutions/.*?/api/online/",
              "replaceWith": "/"
            },
            "js": {
              "apiPathPattern": "/api/",
              "replaceWith": "/"
            },
            "csharp": {
              "apiPathPattern": "/api/",
              "replaceWith": "/"
            }
          }
        };
        const isRootedApiPath = originalPath.startsWith(apiRoot) || (apiBasePath && originalPath.startsWith(apiBasePath));
        const productType = detectProductType(originalPath, versionInfo);
        const processedPath = isRootedApiPath
          ? originalPath
          : applyLinkRules(originalPath, productType, config.linkRules);
        documentPath = normalizePathWithRoot(processedPath, apiRoot, 'api');
      } else if (!isApiDoc && versionInfo.rootPath) {
        // 普通文档处理
        const docRoot = versionInfo.rootPath;
        if (originalPath.startsWith(docRoot)) {
          if (isExternalUrl) {
            documentPath = originalPath;
          } else {
            documentPath = originalPath.substring(docRoot.length) || '/';
          }
        } else if (originalPath.startsWith('/')) {
          documentPath = normalizePathWithRoot(originalPath, docRoot, 'docs');
        } else {
          // 其他情况，直接使用原始路径
          documentPath = originalPath;
        }
      } else {
        // 无法确定文档类型或缺少根路径信息，使用原始路径
        documentPath = originalPath;
      }
      
      await fetch(`https://docs.grapecity.com.cn/documentsite/api/docversion/version/${productId}/tocItem?documentPath=${encodeURIComponent(documentPath)}`);

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
      expectedPath: '/developer/grapecitydocuments/excel-java/api/v9.0/online/com/grapecity/documents/excel/IRange.html',
      shouldProcess: true
    },
    {
      name: '用户报告的相对地址 API 链接',
      url: '/document-solutions/java-excel-api/api/online/com/grapecity/documents/excel/IRange.html#copy',
      text: 'Range.Copy',
      expectedPath: '/developer/grapecitydocuments/excel-java/api/v9.0/com/grapecity/documents/excel/IRange.html',
      shouldProcess: true
    },
    {
      name: '外部普通文档链接',
      url: 'https://docs.grapecity.com.cn/developer/grapecitydocuments/excel-java/docs/v9.0/online/overview.html',
      text: 'Overview',
      expectedPath: '/developer/grapecitydocuments/excel-java/docs/v9.0/online/overview.html',
      shouldProcess: true
    },
    {
      name: '相对地址普通文档链接',
      url: '/developer/grapecitydocuments/excel-java/docs/online/overview.html',
      text: 'Overview',
      expectedPath: '/developer/grapecitydocuments/excel-java/docs/v9.0/online/overview.html',
      shouldProcess: true
    },
    {
      name: '不包含版本号的相对 API 链接',
      url: '/api/online/com/grapecity/documents/excel/IWorkbook.html',
      text: 'IWorkbook',
      expectedPath: '/developer/grapecitydocuments/excel-java/api/v9.0/online/com/grapecity/documents/excel/IWorkbook.html',
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
      expectedPath: '/developer/grapecitydocuments/excel-java/api/v9.0/online/com/grapecity/documents/excel/IRange.html',
      shouldProcess: true
    },
    {
      name: '外部 .NET API 完整链接不应重复拼接根路径',
      url: 'https://docs.grapecity.com.cn/developer/grapecitydocuments/excel-net/api/V9.1/GcDocs.Excel/GrapeCity.Documents.Excel.CalcError.html',
      text: 'CalcError',
      expectedPath: '/developer/grapecitydocuments/excel-net/api/V9.1/GcDocs.Excel/GrapeCity.Documents.Excel.CalcError.html',
      shouldProcess: true,
      versionInfo: {
        rootPath: '/developer/grapecitydocuments/excel-net/docs/V9.1/',
        apiRootPath: '/developer/grapecitydocuments/excel-net/api/V9.1/'
      }
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
      const currentVersionInfo = testCase.versionInfo || versionInfo;
      lastTocItemRequestUrl = null;
      const result = await processGrapeCityLink(testCase.url, testCase.text, productId, currentVersionInfo);
      const passed = (testCase.shouldProcess && result !== null) || (!testCase.shouldProcess && result === null);
      const requestedDocumentPath = lastTocItemRequestUrl
        ? decodeURIComponent((lastTocItemRequestUrl.split('documentPath=')[1] || '').split('&')[0])
        : null;
      const pathPassed = testCase.expectedPath ? requestedDocumentPath === testCase.expectedPath : true;
      
      console.log(`测试用例 ${i + 1}: ${testCase.name}`);
      console.log(`状态: ${passed && pathPassed ? '✅ 通过' : '❌ 失败'}`);
      console.log(`URL: ${testCase.url}`);
      console.log(`预期处理: ${testCase.shouldProcess ? '是' : '否'}`);
      console.log(`实际结果: ${result || 'null'}`);
      if (testCase.expectedPath) {
        console.log(`预期 documentPath: ${testCase.expectedPath}`);
        console.log(`实际 documentPath: ${requestedDocumentPath}`);
      }
      
      if (passed && pathPassed) {
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
