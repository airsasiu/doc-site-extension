/**
 * 在 Markdown 文本中搜索指定文本
 * @param {string} markdown - Markdown 文本
 * @param {string} searchText - 要搜索的文本
 * @param {boolean} [isMultiline=false] - 是否多行匹配
 * @returns {boolean} - 是否找到匹配项
 */
export function searchInMarkdown(markdown, searchText, isMultiline = false) {
  // 添加严格的输入验证
  if (typeof markdown !== 'string' || typeof searchText !== 'string') {
    console.error('无效的输入类型:', { markdown, searchText });
    return false;
  }
  
  if (!markdown.trim() || !searchText.trim()) return false;
  
  try {
    const lowerMarkdown = markdown.toLowerCase();
    
    if (isMultiline) {
      // 多行匹配：分割为多个关键词，只要匹配其中一个就返回true
      const keywords = searchText.split('\n').map(keyword => keyword.trim()).filter(Boolean);
      return keywords.some(keyword => lowerMarkdown.includes(keyword.toLowerCase()));
    } else {
      // 单行匹配：整个搜索文本作为一个关键词
      return lowerMarkdown.includes(searchText.toLowerCase());
    }
  } catch (error) {
    console.error('搜索 Markdown 时出错:', error);
    return false;
  }
}

export function countSearchMatches(markdown, searchText, isMultiline = false) {
  if (typeof markdown !== 'string' || typeof searchText !== 'string') {
    return 0;
  }

  if (!markdown.trim() || !searchText.trim()) return 0;

  const keywords = isMultiline
    ? searchText.split('\n').map(keyword => keyword.trim()).filter(Boolean)
    : [searchText.trim()];

  const lowerMarkdown = markdown.toLowerCase();

  return keywords.reduce((total, keyword) => {
    const lowerKeyword = keyword.toLowerCase();
    if (!lowerKeyword) return total;

    let count = 0;
    let index = lowerMarkdown.indexOf(lowerKeyword);
    while (index !== -1) {
      count++;
      index = lowerMarkdown.indexOf(lowerKeyword, index + lowerKeyword.length);
    }
    return total + count;
  }, 0);
}

/**
 * 从 Markdown 文本中提取包含搜索词的上下文
 * @param {string} markdown - Markdown 文本
 * @param {string} searchText - 要搜索的文本
 * @param {number} [contextLength=100] - 上下文长度
 * @param {boolean} [isMultiline=false] - 是否多行匹配
 * @returns {string} - 包含搜索词的上下文
 */
export function extractContext(markdown, searchText, contextLength = 100, isMultiline = false) {
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
    let searchKeyword = searchText;
    
    if (isMultiline) {
      // 多行匹配：找到第一个匹配的关键词
      const keywords = searchText.split('\n').map(keyword => keyword.trim()).filter(Boolean);
      const matchedKeyword = keywords.find(keyword => lowerMarkdown.includes(keyword.toLowerCase()));
      if (!matchedKeyword) return '';
      searchKeyword = matchedKeyword;
    }
    
    const lowerSearchKeyword = searchKeyword.toLowerCase();
    const index = lowerMarkdown.indexOf(lowerSearchKeyword);
    
    if (index === -1) return '';
    
    const start = Math.max(0, index - contextLength);
    const end = Math.min(markdown.length, index + searchKeyword.length + contextLength);
    let context = markdown.substring(start, end);
    
    if (start > 0) context = '...' + context;
    if (end < markdown.length) context = context + '...';
    
    return context;
  } catch (error) {
    console.error('提取上下文时出错:', error);
    return '';
  }
}
