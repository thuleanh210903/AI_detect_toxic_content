let selectedData = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// listen message from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === 'show_button') {
    selectedData = message;
    chrome.storage.local.set({ selectedData });
  } else if (message?.action === 'open_popup') {
    chrome.storage.local.set({ selectedData });
    chrome.action
      .openPopup()
      .catch((err) => console.warn('openPopup failed', err));
  }
});
