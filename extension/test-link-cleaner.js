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
    }
  ];
  
  console.log('开始测试清理 Markdown 链接 URL 功能...');
  
  // 复制清理函数的逻辑
  function cleanMarkdownLinkUrls(markdown) {
    let cleanedMarkdown = markdown;
    
    // 匹配所有 Markdown 链接（包括图片链接和普通链接）
    const linkRegex = /(^|\s|\S)(!?)(\[)(\s*)(.*?)(\s*)(\]\()(.*?)(\))($|\s|\S)/g;
    
    // 替换所有链接，将文本前后的空格放到链接语法外面
    cleanedMarkdown = cleanedMarkdown.replace(linkRegex, (match, before, imgMark, linkStart, textPreSpace, text, textPostSpace, urlStart, url, linkEnd, after) => {
      // 清理链接文本前后的空格
      const trimmedText = text.trim();
      
      // 构建新的链接
      const newLink = `${imgMark}${linkStart}${trimmedText}${urlStart}${linkEnd}`;
      
      // 处理链接前面的内容
      let newBefore = before;
      if (before && before !== ' ' && before !== '\n' && before !== '\t') {
        // 如果链接前面是非空格字符，添加一个空格
        newBefore = `${before} `;
      }
      
      // 处理链接后面的内容
      let newAfter = after;
      if (after && after !== ' ' && after !== '\n' && after !== '\t') {
        // 如果链接后面是非空格字符，添加一个空格
        newAfter = ` ${after}`;
      }
      
      return `${newBefore}${newLink}${newAfter}`;
    });
    
    // 移除多余的连续空格
    cleanedMarkdown = cleanedMarkdown.replace(/\s+/g, ' ');
    
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