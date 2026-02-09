// 自动关闭侧边栏的脚本

// 标志位，确保只执行一次
let hasClickedResizeButton = false;

function checkAndClickResizeButton() {
  if (hasClickedResizeButton) {
    console.log('【自动关闭侧边栏】已经执行过操作，跳过检查');
    return;
  }
  
  console.log('【自动关闭侧边栏】检查侧边栏关闭按钮是否存在');
  // 尝试点击右侧的 resize-split-button 来关闭侧边栏
  const resizeButton = document.querySelector(".resize-split-button.right");
  if (resizeButton) {
    console.log('【自动关闭侧边栏】找到侧边栏关闭按钮，执行点击操作');
    resizeButton.click();
    hasClickedResizeButton = true;
    console.log('【自动关闭侧边栏】操作已执行，设置标志位');
    // 清除定时器
    clearInterval(checkInterval);
    console.log('【自动关闭侧边栏】清除定时器');
  } else {
    console.log('【自动关闭侧边栏】未找到侧边栏关闭按钮，将在 1 秒后再次检查');
  }
}

// 设置定时器，每隔 1 秒检查一次
console.log('【自动关闭侧边栏】设置定时器，开始检查');
const checkInterval = setInterval(checkAndClickResizeButton, 1000);

// 立即执行一次检查
checkAndClickResizeButton();

// 监听页面刷新事件，重置标志位
window.addEventListener('beforeunload', () => {
  console.log('【自动关闭侧边栏】页面即将刷新，重置标志位');
  hasClickedResizeButton = false;
});

console.log('【自动关闭侧边栏】脚本加载完成');
