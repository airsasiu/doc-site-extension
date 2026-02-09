/**
 * 测试内容拼接逻辑
 * 合并了 run-test.js 和 test-content-merge.js 的功能
 */
const fs = require('fs');
const path = require('path');

// 导入内容合并工具
const { mergeContent, extractPreservedContent } = require('../utils/contentMerger.js');

// 测试文件路径
const testFiles = {
  rewrite: path.join(__dirname, 'rewrite.md'),
  original: path.join(__dirname, 'original.md'),
  expect: path.join(__dirname, 'expect.md'),
  actual: path.join(__dirname, 'actual.md')
};

// 读取测试文件
function readTestFiles() {
  console.log('=== 文件路径信息 ===');
  Object.entries(testFiles).forEach(([name, filePath]) => {
    console.log(`${name}.md 路径:`, filePath);
  });

  console.log('\n=== 文件存在性检查 ===');
  const filesExist = {};
  Object.entries(testFiles).forEach(([name, filePath]) => {
    const exists = fs.existsSync(filePath);
    filesExist[name] = exists;
    console.log(`${name}.md 存在:`, exists);
  });

  console.log('\n=== 文件大小检查 ===');
  const fileContents = {};
  Object.entries(testFiles).forEach(([name, filePath]) => {
    if (filesExist[name]) {
      try {
        const stats = fs.statSync(filePath);
        console.log(`${name}.md 大小:`, stats.size, '字节');
        fileContents[name] = fs.readFileSync(filePath, 'utf8');
        console.log(`${name}.md 读取成功`);
        if (name !== 'actual') {
          console.log(`${name}.md 内容前100字符:`, fileContents[name].substring(0, 100));
        }
      } catch (e) {
        console.error(`${name}.md 读取失败:`, e.message);
        fileContents[name] = '';
      }
    } else {
      fileContents[name] = '';
    }
  });

  console.log('\n=== 测试数据加载完成 ===');
  Object.entries(fileContents).forEach(([name, content]) => {
    console.log(`${name} 长度:`, content.length);
  });

  return fileContents;
}

// 为了在控制台显示详细信息，我们包装一下导入的函数
function wrappedExtractPreservedContent(originalMarkdown) {
  console.log('\n=== 开始提取操作视频的链接markdown ===');
  const preservedContent = extractPreservedContent(originalMarkdown);
  console.log('\n=== 最终提取的保留内容 ===');
  console.log('保留内容长度:', preservedContent.length);
  console.log('保留内容:', preservedContent);
  return preservedContent;
}

// 包装合并函数，添加详细日志
function wrappedMergeContent(rewrittenMarkdown, originalMarkdown) {
  console.log('\n=== 开始测试内容拼接 ===');
  const mergedContent = mergeContent(rewrittenMarkdown, originalMarkdown);
  console.log('\n=== 拼接结果 ===');
  console.log('拼接后长度:', mergedContent.length);
  return mergedContent;
}

// 比较结果函数
function compareResults(actualContent, expectedContent) {
  console.log('\n=== 结果比较 ===');
  const isMatch = actualContent.trim() === expectedContent.trim();
  console.log('拼接结果是否与期望一致:', isMatch);

  if (!isMatch) {
    console.log('\n=== 差异分析 ===');
    console.log('期望结果长度:', expectedContent.length);
    console.log('实际结果长度:', actualContent.length);
    
    // 简单的差异显示
    const expectedLines = expectedContent.trim().split('\n');
    const actualLines = actualContent.trim().split('\n');
    
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

  return isMatch;
}

// 主测试函数
function runTest() {
  console.log('=== 开始测试内容拼接 ===');
  
  // 读取测试文件
  const files = readTestFiles();
  
  // 执行拼接
  const mergedContent = wrappedMergeContent(files.rewrite, files.original);

  // 保存实际结果到文件
  fs.writeFileSync(testFiles.actual, mergedContent);
  console.log('\n实际结果已保存到:', testFiles.actual);

  // 比较结果
  compareResults(mergedContent, files.expect);

  console.log('\n=== 测试完成 ===');
  return mergedContent;
}

// 暴露测试函数到全局，方便在浏览器中调用
if (typeof window !== 'undefined') {
  window.runTest = runTest;
  window.extractPreservedContent = extractPreservedContent;
  window.mergeContent = mergeContent;
  console.log('测试函数已暴露到全局，可通过调用 runTest() 来执行测试');
}

// 导出测试函数，方便在其他测试中使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runTest,
    extractPreservedContent,
    mergeContent,
    compareResults
  };
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runTest();
}
