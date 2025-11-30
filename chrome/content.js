console.log(
  '%c[Scanner] Content script injected, waiting for scan request...',
  'color: green'
);
// --- SELECT TEXT ---
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

// --- CLICK IMAGE ---
document.addEventListener('click', (e) => {
  const el = e.target;
  if (el && el.tagName === 'IMG') {
    const realSrc =
      el.getAttribute('data-original') || el.getAttribute('data-src') || el.src;

    chrome.runtime.sendMessage({
      action: 'show_button',
      type: 'image',
      data: realSrc,
    });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== 'scan_page') return;

  console.log(
    '%c[Scanner] Bắt đầu scan trang:',
    location.href,
    'color: orange'
  );

  const text = (document.body.innerText || '').slice(0, 80000);
  const imageUrls = new Set();

  const getBestUrl = (img) => {
    const candidates = [
      img.getAttribute('data-src'),
      img.getAttribute('data-original'),
      img.getAttribute('data-lazy-src'),
      img.src,
      img.currentSrc,
    ];
    for (const u of candidates) {
      if (u && (u.startsWith('http') || u.startsWith('//'))) {
        return u.startsWith('//') ? 'https:' + u : u;
      }
    }
    return null;
  };

  // Quét ảnh
  document.querySelectorAll('img').forEach((img) => {
    const url = getBestUrl(img);
    if (!url) return;

    // Loại thumb của Kenh14
    if (url.includes('/thumb_w/') || url.includes('/thumb_')) return;

    // Nếu có data-src → chắc chắn là ảnh thật
    if (img.hasAttribute('data-src') || img.hasAttribute('data-original')) {
      imageUrls.add(url);
    } else if ((img.naturalWidth || img.width) >= 300) {
      imageUrls.add(url);
    }
  });

  // picture source
  document.querySelectorAll('picture source[srcset]').forEach((s) => {
    const u = s.getAttribute('srcset')?.split(',')[0].trim().split(' ')[0];
    if (u?.startsWith('http'))
      imageUrls.add(u.startsWith('//') ? 'https:' + u : u);
  });

  const images = Array.from(imageUrls).slice(0, 50);

  console.log(
    '%c[Scanner] HOÀN TẤT – Tìm thấy ' + images.length + ' ảnh',
    'color: lime; font-weight: bold'
  );

  chrome.runtime.sendMessage({
    action: 'scan_page_result',
    data: { text, images },
  });

  sendResponse({ status: 'done' });
  return true;
});
