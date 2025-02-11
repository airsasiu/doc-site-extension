class URLUtils {
  static getProductIDFromURL(url) {
    const match = url.match(/ArticleEdit\/([^?]+)/);
    return match ? match[1] : null;
  }

  static async getCurrentTabUrl() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0].url;
  }

  static async navigateCurrentTab(url) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      await chrome.tabs.update(tabs[0].id, { url: url });
    }
  }
}

export default URLUtils;
