// Video looping variables
let startTime = 0;
let endTime = 0;
let loopEnabled = false;
let checkingInterval = null;


// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle the setLoop command
  if (request.command === 'setLoop') {
    try {
      startTime = request.startTime;
      endTime = request.endTime;
      loopEnabled = true;
      activateLoop();
      console.log(`YouTube Video Loop: Loop set from ${startTime}s to ${endTime}s`);
      sendResponse({ status: 'success', message: 'Loop times set' });
    } catch (error) {
      console.error('Error setting loop:', error);
      sendResponse({ status: 'error', message: error.message });
    }
    return true;
  }
  
  // Handle the disableLoop command
  if (request.command === 'disableLoop') {
    try {
      disableLoop();
      console.log('YouTube Video Loop: Loop disabled');
      sendResponse({ status: 'success', message: 'Loop disabled' });
    } catch (error) {
      console.error('Error disabling loop:', error);
      sendResponse({ status: 'error', message: error.message });
    }
    return true;
  }

  // Handle get current time command
  if (request.command === 'getCurrentTime') {
    try {
      const video = document.querySelector('video');
      if (!video) {
        console.error('YouTube Video Loop: No video element found');
        sendResponse({ status: 'error', message: 'No video element found' });
      } else {
        const currentTime = video.currentTime;
        console.log(`YouTube Video Loop: Current time requested: ${currentTime}s`);
        sendResponse({ status: 'success', currentTime: currentTime });
      }
    } catch (error) {
      console.error('Error getting current time:', error);
      sendResponse({ status: 'error', message: error.message });
    }
    return true;
  }

  // Always send a response for unhandled commands
  sendResponse({ status: 'error', message: 'Unknown command' });
  return true;
});

// Function to activate the loop
function activateLoop() {
  // Clear any existing intervals
  if (checkingInterval) {
    clearInterval(checkingInterval);
  }

  // Start a new interval that checks the video's currentTime
  checkingInterval = setInterval(() => {
    const video = document.querySelector('video');
    if (!video || !loopEnabled) return;
    
    // If video time is before start time and video is playing, set to start time
    if (video.currentTime < startTime && !video.paused) {
      video.currentTime = startTime;
    }
    
    // If video time is beyond end time, set to start time
    if (video.currentTime >= endTime) {
      video.currentTime = startTime;
    }
  }, 250); // Check 4 times per second for more precision
}

// Function to disable the loop
function disableLoop() {
  loopEnabled = false;
  
  // Clear the checking interval
  if (checkingInterval) {
    clearInterval(checkingInterval);
    checkingInterval = null;
  }
}

// Handle navigation events (since YouTube is a SPA)
let previousUrl = window.location.href;
const urlObserver = setInterval(() => {
  if (window.location.href !== previousUrl) {
    previousUrl = window.location.href;
    
    // If we've navigated to a new video, disable the loop
    if (loopEnabled) {
      disableLoop();
      console.log('YouTube Video Loop: Loop disabled due to navigation');
    }
  }
}, 1000);

// Keep the interval observer running as long as the page is open
window.addEventListener('beforeunload', () => {
  if (checkingInterval) {
    clearInterval(checkingInterval);
  }
  if (urlObserver) {
    clearInterval(urlObserver);
  }
}); 