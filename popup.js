// Declare a variable to store the current video title
let currentVideoTitle = "Untitled";

// Listener to handle messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'urlChanged') {
    fetchAndUpdateContent();  // Fetch and update content when the URL changes
  }
});

// Function to fetch and update popup content
function fetchAndUpdateContent() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    updatePopupContent(currentTab);
  });
}

// Function to update the popup content based on current tab information
function updatePopupContent(currentTab) {
  if (currentTab.url.includes("youtube.com/watch?v=")) {
    const videoId = extractVideoId(currentTab.url);
    document.getElementById("videoID").textContent = `Video ID: ${videoId}`;
    
    // Fetch new video title every time
    getVideoTitle(currentTab, title => {
      document.getElementById("videoTitle").textContent = `Title: ${title}`;
      currentVideoTitle = title.replace(/[\\/:*?"<>|]/g, "");  // Sanitize and store the title
    });
  } else {
    document.getElementById("status").textContent = "User is NOT on YouTube.";
    document.getElementById("downloadBtn").style.display = "none";
  }
}

// Execute when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  fetchAndUpdateContent();  // Fetch and update content when DOM is ready
});

// Button click event for "Download"
document.getElementById("downloadBtn").addEventListener("click", function() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    fetchVideoDetails(currentTab);
  });
});

let jsonResponse = null;

// Function to extract video ID from URL
function extractVideoId(url) {
  const urlObj = new URL(url);
  return urlObj.searchParams.get("v");
}

// Function to get the video title
function getVideoTitle(tab, callback) {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      // Use the specific selector to locate the video title element on the YouTube page
      const titleElement = document.querySelector('#title > h1 > yt-formatted-string');
      return titleElement ? titleElement.innerText : "Title not found";
    }
  }, (results) => {
    if (chrome.runtime.lastError) {
      callback("Error: " + chrome.runtime.lastError.message);
      return;
    }
    callback(results[0].result);
  });
}



async function fetchVideoDetails(currentTab) {
  if (currentTab.url.includes("youtube.com/watch?v=")) {
    const videoId = extractVideoId(currentTab.url);
    const apiUrl = `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${videoId}`;
    const apiKey = 'your api key here';

    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'ytstream-download-youtube-videos.p.rapidapi.com'
      }
    };

    try {
      const response = await fetch(apiUrl, options);
      const result = await response.json();
      jsonResponse = result;

      if (result && result.formats) {
        const formatContainer = document.getElementById("formatLinksContainer");
        formatContainer.innerHTML = ""; // Clear the container

        // Loop through all formats and create clickable links
        result.formats.forEach(format => {
          const formatLink = document.createElement("a");
          formatLink.href = "#";
          formatLink.textContent = format.qualityLabel || "Unknown Quality";
          formatLink.addEventListener("click", function() {
            // Initiate the download
            const extension = format.url.split('.').pop();
            const filename = `${currentVideoTitle}.${extension}`; // Use the stored video title
            if (chrome.downloads && typeof chrome.downloads.download === 'function') {
              chrome.downloads.download({
                url: format.url,
                filename: `downloads/${filename}`
              }, downloadId => {
                if (chrome.runtime.lastError) {
                  console.error(chrome.runtime.lastError.message);
                } else {
                  console.log(`Download initiated with ID: ${downloadId}`);
                }
              });
            } else {
              console.error('Chrome Downloads API is not available');
            }
          });

          const formatDiv = document.createElement("div");
          formatDiv.appendChild(formatLink);
          formatContainer.appendChild(formatDiv);
        });
      } else {
        alert("Couldn't fetch the video URL.");
      }
    } catch (error) {
      alert(`Error fetching video info: ${error}`);
    }
  }
}
