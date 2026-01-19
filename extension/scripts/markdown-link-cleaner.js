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

// 清理 Markdown 中链接的 URL
function cleanMarkdownLinkUrls(markdown) {
  let cleanedMarkdown = markdown;
  
  // 匹配所有 Markdown 链接（包括图片链接和普通链接）
  const linkRegex = /(!?\[(.*?)\]\()(.*?)(\))/g;
  
  // 替换所有链接的 URL 为空
  cleanedMarkdown = cleanedMarkdown.replace(linkRegex, '$1$4');
  
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