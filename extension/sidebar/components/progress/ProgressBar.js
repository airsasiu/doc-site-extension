class ProgressBar {
  constructor(container) {
    this.container = document.querySelector(container);
  }

  updateProgress(current, total) {
    if (!this.container) return;
    
    let progressText = this.container.querySelector('.progress-text');
    let progressBar = this.container.querySelector('.progress-bar');
    
    if (!progressText) {
      progressText = document.createElement('div');
      progressText.className = 'progress-text';
      this.container.appendChild(progressText);
    }
    
    if (!progressBar) {
      const barContainer = document.createElement('div');
      barContainer.className = 'progress-bar-container';
      progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      barContainer.appendChild(progressBar);
      this.container.appendChild(barContainer);
    }
    
    const percentage = Math.round((current / total) * 100);
    progressText.textContent = `检查进度：${current}/${total}`;
    progressBar.style.width = `${percentage}%`;
  }
}

export default ProgressBar;
