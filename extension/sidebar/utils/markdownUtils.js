export function searchInMarkdown(markdown, searchText) {
  if (!markdown || !searchText) return false;
  return markdown.toLowerCase().includes(searchText.toLowerCase());
}

export function extractContext(markdown, searchText, contextLength = 100) {
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
}
