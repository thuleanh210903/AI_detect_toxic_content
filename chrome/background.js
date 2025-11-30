let selectedData = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// Nhận từ content script → chuyển cho popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // 1. Lưu dữ liệu chọn (text/image)
  if (msg.action === 'show_button') {
    selectedData = msg;
    chrome.storage.local.set({ selectedData });
  }

  // 2. Mở popup (nếu cần)
  if (msg.action === 'open_popup') {
    chrome.storage.local.set({ selectedData });
    chrome.action.openPopup?.();
  }

  // 3. CHUYỂN TIẾP scan_page_result từ content → popup
  if (msg.action === 'scan_page_result') {
    // Gửi thẳng đến popup nếu popup đang mở
    chrome.runtime.sendMessage(msg); // ← DÒNG QUAN TRỌNG NHẤT!

    // Hoặc lưu vào storage nếu muốn chắc chắn hơn
    chrome.storage.local.set({ lastScanResult: msg.data });
  }
});
