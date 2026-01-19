// 测试清理 Markdown 链接 URL 功能
function testCleanMarkdownLinkUrls() {
  // 测试用例
  const testCases = [
    {
      input: 'This is a link sample from api[ text ]()of the IWorksheet.',
      expected: 'This is a link sample from api [text]() of the IWorksheet.'
    },
    {
      input: 'Multiple [  links  ]()with [ different ]()spacing.',
      expected: 'Multiple [links]() with [different]() spacing.'
    },
    {
      input: '![  image  ]()with spaces around text.',
      expected: '![image]() with spaces around text.'
    },
    {
      input: 'No spaces[exact]()here.',
      expected: 'No spaces [exact]() here.'
    },
    {
      input: '第一行文本[链接1]()\n第二行文本[链接2]()\n\n第三行文本[链接3]()',
      expected: '第一行文本 [链接1]()\n第二行文本 [链接2]()\n\n第三行文本 [链接3]()'
    }
  ];
  
  console.log('开始测试清理 Markdown 链接 URL 功能...');
  
  // 复制最新的清理函数逻辑
  function cleanMarkdownLinkUrls(markdown) {
    // 按行处理文本，保留换行符
    const lines = markdown.split('\n');
    
    // 处理每一行
    const cleanedLines = lines.map(line => {
      let cleanedLine = line;
      
      // 匹配所有 Markdown 链接（包括图片链接和普通链接）
      // 匹配带有前后空格的链接
      const linkRegex = /(^|\S?)(!?)(\[)(\s+)(.*?)(\s+)(\]\()(.*?)(\))(\S?|$)/g;
      
      // 替换所有链接，清理文本前后的空格
      cleanedLine = cleanedLine.replace(linkRegex, (match, before, imgMark, linkStart, textPreSpace, text, textPostSpace, urlStart, url, linkEnd, after) => {
        // 清理链接文本前后的空格
        const trimmedText = text.trim();
        
        // 构建新的链接
        const newLink = `${imgMark}${linkStart}${trimmedText}${urlStart}${linkEnd}`;
        
        // 处理链接前面的内容
        let newBefore = before;
        if (before && before !== ' ') {
          newBefore = `${before} `;
        }
        
        // 处理链接后面的内容
        let newAfter = after;
        if (after && after !== ' ') {
          newAfter = ` ${after}`;
        }
        
        return `${newBefore}${newLink}${newAfter}`;
      });
      
      // 处理没有前后空格的链接情况
      const noSpaceLinkRegex = /(^|\S)(!?)(\[)([^\]]+)(\]\()(.*?)(\))(\S|$)/g;
      cleanedLine = cleanedLine.replace(noSpaceLinkRegex, (match, before, imgMark, linkStart, text, urlStart, url, linkEnd, after) => {
        // 构建新的链接
        const newLink = `${imgMark}${linkStart}${text}${urlStart}${linkEnd}`;
        
        // 处理链接前面的内容
        let newBefore = before;
        if (before && before !== ' ') {
          newBefore = `${before} `;
        }
        
        // 处理链接后面的内容
        let newAfter = after;
        if (after && after !== ' ') {
          newAfter = ` ${after}`;
        }
        
        return `${newBefore}${newLink}${newAfter}`;
      });
      
      // 移除多余的连续空格
      cleanedLine = cleanedLine.replace(/[ \t]+/g, ' ');
      
      return cleanedLine;
    });
    
    // 将处理后的行重新组合，保留原始的换行符
    let cleanedMarkdown = cleanedLines.join('\n');
    
    // 确保连续的换行符不会被替换（保持段落间距）
    cleanedMarkdown = cleanedMarkdown.replace(/\n\s*\n/g, '\n\n');
    
    return cleanedMarkdown;
  }
  
  // 运行测试用例
  testCases.forEach((testCase, index) => {
    const result = cleanMarkdownLinkUrls(testCase.input);
    const passed = result === testCase.expected;
    
    console.log(`\n测试用例 ${index + 1}: ${passed ? '通过' : '失败'}`);
    console.log(`输入:    ${testCase.input}`);
    console.log(`预期:    ${testCase.expected}`);
    console.log(`实际:    ${result}`);
  });
  
  console.log('\n测试完成!');
}

testCleanMarkdownLinkUrls();