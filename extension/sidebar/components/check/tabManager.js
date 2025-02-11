export class TabManager {
  constructor() {
    this.tabContainer = document.querySelector('.tab-container');
    this.tabHeader = this.tabContainer.querySelector('.tab-header');
    this.tabContent = this.tabContainer.querySelector('.tab-content');
  }

  createTab(id, title) {
    // 创建标签按钮
    const tabButton = document.createElement('button');
    tabButton.className = 'tab-button';
    tabButton.textContent = title;
    tabButton.dataset.tabId = id;
    this.tabHeader.appendChild(tabButton);

    // 创建标签面板
    const tabPanel = document.createElement('div');
    tabPanel.className = 'tab-panel';
    tabPanel.id = id;
    this.tabContent.appendChild(tabPanel);

    return tabPanel;
  }

  switchTab(tabId) {
    // 切换标签激活状态
    const buttons = this.tabHeader.querySelectorAll('.tab-button');
    buttons.forEach(button => {
      button.classList.toggle('active', button.dataset.tabId === tabId);
    });

    // 切换面板显示
    const panels = this.tabContent.querySelectorAll('.tab-panel');
    panels.forEach(panel => {
      panel.classList.toggle('active', panel.id === tabId);
    });
  }

  clearTabs() {
    this.tabHeader.innerHTML = '';
    this.tabContent.innerHTML = '';
  }
}
