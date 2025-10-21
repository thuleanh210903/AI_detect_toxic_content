(function injectFloating() {
  if (document.getElementById('ai-float-btn')) return;

  const style = document.createElement('style');
  style.textContent = `
    #ai-float-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'ai-float-btn';
  btn.innerText = 'AI 🔍';
  document.body.appendChild(btn);

  btn.addEventListener('click', () => {
    // background open popup
    chrome.runtime.sendMessage({ action: 'open_popup' });
  });
})();

// selection
document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    chrome.runtime.sendMessage({
      action: 'show_button',
      type: 'text',
      data: selectedText,
    });
  }
});

// click image
document.addEventListener('click', (e) => {
  const el = e.target;
  if (el && el.tagName === 'IMG') {
    chrome.runtime.sendMessage({
      action: 'show_button',
      type: 'image',
      data: el.src,
    });
  }
});
