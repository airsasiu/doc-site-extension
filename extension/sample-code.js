// popup.js - 流式方案
const SERVER_URL = 'http://127.0.0.1:3000';

async function generateDocumentStreaming(downloadUrl) {
  const statusDiv = document.getElementById('status');
  const progressDiv = document.getElementById('progress');
  const resultDiv = document.getElementById('result');
  
  statusDiv.textContent = '正在生成文档...';
  progressDiv.textContent = '';
  resultDiv.textContent = '';
  
  try {
    const response = await fetch(`${SERVER_URL}/api/generate/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ downloadUrl })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let markdown = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.substring(6));
          
          if (data.type === 'chunk') {
            // 实时更新进度
            markdown += data.content;
            progressDiv.textContent = `已生成 ${markdown.length} 字符...`;
          } else if (data.type === 'complete') {
            // 生成完成
            markdown = data.result.content;
            statusDiv.textContent = '✓ 文档生成成功！';
            resultDiv.textContent = markdown;
            
            // 写回到你的文档编辑器
            // writeToEditor(markdown);
            
            // 或者复制到剪贴板
            navigator.clipboard.writeText(markdown);
            
            return markdown;
          } else if (data.type === 'error') {
            throw new Error(data.error);
          }
        }
      }
    }
  } catch (error) {
    statusDiv.textContent = '✗ 生成失败';
    resultDiv.textContent = error.message;
    throw error;
  }
}

// 使用示例
document.getElementById('generateBtn').addEventListener('click', async () => {
  const url = document.getElementById('urlInput').value;
  const markdown = await generateDocumentStreaming(url);
  console.log('生成的文档:', markdown);
});
