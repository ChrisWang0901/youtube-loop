// Video looping variables
let endTime = 0;
let startTime = 0;
let loopIntervalId = null;
let previousUrl = '';

// Create a function to check URL changes
function checkForUrlChange() {
  if (window.location.href !== previousUrl) {
    previousUrl = window.location.href;
    // Only try to inject if we're on a video page
    if (window.location.pathname.includes('/watch')) {
      waitForElement("#secondary")
        .then(() => {
          // Remove existing component if it exists
          const existingComponent = document.querySelector("#yt-loop-extension");
          if (existingComponent) {
            existingComponent.remove();
          }
          injectCustomComponent();
          addEventListenersToComponent();
        })
        .catch(console.error);
    }
  }
}

// Set up URL change detection
setInterval(checkForUrlChange, 1000);

// Initialize on first load
checkForUrlChange();

function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) {
      // Resolve with the element we found
      return resolve(el);
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for selector: ${selector}`));
    }, timeout);
  });
}

function injectCustomComponent() {
  const sidePanel = document.querySelector("#secondary");
  if (sidePanel && !document.querySelector("#yt-loop-extension")) {
    // 1. Create a container for your component
    const container = document.createElement("div");
    container.id = "yt-loop-extension";

    // 2. Inject the CSS (external file or inline)
    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.href = chrome.runtime.getURL("style.css"); // for Chrome extension, or use "./style.css"
    document.head.appendChild(styleLink);

    // 3. Add the HTML structure
    container.innerHTML = `    <div class = "loop-container">
    <div id="loopHeader" class="loop-header">
        <img src="${chrome.runtime.getURL(
          "icons/loop-icon.svg"
        )}" alt="Loop Icon" class="loop-icon">
        <div id="status" class="loop-status fade">
        </div>
        <button id="dropdownButton" class="dropdown-button">
          <svg class="dropdown-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" >
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
         </button>
    </div>
    <div id="loopContent" class="loop-content">
        <div class="input-group">
          <label>Start Time:</label>
          <div class="time-inputs">
            <div class="time-field">
              <input type="number" id="startHours" min="0" value="0">
            </div>
            <div class="time-field">
              <input type="number" id="startMinutes" min="0" max="59" value="0">
            </div>
            <div class="time-field">
              <input type="number" id="startSeconds" min="0" max="59" value="0">
            </div>
          </div>
            <button id="setStartTime" class="loop-button loop-button--primary">Set Start Time to Current Time</button>
        </div>
        <div class="input-group">
          <label>End Time:</label>
          <div class="time-inputs">
            <div class="time-field">
              <input type="number" id="endHours" min="0" value="0">
            </div>
            <div class="time-field">
              <input type="number" id="endMinutes" min="0" max="59" value="0">
            </div>
            <div class="time-field">
              <input type="number" id="endSeconds" min="0" max="59" value="0">
            </div>
          </div>
            <button id="setEndTime" class="loop-button loop-button--primary">Set End Time to Current Time</button>
        </div>
      <div class="loop-buttons-container">
          <button id="applyLoop" class="loop-button loop-button--apply">Apply Loop</button>
          <button id="disableLoop" class="loop-button loop-button--disable">Disable Loop</button>
        </div>
    </div>
    `;




    // 4. Append it to the side panel
    sidePanel.prepend(container);
  }
}

function addEventListenersToComponent() {
  const startHoursInput = document.getElementById("startHours");
  const startMinutesInput = document.getElementById("startMinutes");
  const startSecondsInput = document.getElementById("startSeconds");
  const endHoursInput = document.getElementById("endHours");
  const endMinutesInput = document.getElementById("endMinutes");
  const endSecondsInput = document.getElementById("endSeconds");
  const setStartTimeButton = document.getElementById("setStartTime");
  const setEndTimeButton = document.getElementById("setEndTime");
  const applyButton = document.getElementById("applyLoop");
  const disableButton = document.getElementById("disableLoop");
  const statusDiv = document.getElementById("status");
  const loopContent = document.getElementById("loopContent");
  const dropdownButton = document.getElementById("dropdownButton");
  setStartTimeButton.addEventListener("click", () => {
    startTime = getCurrentVideoTime();
    const { hours, minutes, seconds } = secondsToTimeInput(startTime);
    startHoursInput.value = hours;
    startMinutesInput.value = minutes;
    startSecondsInput.value = seconds;
  });
  setEndTimeButton.addEventListener("click", () => {
    endTime = getCurrentVideoTime();
    const { hours, minutes, seconds } = secondsToTimeInput(endTime);
    endHoursInput.value = hours;
    endMinutesInput.value = minutes;
    endSecondsInput.value = seconds;
  });

  applyButton.addEventListener("click", () => {
    setLoop();
    statusDiv.textContent = `Active loop: ${formatTime(
      startTime
    )} → ${formatTime(endTime)}`;
  });

  disableButton.addEventListener("click", () => {
    disableLoop();
    statusDiv.textContent = `Loop disabled`;
    statusDiv.classList.add("fade");
    // Make the status text disappear after 3 seconds
    setTimeout(() => {
      statusDiv.classList.add("fade-out");
    }, 1000);
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.classList.remove("fade-out");
      statusDiv.classList.add("fade");
    }, 2000);


  });
  dropdownButton.addEventListener("click", () => {
    const isHidden = loopContent.classList.contains("hidden");
    
    if (isHidden) {
      // When opening the dropdown
      loopContent.classList.remove("hidden");
      dropdownButton.classList.add("dropdown-icon-open");
      // You can add additional actions for opening here
    } else {
      // When closing the dropdown
      loopContent.classList.add("hidden");
      dropdownButton.classList.remove("dropdown-icon-open");
      // You can add additional actions for closing here
    }
  });
}

function convertToSeconds(hours, minutes, seconds) {
  return hours * 3600 + minutes * 60 + seconds;
}
function secondsToTimeInput(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return { hours, minutes, seconds: remainingSeconds };
}

function getCurrentVideoTime() {
  const video = document.querySelector("video");
  if (!video) {
    console.error("YouTube Video Loop: No video element found");
    return 0;
  }
  return video.currentTime;
}

function setLoop() {
  const video = document.querySelector("video");
  if (!video) {
    console.error("YouTube Video Loop: No video element found");
    return;
  }
  const checkLoop = () => {
    if (video.currentTime >= endTime) {
      video.currentTime = startTime;
      video.play();
    }
  };

  if (video.currentTime < startTime || video.currentTime >= endTime) {
    video.currentTime = startTime;
    video.play();
  }
  loopIntervalId = setInterval(checkLoop, 250);
}
function disableLoop() {
  clearInterval(loopIntervalId);
  loopIntervalId = null;
}
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  let formattedTime = '';
  if (hours > 0) {
    formattedTime += `${hours}h`;
  }
  if (hours > 0 || minutes > 0) {
    formattedTime += `${minutes}m`;
  }
  formattedTime += `${remainingSeconds}s`;
  
  return formattedTime;
}
