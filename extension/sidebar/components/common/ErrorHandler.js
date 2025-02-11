export class ErrorHandler {
  static showError(container, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
      <div class="error-icon">⚠️</div>
      <div class="error-text">${message}</div>
    `;
    container.appendChild(errorDiv);
  }

  static clearError(container) {
    const errorDiv = container.querySelector('.error-message');
    if (errorDiv) {
      errorDiv.remove();
    }
  }
} 