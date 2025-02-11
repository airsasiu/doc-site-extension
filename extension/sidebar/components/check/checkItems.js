export const CHECK_ITEMS = {
  mescius: {
    id: 'mescius',
    name: 'Mescius',
    check: (content) => content.toLowerCase().includes('mescius'),
    message: '包含 "mescius" 字样'
  },

  span: {
    id: 'span',
    name: 'SPAN 标签',
    check: (content) => content.includes('</span>'),
    message: '包含 SPAN 标签'
  },

  dsProducts: {
    id: 'dsProducts',
    name: '包含 DS 产品字样',
    check: (content) => {
      const products = ['DsExcel', 'DsPdf', 'DsWord'];
      return products.some(p => content.includes(p));
    },
    message: (content) => {
      const products = ['DsExcel', 'DsPdf', 'DsWord'];
      const found = products.filter(p => content.includes(p));
      return `包含 DS 产品字样: ${found.join(', ')}`;
    }
  },

  base64: {
    id: 'base64',
    name: 'Base64',
    check: (content) => content.includes(';base64'),
    message: '可能包含 base64 编码内容，请仔细检查，也可能是代码中包含'
  },

  escapedAsterisks: {
    id: 'escapedAsterisks',
    name: '转义双星号',
    check: (content) => content.includes('\\*\\*'),
    message: '包含转义双星号 "\\*\\*"'
  }
};
