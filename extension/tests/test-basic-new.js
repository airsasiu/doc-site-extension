// 测试基本的 Markdown 链接清理功能
function testBasicCleanMarkdownLinkUrls() {
  // 基本测试用例
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
  
  console.log('开始测试基本的 Markdown 链接清理功能...');
  
  // 复制清理函数逻辑
  function cleanMarkdownLinkUrls(markdown) {
    // 按行处理文本，保留换行符
    const lines = markdown.split('\n');
    
    // 处理每一行
    const cleanedLines = lines.map(line => {
      let cleanedLine = line;
      
      // 定义一个临时标记，用于替换链接后避免后续处理影响
      const tempLinkMark = '##TEMP_LINK_MARK##';
      const tempLinks = [];
      
      // 第一步：替换所有链接，将其转换为临时标记并存储清理后的链接
      cleanedLine = cleanedLine.replace(/(!?)(\[)([^\]]+)(\]\()([^)]*)(\))/g, (match, imgMark, openBracket, text, urlOpen, url, closeParen) => {
        // 清理链接文本前后的空格
        let processedText = text.trim();
        
        // 移除链接文本中的括号
        processedText = processedText.replace(/[()]/g, '');
        
        // 移除链接文本中的关键词（忽略大小写）
        processedText = processedText.replace(/\s+(method|interface|class)\b/gi, '');
        
        // 再次清理可能产生的多余空格
        processedText = processedText.trim();
        
        // 构建新的链接，直接生成空 URL
        const newLink = `${imgMark}[${processedText}]()`;
        tempLinks.push(newLink);
        return tempLinkMark;
      });
      
      // 第二步：处理链接前后的空格
      cleanedLine = cleanedLine.replace(/(\S)(##TEMP_LINK_MARK##)/g, '$1 $2');
      cleanedLine = cleanedLine.replace(/(##TEMP_LINK_MARK##)(\S)/g, '$1 $2');
      
      // 第三步：移除多余的连续空格
      cleanedLine = cleanedLine.replace(/[ \t]+/g, ' ');
      
      // 第四步：将临时标记替换为实际链接
      let linkIndex = 0;
      cleanedLine = cleanedLine.replace(/##TEMP_LINK_MARK##/g, () => tempLinks[linkIndex++]);
      
      return cleanedLine;
    });
    
    // 将处理后的行重新组合，保留原始的换行符
    let cleanedMarkdown = cleanedLines.join('\n');
    
    // 确保连续的换行符不会被替换（保持段落间距）
    cleanedMarkdown = cleanedMarkdown.replace(/\n\s*\n/g, '\n\n');
    
    return cleanedMarkdown;
  }
  
  // 运行测试用例
  let allPassed = true;
  testCases.forEach((testCase, index) => {
    const result = cleanMarkdownLinkUrls(testCase.input);
    const passed = result === testCase.expected;
    allPassed = allPassed && passed;
    
    console.log(`\n测试用例 ${index + 1}: ${passed ? '通过' : '失败'}`);
    console.log(`输入:    ${testCase.input}`);
    console.log(`预期:    ${testCase.expected}`);
    console.log(`实际:    ${result}`);
  });
  
  console.log(`\n\n总体测试结果: ${allPassed ? '通过' : '失败'}`);
  console.log('\n测试完成!');
}

testBasicCleanMarkdownLinkUrls();