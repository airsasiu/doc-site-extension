// 清理 Markdown 链接的 URL
(function() {
  console.log('Markdown link cleaner script loaded and executing');
  
  try {
    // 获取选中的文本
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    console.log('Selected text for cleaning:', selectedText);
    
    if (!selectedText) {
      window.docSiteUtils.showNotification('未选择任何文本', 'error');
      return;
    }
    
    // 清理 Markdown 链接的 URL
    cleanMarkdownLinkUrls(selectedText);
    
  } catch (error) {
    console.error("清理 Markdown 链接 URL 时出错:", error);
    window.docSiteUtils.showNotification(`清理链接 URL 时出错: ${error.message}`, 'error');
  }
})();

// 清理 Markdown 链接的 URL
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
        processedText = processedText.replace(/\s+(method|interface|class|property)\b/gi, '');

        
        // 再次清理可能产生的多余空格
        processedText = processedText.trim();
        
        // 构建新的链接，直接生成空 URL
        const newLink = `${imgMark}[${processedText}]()`;
        tempLinks.push(newLink);
        return tempLinkMark;
      });
    
    // 第二步：处理链接前后的空格
    // 确保链接前后与非空格字符之间有适当的空格
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
  
  // 复制清理后的文本到剪贴板
  window.docSiteUtils.copyToClipboard(cleanedMarkdown)
    .then(() => {
      window.docSiteUtils.showNotification('链接 URL 已清理，内容已复制到剪贴板', 'success');
      console.log('清理后的 Markdown:', cleanedMarkdown);
    })
    .catch(error => {
      console.error('复制到剪贴板失败:', error);
      window.docSiteUtils.showNotification('复制到剪贴板失败', 'error');
    });
}