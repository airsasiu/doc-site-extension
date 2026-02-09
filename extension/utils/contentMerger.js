/**
 * 内容合并工具
 * 用于提取和合并需要保留的内容
 */

/**
 * 提取需要保留的内容
 * @param {string} originalMarkdown - 原始markdown内容
 * @returns {string} 提取的保留内容
 */
function extractPreservedContent(originalMarkdown) {
  let videoMarkdown = '';
  let fullscreenMarkdown = '';
  let codemineBlockMarkdown = '';

  // 1. 提取操作视频的链接markdown
  console.log('开始提取操作视频的链接markdown');
  const videoLinkRegex = /\[操作视频\]\([^)]+\)/g;
  let match;
  let videoLinksFound = 0;
  while ((match = videoLinkRegex.exec(originalMarkdown)) !== null) {
    console.log('找到视频链接markdown:', match[0]);
    videoMarkdown += match[0] + '\n\n';
    videoLinksFound++;
  }
  console.log('视频链接markdown提取完成，共找到:', videoLinksFound, '个');

  // 2. 提取全屏打开Demo的示例链接markdown
  console.log('开始提取全屏打开Demo的示例链接markdown');
  const demoLinkRegex = /\[全屏打开\]\([^)]+\)/g;
  let demoLinksFound = 0;
  while ((match = demoLinkRegex.exec(originalMarkdown)) !== null) {
    console.log('找到全屏Demo链接markdown:', match[0]);
    fullscreenMarkdown += match[0] + '\n\n';
    demoLinksFound++;
  }
  console.log('全屏Demo链接markdown提取完成，共找到:', demoLinksFound, '个');

  // 3. 提取包含全屏打开的整行
  console.log('开始提取包含全屏打开的整行');
  const fullscreenLineRegex = /^.*\[全屏打开\]\([^)]+\).*$/gm;
  let fullscreenLinesFound = 0;
  while ((match = fullscreenLineRegex.exec(originalMarkdown)) !== null) {
    console.log('找到包含全屏打开的整行:', match[0]);
    fullscreenMarkdown += match[0] + '\n\n';
    fullscreenLinesFound++;
  }
  console.log('包含全屏打开的整行提取完成，共找到:', fullscreenLinesFound, '个');

  // 去重，避免重复添加
  const lines = fullscreenMarkdown.trim().split('\n');
  const uniqueLines = [...new Set(lines)];
  fullscreenMarkdown = uniqueLines.join('\n') + '\n\n';

  // 4. 提取jscodemineblock
  console.log('开始提取jscodemineblock');
  const codemineBlockRegex = /\$\$codemineBlock[\s\S]*?\$\$/g;
  let codemineBlocksFound = 0;
  while ((match = codemineBlockRegex.exec(originalMarkdown)) !== null) {
    console.log('找到jscodemineblock，长度:', match[0].length);
    codemineBlockMarkdown += match[0] + '\n\n';
    codemineBlocksFound++;
  }
  console.log('jscodemineblock提取完成，共找到:', codemineBlocksFound, '个');

  // 组合保留内容
  let preservedContent = videoMarkdown + fullscreenMarkdown + codemineBlockMarkdown;
  console.log('最终提取的保留内容长度:', preservedContent.length);
  console.log('最终提取的保留内容前500字符:', preservedContent.substring(0, 500));

  return preservedContent;
}

/**
 * 合并内容
 * @param {string} rewrittenMarkdown - 重写后的markdown内容
 * @param {string} originalMarkdown - 原始markdown内容
 * @returns {string} 合并后的内容
 */
function mergeContent(rewrittenMarkdown, originalMarkdown) {
  // 提取保留内容
  const preservedContent = extractPreservedContent(originalMarkdown);
  
  // 拼接内容
  let mergedContent = rewrittenMarkdown;
  if (preservedContent) {
    mergedContent += '\n\n' + preservedContent;
  }
  
  return mergedContent;
}

// 导出函数，支持 CommonJS 和 ES6 模块系统
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS 模块导出
  module.exports = {
    extractPreservedContent,
    mergeContent
  };
} else if (typeof window !== 'undefined') {
  // 浏览器环境导出
  window.contentMerger = {
    extractPreservedContent,
    mergeContent
  };
} else if (typeof exports !== 'undefined') {
  // ES6 模块导出
  exports.extractPreservedContent = extractPreservedContent;
  exports.mergeContent = mergeContent;
}
