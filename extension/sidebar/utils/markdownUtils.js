/**
 * 在 Markdown 文本中搜索指定文本
 * @param {string} markdown - Markdown 文本
 * @param {string} searchText - 要搜索的文本
 * @returns {boolean} - 是否找到匹配项
 */
export function searchInMarkdown(markdown, searchText) {
  // 添加严格的输入验证
  if (typeof markdown !== 'string' || typeof searchText !== 'string') {
    console.error('无效的输入类型:', { markdown, searchText });
    return false;
  }
  
  if (!markdown.trim() || !searchText.trim()) return false;
  
  try {
    return markdown.toLowerCase().includes(searchText.toLowerCase());
  } catch (error) {
    console.error('搜索 Markdown 时出错:', error);
    return false;
  }
}

/**
 * 从 Markdown 文本中提取包含搜索词的上下文
 * @param {string} markdown - Markdown 文本
 * @param {string} searchText - 要搜索的文本
 * @param {number} [contextLength=100] - 上下文长度
 * @returns {string} - 包含搜索词的上下文
 */
export function extractContext(markdown, searchText, contextLength = 100) {
  // 添加严格的输入验证
  if (typeof markdown !== 'string' || typeof searchText !== 'string') {
    console.error('无效的输入类型:', { markdown, searchText });
    return '';
  }
  
  if (!markdown.trim() || !searchText.trim()) return '';
  
  // 验证并限制上下文长度
  if (typeof contextLength !== 'number' || contextLength < 0) {
    contextLength = 100;
  } else if (contextLength > 500) {
    contextLength = 500; // 限制最大上下文长度
  }
  
  try {
    const lowerMarkdown = markdown.toLowerCase();
    const lowerSearchText = searchText.toLowerCase();
    const index = lowerMarkdown.indexOf(lowerSearchText);
    
    if (index === -1) return '';
    
    const start = Math.max(0, index - contextLength);
    const end = Math.min(markdown.length, index + searchText.length + contextLength);
    let context = markdown.substring(start, end);
    
    if (start > 0) context = '...' + context;
    if (end < markdown.length) context = context + '...';
    
    return context;
  } catch (error) {
    console.error('提取上下文时出错:', error);
    return '';
  }
}
