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
    
    // 匹配所有 Markdown 链接（包括图片链接和普通链接）
      // 匹配模式：
      // (^|\S?) - 匹配链接前面的内容（开始或可选的非空格字符）
      // (!?) - 匹配可选的图片标记!
      // (\[) - 匹配链接开始标记[
      // (\s*) - 匹配链接文本前面的空格
      // (.*?) - 匹配链接文本
      // (\s*) - 匹配链接文本后面的空格
      // (\]\() - 匹配链接 URL 开始标记](
      // (.*?) - 匹配链接 URL
      // (\)) - 匹配链接结束标记)
      // (\S?|$) - 匹配链接后面的内容（可选的非空格字符或结束）
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