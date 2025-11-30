document.addEventListener('DOMContentLoaded', () => {
  const textInput = document.getElementById('textInput');
  const resultEl = document.getElementById('result');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const imageInput = document.getElementById('imageInput');

  // ========================================
  // 1. Hiển thị loading
  // ========================================
  const setLoading = (msg = 'Đang xử lý') => {
    resultEl.textContent = msg + ' ⏳';
  };

  // ========================================
  // 2. NHẬN KẾT QUẢ SCAN TỪ BACKGROUND (MV3 bắt buộc)
  // ========================================
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'scan_page_result') {
      console.log(
        '%c[POPUP] Nhận được kết quả scan!',
        'color: cyan; font-weight: bold'
      );

      const { text, images } = message.data;

      // Đưa text vào ô input
      if (text) textInput.value = text;

      // Xử lý ảnh
      if (images && images.length > 0) {
        setLoading(`Đang phân tích ${images.length} ảnh`);
        batchAnalyzeImages(images);
      } else {
        resultEl.textContent = 'Không tìm thấy ảnh nào để phân tích.';
      }
    }
  });

  // ========================================
  // 3. KHI MỞ POPUP → BẮT BUỘC GỌI SCAN TRANG HIỆN TẠI
  // ========================================
  const requestPageScan = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'scan_page' });
      }
    });
  };

  // Gọi ngay khi popup mở (đảm bảo không bỏ sót)
  requestPageScan();

  // Nếu lần đầu mở popup mà chưa có kết quả → gọi lại sau 500ms (phòng trường hợp content script chưa sẵn sàng)
  setTimeout(requestPageScan, 500);

  // ========================================
  // 4. NÚT ANALYZE THỦ CÔNG (text hoặc file)
  // ========================================
  analyzeBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    const file = imageInput.files[0];

    if (!text && !file) {
      resultEl.textContent = 'Hãy nhập text hoặc chọn ảnh!';
      return;
    }

    setLoading('Đang phân tích');

    try {
      if (file) {
        const res = await analyzeFile(file);
        resultEl.textContent = JSON.stringify(res, null, 2);
      } else if (text) {
        const res = await analyzeText(text);
        resultEl.textContent = JSON.stringify(res, null, 2);
      }
    } catch (err) {
      resultEl.textContent = 'Lỗi API: ' + err.message;
      console.error(err);
    }
  });

  // ========================================
  // 5. CÁC HÀM GỌI API
  // ========================================
  async function analyzeText(text) {
    const res = await fetch(
      'http://127.0.0.1:8000/api/v1/detect/analyze-text',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_type: 'text', input_value: text }),
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async function analyzeFile(file) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(
      'http://127.0.0.1:8000/api/v1/detect/analyze-image',
      {
        method: 'POST',
        body: form,
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async function urlToFile(url) {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('Fetch image failed');
    const blob = await res.blob();
    return new File([blob], 'image.jpg', { type: blob.type });
  }

  // ========================================
  // 6. PHÂN TÍCH HÀNG LOẠT ẢNH
  // ========================================
  async function batchAnalyzeImages(urls) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<p><strong>Đang phân tích ${urls.length} ảnh...</strong></p>`;

    const promises = urls.map(async (url) => {
      try {
        const file = await urlToFile(url);
        const result = await analyzeFile(file);
        return { url, result, success: true };
      } catch (err) {
        return { url, error: err.message, success: false };
      }
    });

    const results = await Promise.all(promises);

    // HIỂN THỊ ĐẸP
    resultDiv.innerHTML = `
    <p><strong>Hoàn tất phân tích ${results.length} ảnh</strong></p>
    ${results
      .map(
        (item) => `
      <div class="image-item">
        <img src="${item.url}" alt="Scanned image">
        <div class="result-item ${
          item.success && item.result?.is_toxic ? 'toxic' : 'safe'
        }">
          <strong>${
            item.success
              ? item.result?.is_toxic
                ? 'CẢNH BÁO: Có nội dung độc hại!'
                : 'AN TOÀN'
              : 'Lỗi tải ảnh'
          }</strong><br>
          ${
            item.success
              ? JSON.stringify(item.result, null, 2)
                  .replace(/\n/g, '<br>')
                  .replace(/ /g, '&nbsp;')
              : item.error
          }
        </div>
      </div>
    `
      )
      .join('')}
  `;
  }
});
