chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getVideoTitle") {
      const titleElement = document.querySelector('meta[name="title"]');
      const title = titleElement ? titleElement.getAttribute("content") : "Title not found";
      sendResponse(title);
    }
  });
  