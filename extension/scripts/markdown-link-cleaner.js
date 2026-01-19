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
  let cleanedMarkdown = markdown;
  
  // 匹配所有 Markdown 链接（包括图片链接和普通链接）
  // 匹配模式：
  // (^|\s|\S) - 匹配链接前面的内容（开始、空格或非空格字符）
  // (!?) - 匹配可选的图片标记!
  // (\[) - 匹配链接开始标记[
  // (\s*) - 匹配链接文本前面的空格
  // (.*?) - 匹配链接文本
  // (\s*) - 匹配链接文本后面的空格
  // (\]\() - 匹配链接 URL 开始标记](
  // (.*?) - 匹配链接 URL
  // (\)) - 匹配链接结束标记)
  // ($|\s|\S) - 匹配链接后面的内容（结束、空格或非空格字符）
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