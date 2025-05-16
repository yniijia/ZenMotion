document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggle-button');
  const statusText = document.getElementById('status-text');
  const intervalSlider = document.getElementById('interval-slider');
  const intervalValue = document.getElementById('interval-value');
  const forceMovementButton = document.getElementById('force-movement');
  const debugInfo = document.getElementById('debug-info');
  
  // Add a status indicator element if it doesn't exist
  let lastMovementIndicator = document.getElementById('last-movement');
  if (!lastMovementIndicator) {
    lastMovementIndicator = document.createElement('div');
    lastMovementIndicator.id = 'last-movement';
    lastMovementIndicator.style.fontSize = '12px';
    lastMovementIndicator.style.marginTop = '5px';
    lastMovementIndicator.style.color = '#888';
    document.querySelector('.toggle-container').appendChild(lastMovementIndicator);
  }
  
  // Add movement counter element
  let movementCounter = document.getElementById('movement-counter');
  if (!movementCounter) {
    movementCounter = document.createElement('div');
    movementCounter.id = 'movement-counter';
    movementCounter.style.fontSize = '12px';
    movementCounter.style.marginTop = '3px';
    movementCounter.style.color = '#888';
    document.querySelector('.toggle-container').appendChild(movementCounter);
  }
  
  // Initialize UI based on current state
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    if (response) {
      if (response.isActive) {
        toggleButton.classList.add('active');
        statusText.textContent = 'Active';
        statusText.classList.add('active');
        
        // Display last movement time if available
        if (response.lastMovementTime && response.lastMovementTime !== 'Never') {
          lastMovementIndicator.textContent = `Last movement: ${response.lastMovementTime}`;
        }
        
        // Display movement count
        if (response.movementCount !== undefined) {
          movementCounter.textContent = `Movements: ${response.movementCount}`;
        }
        
        // Start checking for movement logs
        checkLastMovement();
      }
      
      // Show warning if there have been consecutive failures
      if (response.consecutiveFailures > 3) {
        logDebugInfo(`Warning: ${response.consecutiveFailures} consecutive movement failures. Try using the Mac Helper script.`);
      }
    }
  });
  
  // Get saved settings
  chrome.storage.sync.get(['movementInterval'], (result) => {
    if (result.movementInterval) {
      const intervalInSeconds = result.movementInterval / 1000;
      intervalSlider.value = intervalInSeconds;
      intervalValue.textContent = `${intervalInSeconds}s`;
    }
  });
  
  // Toggle button click handler with animation
  toggleButton.addEventListener('click', () => {
    toggleButton.classList.add('clicking');
    
    chrome.runtime.sendMessage({ action: 'toggle' }, (response) => {
      if (response && response.status === 'active') {
        toggleButton.classList.add('active');
        statusText.textContent = 'Active';
        statusText.classList.add('active');
        
        // Start checking for movement logs
        checkLastMovement();
        logDebugInfo('Extension activated');
      } else {
        toggleButton.classList.remove('active');
        statusText.textContent = 'Inactive';
        statusText.classList.remove('active');
        lastMovementIndicator.textContent = '';
        movementCounter.textContent = '';
        logDebugInfo('Extension deactivated');
      }
      
      // Remove clicking class after animation completes
      setTimeout(() => {
        toggleButton.classList.remove('clicking');
      }, 300);
    });
  });
  
  // Interval slider change handler
  intervalSlider.addEventListener('input', () => {
    const seconds = intervalSlider.value;
    intervalValue.textContent = `${seconds}s`;
    
    chrome.runtime.sendMessage({ 
      action: 'updateSettings', 
      movementInterval: seconds * 1000 
    });
    
    logDebugInfo(`Interval updated to ${seconds} seconds`);
  });
  
  // Force movement button handler with visual feedback
  forceMovementButton.addEventListener('click', () => {
    forceMovementButton.textContent = 'Triggering...';
    forceMovementButton.disabled = true;
    
    logDebugInfo('Forcing mouse movement...');
    
    chrome.runtime.sendMessage({ action: 'forceMovement' }, (response) => {
      if (response && response.status === 'movement triggered') {
        forceMovementButton.textContent = 'Success!';
        lastMovementIndicator.textContent = 'Last movement: Just now';
        
        // Update movement count
        chrome.runtime.sendMessage({ action: 'getStatus' }, (statusResponse) => {
          if (statusResponse && statusResponse.movementCount !== undefined) {
            movementCounter.textContent = `Movements: ${statusResponse.movementCount}`;
          }
        });
        
        setTimeout(() => {
          forceMovementButton.textContent = 'Force Movement Now';
          forceMovementButton.disabled = false;
        }, 1500);
      } else {
        forceMovementButton.textContent = 'Failed';
        logDebugInfo('Error: Movement failed');
        
        setTimeout(() => {
          forceMovementButton.textContent = 'Force Movement Now';
          forceMovementButton.disabled = false;
        }, 1500);
      }
    });
  });
  
  // Function to check for the last movement time
  function checkLastMovement() {
    if (statusText.textContent === 'Active') {
      chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
        if (response) {
          if (response.lastMovementTime) {
            lastMovementIndicator.textContent = `Last movement: ${response.lastMovementTime}`;
          }
          
          if (response.movementCount !== undefined) {
            movementCounter.textContent = `Movements: ${response.movementCount}`;
          }
          
          // Show warning if there have been consecutive failures
          if (response.consecutiveFailures > 3) {
            logDebugInfo(`Warning: ${response.consecutiveFailures} consecutive movement failures. Try using the Mac Helper script.`);
          }
        }
      });
      
      // Check again in 5 seconds if the popup is still open
      setTimeout(checkLastMovement, 5000);
    }
  }
  
  // Function to log debug information
  function logDebugInfo(message) {
    const timestamp = new Date().toLocaleTimeString();
    debugInfo.textContent = `[${timestamp}] ${message}\n` + debugInfo.textContent;
  }
  
  // Log system information
  const isMac = navigator.platform.toLowerCase().includes('mac');
  logDebugInfo(`Platform: ${navigator.platform} ${isMac ? '(macOS)' : ''}`);
  logDebugInfo(`Browser: ${navigator.userAgent.match(/chrome\/([0-9.]+)/i)[1]}`);
  
  // Add Mac-specific helper information
  if (isMac) {
    const macHelperInfo = document.createElement('div');
    macHelperInfo.className = 'mac-helper-info';
    macHelperInfo.innerHTML = `
      <p>For best results on macOS, use the included Mac Helper script:</p>
      <code>./src/utils/mac-helper.sh -a</code>
    `;
    
    document.querySelector('.debug-section').appendChild(macHelperInfo);
  }
  
  // Check permissions
  chrome.permissions.contains({
    permissions: ['scripting', 'tabs']
  }, (result) => {
    if (result) {
      logDebugInfo('Required permissions granted');
    } else {
      logDebugInfo('WARNING: Missing required permissions');
    }
  });
});