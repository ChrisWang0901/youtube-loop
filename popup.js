document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const startHoursInput = document.getElementById('startHours');
    const startMinutesInput = document.getElementById('startMinutes');
    const startSecondsInput = document.getElementById('startSeconds');
    const endHoursInput = document.getElementById('endHours');
    const endMinutesInput = document.getElementById('endMinutes');
    const endSecondsInput = document.getElementById('endSeconds');
    const setStartTimeButton = document.getElementById('setStartTime');
    const setEndTimeButton = document.getElementById('setEndTime');
    const applyButton = document.getElementById('applyLoop');
    const disableButton = document.getElementById('disableLoop');
    const statusDiv = document.getElementById('status');
  
    // Function to convert hours, minutes, seconds to total seconds
    function convertToSeconds(hours, minutes, seconds) {
      return (hours * 3600) + (minutes * 60) + seconds;
    }

    // Function to convert total seconds to hours, minutes, seconds
    function secondsToHMS(totalSeconds) {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      return { hours, minutes, seconds };
    }

    // Function to set time inputs based on total seconds
    function setTimeInputs(hoursInput, minutesInput, secondsInput, totalSeconds) {
      const { hours, minutes, seconds } = secondsToHMS(totalSeconds);
      hoursInput.value = hours;
      minutesInput.value = minutes;
      secondsInput.value = seconds;
    }

    // Function to check if on YouTube video page
    async function isYouTubeVideoPage() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab && tab.url && tab.url.includes('youtube.com/watch');
      } catch (error) {
        console.error('Error checking YouTube page:', error);
        return false;
      }
    }

    // Function to get current video time with improved error handling
    async function getCurrentVideoTime() {
      // Set status to indicate request is in progress
      statusDiv.textContent = 'Getting current time...';
      
      try {
        // Verify we're on a YouTube video page
        if (!await isYouTubeVideoPage()) {
          statusDiv.textContent = 'Error: Not a YouTube video page.';
          return null;
        }
        
        // Get current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
          statusDiv.textContent = 'Error: Cannot access tab information.';
          return null;
        }

        // Try to inject the content script - use try/catch since this might fail if already injected
//        try {
//          await chrome.scripting.executeScript({
//            target: { tabId: tab.id },
//            files: ['contentScript.js']
//          });
//        } catch (error) {
//          console.log('Content script may already be loaded:', error);
//          // Continue anyway as the script might already be there
//        }

        // Request current time from content script with a timeout
        return new Promise((resolve) => {
          // Set a timeout to handle no response scenarios
          const timeoutId = setTimeout(() => {
            statusDiv.textContent = 'Error: Timed out waiting for response. Try again.';
            resolve(null);
          }, 3000);

          chrome.tabs.sendMessage(tab.id, {
            command: 'getCurrentTime'
          }, (response) => {
            clearTimeout(timeoutId);
            
            // Handle chrome runtime errors
            if (chrome.runtime.lastError) {
              console.error('Chrome runtime error:', chrome.runtime.lastError);
              statusDiv.textContent = 'Error: ' + (chrome.runtime.lastError.message || 'Unknown error');
              resolve(null);
              return;
            }

            // Handle response
            if (response && response.status === 'success') {
              resolve(response.currentTime);
            } else {
              statusDiv.textContent = response?.message || 'Error: Unable to get video time';
              resolve(null);
            }
          });
        });
      } catch (error) {
        console.error('Error in getCurrentVideoTime:', error);
        statusDiv.textContent = 'Error: ' + error.message;
        return null;
      }
    }

    // Set Start Time button handler with error handling
    setStartTimeButton.addEventListener('click', async () => {
      // Disable button during operation to prevent multiple clicks
      setStartTimeButton.disabled = true;
      
      try {
        const currentTime = await getCurrentVideoTime();
        if (currentTime !== null) {
          setTimeInputs(startHoursInput, startMinutesInput, startSecondsInput, currentTime);
          const { hours, minutes, seconds } = secondsToHMS(currentTime);
          statusDiv.textContent = `Start time set to ${hours}h ${minutes}m ${seconds}s`;
        }
      } catch (error) {
        console.error('Error setting start time:', error);
        statusDiv.textContent = 'Error: ' + error.message;
      } finally {
        // Re-enable button regardless of outcome
        setStartTimeButton.disabled = false;
      }
    });

    // Set End Time button handler with error handling
    setEndTimeButton.addEventListener('click', async () => {
      // Disable button during operation to prevent multiple clicks
      setEndTimeButton.disabled = true;
      
      try {
        const currentTime = await getCurrentVideoTime();
        if (currentTime !== null) {
          setTimeInputs(endHoursInput, endMinutesInput, endSecondsInput, currentTime);
          const { hours, minutes, seconds } = secondsToHMS(currentTime);
          statusDiv.textContent = `End time set to ${hours}h ${minutes}m ${seconds}s`;
        }
      } catch (error) {
        console.error('Error setting end time:', error);
        statusDiv.textContent = 'Error: ' + error.message;
      } finally {
        // Re-enable button regardless of outcome
        setEndTimeButton.disabled = false;
      }
    });

    // Apply Loop button click handler
    applyButton.addEventListener('click', async () => {
      // Disable button during operation
      applyButton.disabled = true;
      statusDiv.textContent = 'Applying loop...';
      
      try {
        const startHours = Number(startHoursInput.value) || 0;
        const startMinutes = Number(startMinutesInput.value) || 0;
        const startSeconds = Number(startSecondsInput.value) || 0;
        const endHours = Number(endHoursInput.value) || 0;
        const endMinutes = Number(endMinutesInput.value) || 0;
        const endSeconds = Number(endSecondsInput.value) || 0;
        
        // Convert to total seconds
        const start = convertToSeconds(startHours, startMinutes, startSeconds);
        const end = convertToSeconds(endHours, endMinutes, endSeconds);
    
        // Validate inputs
        if (end <= start) {
          statusDiv.textContent = 'Error: End time must be greater than start time.';
          return;
        }
    
        // Verify we're on a YouTube video page
        if (!await isYouTubeVideoPage()) {
          statusDiv.textContent = 'Error: Not a YouTube video page.';
          return;
        }
        
        // Get current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
          statusDiv.textContent = 'Error: Cannot access tab information.';
          return;
        }
    
        // Try to inject the content script
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['contentScript.js']
          });
        } catch (error) {
          console.log('Content script may already be loaded:', error);
          // Continue anyway
        }
    
        // Set a timeout for the message response
        const messagePromise = new Promise((resolve) => {
          const timeoutId = setTimeout(() => {
            resolve({ status: 'error', message: 'Timed out waiting for response. Try again.' });
          }, 3000);

          // Send message to content script
          chrome.tabs.sendMessage(tab.id, {
            command: 'setLoop',
            startTime: start,
            endTime: end
          }, (response) => {
            clearTimeout(timeoutId);
            
            if (chrome.runtime.lastError) {
              console.error('Chrome runtime error:', chrome.runtime.lastError);
              resolve({ status: 'error', message: chrome.runtime.lastError.message || 'Unknown error' });
              return;
            }
            
            resolve(response || { status: 'error', message: 'No response received' });
          });
        });
        
        const response = await messagePromise;
        
        if (response.status === 'success' || response.status === 'Loop times set') {
          // Format the times for display
          const formatTime = (totalSeconds) => {
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            return `${hours}h ${minutes}m ${seconds}s`;
          };
          
          statusDiv.textContent = `Loop set from ${formatTime(start)} to ${formatTime(end)}!`;
        } else {
          statusDiv.textContent = 'Error: ' + (response.message || 'Failed to set loop');
        }
      } catch (error) {
        console.error('Error applying loop:', error);
        statusDiv.textContent = 'Error: ' + error.message;
      } finally {
        // Re-enable button regardless of outcome
        applyButton.disabled = false;
      }
    });
  
    // Disable Loop button click handler
    disableButton.addEventListener('click', async () => {
      // Disable button during operation
      disableButton.disabled = true;
      statusDiv.textContent = 'Disabling loop...';
      
      try {
        // Verify we're on a YouTube video page
        if (!await isYouTubeVideoPage()) {
          statusDiv.textContent = 'Error: Not a YouTube video page.';
          return;
        }
        
        // Get current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
          statusDiv.textContent = 'Error: Cannot access tab information.';
          return;
        }
    
        // Try to inject the content script
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['contentScript.js']
          });
        } catch (error) {
          console.log('Content script may already be loaded:', error);
          // Continue anyway
        }
    
        // Set a timeout for the message response
        const messagePromise = new Promise((resolve) => {
          const timeoutId = setTimeout(() => {
            resolve({ status: 'error', message: 'Timed out waiting for response. Try again.' });
          }, 3000);

          // Send message to content script
          chrome.tabs.sendMessage(tab.id, {
            command: 'disableLoop'
          }, (response) => {
            clearTimeout(timeoutId);
            
            if (chrome.runtime.lastError) {
              console.error('Chrome runtime error:', chrome.runtime.lastError);
              resolve({ status: 'error', message: chrome.runtime.lastError.message || 'Unknown error' });
              return;
            }
            
            resolve(response || { status: 'error', message: 'No response received' });
          });
        });
        
        const response = await messagePromise;
        
        if (response.status === 'success' || response.status === 'Loop disabled') {
          statusDiv.textContent = 'Loop disabled.';
        } else {
          statusDiv.textContent = 'Error: ' + (response.message || 'Failed to disable loop');
        }
      } catch (error) {
        console.error('Error disabling loop:', error);
        statusDiv.textContent = 'Error: ' + error.message;
      } finally {
        // Re-enable button regardless of outcome
        disableButton.disabled = false;
      }
    });
  });
  