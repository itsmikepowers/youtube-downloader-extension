// background.js
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.includes("youtube.com/watch?v=")) {
    chrome.runtime.sendMessage({type: 'urlChanged'});
  }
});
