/**
 * 测试内容拼接逻辑
 * 用于验证重写后的markdown与保留内容的拼接结果
 */

// 模拟提取保留内容的函数
function extractPreservedContent(originalMarkdown) {
  let videoMarkdown = '';
  let fullscreenMarkdown = '';
  let codemineBlockMarkdown = '';

  // 1. 提取操作视频的链接markdown
  console.log('开始提取操作视频的链接markdown');
  // 匹配完整的markdown链接格式，包含操作视频文本
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
  // 匹配完整的markdown链接格式，包含全屏打开文本
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

  // 3. 提取jscodemineblock
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

// 模拟拼接函数
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

// 测试函数
function testContentMerge() {
  // 测试数据 - 用户将在此处填充
  const rewrittenMarkdown = ''; // 重写好的markdown
  const originalMarkdown = ''; // 文章原有的markdown
  
  console.log('=== 开始测试内容拼接 ===');
  console.log('重写后的markdown长度:', rewrittenMarkdown.length);
  console.log('原文章markdown长度:', originalMarkdown.length);
  
  // 执行拼接
  const mergedContent = mergeContent(rewrittenMarkdown, originalMarkdown);
  
  console.log('=== 拼接结果 ===');
  console.log('拼接后markdown长度:', mergedContent.length);
  console.log('拼接后markdown内容:', mergedContent);
  
  // 显示结果
  alert(`拼接结果长度: ${mergedContent.length}\n\n拼接结果:\n${mergedContent}`);
  
  return mergedContent;
}

// 暴露测试函数到全局，方便在浏览器中调用
if (typeof window !== 'undefined') {
  window.testContentMerge = testContentMerge;
  window.extractPreservedContent = extractPreservedContent;
  window.mergeContent = mergeContent;
  console.log('测试函数已暴露到全局，可通过调用 testContentMerge() 来执行测试');
}

// 导出测试函数，方便在其他测试中使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testContentMerge,
    extractPreservedContent,
    mergeContent
  };
}
