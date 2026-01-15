class ProgressBar {
  constructor(container) {
    this.container = document.querySelector(container);
    this.startTime = null;
    this.lastUpdateTime = null;
    this.lastProcessedCount = 0;
    this.speed = 0; // 每秒处理的文档数
    
    // 初始化容器
    this.initContainer();
  }

  initContainer() {
    if (!this.container) return;
    
    // 清空容器
    this.container.innerHTML = '';
    
    // 创建进度文本
    this.progressText = document.createElement('div');
    this.progressText.className = 'progress-text';
    this.container.appendChild(this.progressText);
    
    // 创建进度条容器
    const barContainer = document.createElement('div');
    barContainer.className = 'progress-bar-container';
    
    // 创建进度条
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'progress-bar';
    barContainer.appendChild(this.progressBar);
    this.container.appendChild(barContainer);
    
    // 创建状态详情
    this.statusDetails = document.createElement('div');
    this.statusDetails.className = 'progress-details';
    this.container.appendChild(this.statusDetails);
  }

  reInit(container) {
    this.container = document.querySelector(container);
    this.initContainer();
  }

  start(total) {
    if (!this.container) return;
    
    this.startTime = Date.now();
    this.lastUpdateTime = Date.now();
    this.lastProcessedCount = 0;
    this.total = total;
    this.updateProgress(0, total);
    this.container.style.display = 'block';
  }

  updateProgress(current, total) {
    if (!this.container) return;
    
    this.total = total;
    const now = Date.now();
    
    // 计算处理速度
    if (current > 0) {
      const elapsedTime = (now - this.startTime) / 1000; // 秒
      if (elapsedTime > 0) {
        this.speed = current / elapsedTime;
      }
    }
    
    // 更新进度文本
    const percentage = Math.round((current / total) * 100);
    this.progressText.textContent = `处理进度：${current}/${total} (${percentage}%)`;
    
    // 更新进度条
    this.progressBar.style.width = `${percentage}%`;
    
    // 更新状态详情
    let detailsText = '';
    if (current > 0) {
      // 计算已用时间
      const elapsedTime = Math.floor((now - this.startTime) / 1000);
      
      // 估计剩余时间
      const remainingTime = current > 0 ? Math.floor((elapsedTime / current) * (total - current)) : 0;
      
      // 处理速度
      const speedText = this.speed.toFixed(1);
      
      detailsText = `速度：${speedText} 个/秒 | 已用：${this.formatTime(elapsedTime)} | 剩余：${this.formatTime(remainingTime)}`;
    }
    
    this.statusDetails.textContent = detailsText;
    
    // 保存当前状态
    this.lastUpdateTime = now;
    this.lastProcessedCount = current;
    
    // 完成后隐藏
    if (current === total) {
      setTimeout(() => {
        this.container.style.display = 'none';
      }, 2000);
    }
  }

  reset() {
    if (!this.container) return;
    this.initContainer();
    this.startTime = null;
    this.lastUpdateTime = null;
    this.lastProcessedCount = 0;
    this.speed = 0;
    this.container.style.display = 'none';
  }
  
  // 格式化时间为 MM:SS
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

export default ProgressBar;
