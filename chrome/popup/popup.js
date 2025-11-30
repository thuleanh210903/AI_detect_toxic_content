document.addEventListener('DOMContentLoaded', () => {
  const textInput = document.getElementById('textInput');
  const resultEl = document.getElementById('result');
  const analyzeBtn = document.getElementById('analyzeBtn');

  const setLoading = (msg) => {
    resultEl.innerHTML = `<p style="color:#d32f2f;font-weight:bold;">${msg} ⏳</p>`;
  };

  // GỌI SCAN TRANG NGAY KHI MỞ POPUP
  const scanCurrentPage = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'scan_page' });
      }
    });
  };
  scanCurrentPage();
  setTimeout(scanCurrentPage, 600); // gọi lại phòng trường hợp content script chậm

  // NHẬN KẾT QUẢ TỪ CONTENT SCRIPT QUA BACKGROUND
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action !== 'scan_page_result') return;

    const { text, images } = msg.data;
    if (text) textInput.value = text;

    // 1. GỬI TEXT LÊN API (lưu vào DB)
    if (text) sendTextAnalysis(text);

    // 2. GỬI TỪNG ẢNH LÊN API
    if (images?.length > 0) {
      setLoading(`Đang phân tích ${images.length} ảnh...`);
      analyzeAllImages(images);
    } else {
      resultEl.innerHTML += '<p>Không tìm thấy ảnh nào.</p>';
    }
  });

  // GỬI TEXT LÊN SERVER
  async function sendTextAnalysis(text) {
    try {
      const res = await fetch(
        'http://127.0.0.1:8000/api/v1/detect/analyze-text',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input_type: 'text', input_value: text }),
        }
      );
      const data = await res.json();
      const isToxic = data.data?.toxicity > 0.6;

      resultEl.innerHTML =
        `
        <div class="result-item ${isToxic ? 'toxic' : 'safe'}">
          <strong>[VĂN BẢN] ${
            isToxic ? 'CÓ NỘI DUNG ĐỘC HẠI!' : 'VĂN BẢN AN TOÀN'
          }</strong><br>
          Độ độc hại: ${(data.data?.toxicity * 100 || 0).toFixed(1)}%
        </div>
      ` + resultEl.innerHTML;
    } catch (err) {
      console.error('Lỗi gửi text:', err);
    }
  }

  // PHÂN TÍCH TẤT CẢ ẢNH
  async function analyzeAllImages(urls) {
    const promises = urls.map(async (url) => {
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) throw new Error('Không tải được');

        const blob = await res.blob();
        const filename = url.split('/').pop().split('?')[0] || 'image.jpg';
        const file = new File([blob], filename, { type: blob.type });

        const form = new FormData();
        form.append('file', file);

        const apiRes = await fetch(
          'http://127.0.0.1:8000/api/v1/detect/analyze-image',
          {
            method: 'POST',
            body: form,
          }
        );
        const result = await apiRes.json();

        const isUnsafe =
          result.data?.label === 'unsafe' || result.data?.nudity > 0.5;

        return { url, success: true, isUnsafe, result: result.data };
      } catch (err) {
        return { url, success: false, error: err.message };
      }
    });

    const results = await Promise.all(promises);

    // HIỂN THỊ KẾT QUẢ ĐẸP
    const imagesHTML = results
      .map(
        (r) => `
      <div class="image-item">
        <img src="${r.url}" loading="lazy" alt="image">
        <div class="result-item ${r.success && r.isUnsafe ? 'toxic' : 'safe'}">
          <strong>${
            r.success ? (r.isUnsafe ? 'ẢNH ĐỘC HẠI' : 'ẢNH AN TOÀN') : 'LỖI TẢI'
          }</strong>
        </div>
      </div>
    `
      )
      .join('');

    resultEl.innerHTML += `<h3>Đã phân tích ${results.length} ảnh</h3>${imagesHTML}`;
  }

  // NÚT ANALYZE THỦ CÔNG (giữ nguyên)
  analyzeBtn.onclick = async () => {
    const text = textInput.value.trim();
    const file = document.getElementById('imageInput').files[0];
    if (!text && !file) return alert('Chọn text hoặc ảnh!');

    setLoading('Đang phân tích thủ công...');
    if (file) {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(
        'http://127.0.0.1:8000/api/v1/detect/analyze-image',
        { method: 'POST', body: form }
      );
      const data = await res.json();
      resultEl.innerHTML = JSON.stringify(data, null, 2);
    } else if (text) {
      await sendTextAnalysis(text);
    }
  };
});
