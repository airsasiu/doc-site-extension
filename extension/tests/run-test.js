/**
 * 运行内容拼接测试
 */
const fs = require('fs');
const path = require('path');

// 读取测试文件
const rewritePath = path.join(__dirname, 'rewrite.md');
const originalPath = path.join(__dirname, 'original.md');
const expectPath = path.join(__dirname, 'expect.md');

console.log('=== 文件路径信息 ===');
console.log('当前目录:', __dirname);
console.log('rewrite.md 路径:', rewritePath);
console.log('original.md 路径:', originalPath);
console.log('expect.md 路径:', expectPath);

// 检查文件是否存在
console.log('\n=== 文件存在性检查 ===');
console.log('rewrite.md 存在:', fs.existsSync(rewritePath));
console.log('original.md 存在:', fs.existsSync(originalPath));
console.log('expect.md 存在:', fs.existsSync(expectPath));

// 检查文件大小
console.log('\n=== 文件大小检查 ===');
if (fs.existsSync(rewritePath)) {
    const rewriteStats = fs.statSync(rewritePath);
    console.log('rewrite.md 大小:', rewriteStats.size, '字节');
}
if (fs.existsSync(originalPath)) {
    const originalStats = fs.statSync(originalPath);
    console.log('original.md 大小:', originalStats.size, '字节');
}
if (fs.existsSync(expectPath)) {
    const expectStats = fs.statSync(expectPath);
    console.log('expect.md 大小:', expectStats.size, '字节');
}

// 读取文件内容
let rewrittenMarkdown = '';
let originalMarkdown = '';
let expectedMarkdown = '';

try {
    rewrittenMarkdown = fs.readFileSync(rewritePath, 'utf8');
    console.log('\nrewrite.md 读取成功');
    console.log('rewrite.md 内容前100字符:', rewrittenMarkdown.substring(0, 100));
} catch (e) {
    console.error('rewrite.md 读取失败:', e.message);
}

try {
    originalMarkdown = fs.readFileSync(originalPath, 'utf8');
    console.log('\noriginal.md 读取成功');
    console.log('original.md 内容:', originalMarkdown);
} catch (e) {
    console.error('original.md 读取失败:', e.message);
}

try {
    expectedMarkdown = fs.readFileSync(expectPath, 'utf8');
    console.log('\nexpect.md 读取成功');
    console.log('expect.md 内容前100字符:', expectedMarkdown.substring(0, 100));
} catch (e) {
    console.error('expect.md 读取失败:', e.message);
}

console.log('\n=== 测试数据加载完成 ===');
console.log('rewrittenMarkdown 长度:', rewrittenMarkdown.length);
console.log('originalMarkdown 长度:', originalMarkdown.length);
console.log('expectedMarkdown 长度:', expectedMarkdown.length);

// 提取保留内容的函数
function extractPreservedContent(originalMarkdown) {
  let videoMarkdown = '';
  let fullscreenMarkdown = '';
  let codemineBlockMarkdown = '';

  // 1. 提取操作视频的链接markdown
  console.log('\n=== 开始提取操作视频的链接markdown ===');
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
  console.log('\n=== 开始提取全屏打开Demo的示例链接markdown ===');
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
  console.log('\n=== 开始提取包含全屏打开的整行 ===');
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
  console.log('\n=== 开始提取jscodemineblock ===');
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
  console.log('\n=== 最终提取的保留内容 ===');
  console.log('保留内容长度:', preservedContent.length);
  console.log('保留内容:', preservedContent);

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

// 运行测试
console.log('\n=== 开始测试内容拼接 ===');
const mergedContent = mergeContent(rewrittenMarkdown, originalMarkdown);

console.log('\n=== 拼接结果 ===');
console.log('拼接后长度:', mergedContent.length);

// 保存实际结果到文件
const actualPath = path.join(__dirname, 'actual.md');
fs.writeFileSync(actualPath, mergedContent);
console.log('\n实际结果已保存到:', actualPath);

// 比较结果
console.log('\n=== 结果比较 ===');
const isMatch = mergedContent.trim() === expectedMarkdown.trim();
console.log('拼接结果是否与期望一致:', isMatch);

if (!isMatch) {
  console.log('\n=== 差异分析 ===');
  console.log('期望结果长度:', expectedMarkdown.length);
  console.log('实际结果长度:', mergedContent.length);
  
  // 简单的差异显示
  const expectedLines = expectedMarkdown.trim().split('\n');
  const actualLines = mergedContent.trim().split('\n');
  
  console.log('\n=== 前20行内容比较 ===');
  for (let i = 0; i < Math.min(20, expectedLines.length, actualLines.length); i++) {
    if (expectedLines[i] !== actualLines[i]) {
      console.log(`行 ${i + 1} 不一致:`);
      console.log(`期望: ${expectedLines[i]}`);
      console.log(`实际: ${actualLines[i]}`);
    } else {
      console.log(`行 ${i + 1}: ${expectedLines[i]}`);
    }
  }
}

console.log('\n=== 测试完成 ===');
