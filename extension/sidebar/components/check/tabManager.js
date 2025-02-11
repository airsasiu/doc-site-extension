export class TabManager {
  constructor() {
    this.tabContainer = document.querySelector('.tab-container');
    this.tabHeader = this.tabContainer.querySelector('.tab-header');
    this.tabContent = this.tabContainer.querySelector('.tab-content');
  }

  getTab(id) {
    return this.tabContent.querySelector(`#${id}`);
  }

  createTab(id, title, count = 0) {
    // 先检查是否已存在
    let tabPanel = this.getTab(id);
    if (tabPanel) {
      // 更新已存在标签的计数
      const tabButton = this.tabHeader.querySelector(`[data-tabid="${id}"]`);
      if (tabButton) {
        const countSpan = tabButton.querySelector('.count');
        if (countSpan) {
          countSpan.textContent = count;
        }
      }
      return tabPanel;
    }

    // 创建标签按钮
    const tabButton = document.createElement('button');
    tabButton.className = 'tab-button';
    tabButton.dataset.tabId = id;
    tabButton.innerHTML = `
      <span>${title}</span>
      <span class="count">${count}</span>
      <span class="close">×</span>
    `;
    this.tabHeader.appendChild(tabButton);

    // 创建标签面板
    tabPanel = document.createElement('div');
    tabPanel.className = 'tab-panel';
    tabPanel.id = id;
    this.tabContent.appendChild(tabPanel);

    // 添加关闭按钮事件
    const closeBtn = tabButton.querySelector('.close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      tabPanel.remove();
      tabButton.remove();
    });

    // 添加点击事件
    tabButton.addEventListener('click', () => this.switchTab(id));

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

  // 添加更新计数的方法
  updateCount(id, count) {
    const tabButton = this.tabHeader.querySelector(`[data-tabid="${id}"]`);
    if (tabButton) {
      const countSpan = tabButton.querySelector('.count');
      if (countSpan) {
        countSpan.textContent = count;
      }
    }
  }
}
