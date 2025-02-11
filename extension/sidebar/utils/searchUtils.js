export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function highlightSearchText(text, searchText) {
  if (!searchText) return text;
  const regex = new RegExp(searchText, 'gi');
  return text.replace(regex, match => `<mark>${match}</mark>`);
} 