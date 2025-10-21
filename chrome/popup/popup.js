// popup/popup.js
document.addEventListener('DOMContentLoaded', async () => {
  const textInput = document.getElementById('textInput');
  const resultEl = document.getElementById('result');

  // Lấy selectedData đã lưu bởi background
  const data = await chrome.storage.local.get('selectedData');
  const selectedData = data.selectedData;
  if (selectedData?.type === 'text') {
    textInput.value = selectedData.data;
  } else if (selectedData?.type === 'image') {
    // show thumbnail hay url (tùy bạn)
    resultEl.innerHTML = `<img src="${selectedData.data}" style="max-width:100%"/>`;
  }

  document.getElementById('analyzeBtn').addEventListener('click', async () => {
    resultEl.textContent = 'Đang phân tích...';
    const file = document.getElementById('imageInput').files[0];
    const text = textInput.value.trim();

    try {
      let res;
      if (file) {
        const form = new FormData();
        form.append('file', file);
        res = await fetch('http://127.0.0.1:8000/api/v1/detect/image', {
          method: 'POST',
          body: form,
        });
      } else if (text) {
        res = await fetch('http://127.0.0.1:8000/api/v1/detect/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
      } else {
        resultEl.textContent = 'Hãy nhập text hoặc chọn ảnh!';
        return;
      }

      if (!res.ok) throw new Error('API error ' + res.status);
      const json = await res.json();
      resultEl.textContent = JSON.stringify(json);
    } catch (err) {
      console.error(err);
      resultEl.textContent = 'Lỗi khi kết nối API: ' + err.message;
    }
  });
});
