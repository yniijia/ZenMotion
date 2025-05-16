// State variables
let isActive = false;
let movementInterval = 30000; // 30 seconds default
let moveMouseTimer = null;
let lastMovementTime = null;
let consecutiveFailures = 0;
let movementCount = 0;

// Initialize extension state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['isActive', 'movementInterval'], (result) => {
    isActive = result.isActive || false;
    movementInterval = result.movementInterval || 30000;
    
    if (isActive) {
      startMovement();
    }
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggle') {
    isActive = !isActive;
    chrome.storage.sync.set({ isActive });
    
    if (isActive) {
      startMovement();
      sendResponse({ status: 'active' });
    } else {
      stopMovement();
      sendResponse({ status: 'inactive' });
    }
    return true;
  } else if (message.action === 'getStatus') {
    sendResponse({ 
      isActive,
      lastMovementTime: lastMovementTime ? new Date(lastMovementTime).toLocaleTimeString() : 'Never',
      consecutiveFailures,
      movementCount
    });
    return true;
  } else if (message.action === 'updateSettings') {
    movementInterval = message.movementInterval || movementInterval;
    chrome.storage.sync.set({ movementInterval });
    
    // Restart movement with new settings if active
    if (isActive) {
      stopMovement();
      startMovement();
    }
    sendResponse({ status: 'settings updated' });
    return true;
  } else if (message.action === 'forceMovement') {
    simulateMouseMovement();
    sendResponse({ status: 'movement triggered' });
    return true;
  }
});

// Start mouse movement simulation
function startMovement() {
  // Clear any existing timer
  if (moveMouseTimer) {
    clearInterval(moveMouseTimer);
  }
  
  // Reset counters
  consecutiveFailures = 0;
  movementCount = 0;
  
  // Use a shorter interval for more frequent movements
  // Mac typically has a minimum idle time of 1 minute
  const actualInterval = Math.min(movementInterval, 10000); // Max 10 seconds between movements
  
  // Use both setInterval and Chrome alarms for redundancy
  moveMouseTimer = setInterval(simulateMouseMovement, actualInterval);
  chrome.alarms.create('moveMouseAlarm', { periodInMinutes: actualInterval / 60000 });
  
  // Immediately trigger a movement
  simulateMouseMovement();
  
  // Create additional alarms at different intervals for better coverage
  chrome.alarms.create('moveMouseAlarmBackup', { periodInMinutes: (actualInterval * 0.75) / 60000 });
  chrome.alarms.create('moveMouseAlarmBackup2', { periodInMinutes: (actualInterval * 0.5) / 60000 });
  
  // Create a more frequent micro-movement alarm
  chrome.alarms.create('microMovement', { periodInMinutes: 0.25 }); // Every 15 seconds
}

// Stop mouse movement simulation
function stopMovement() {
  if (moveMouseTimer) {
    clearInterval(moveMouseTimer);
    moveMouseTimer = null;
  }
  chrome.alarms.clear('moveMouseAlarm');
  chrome.alarms.clear('moveMouseAlarmBackup');
  chrome.alarms.clear('moveMouseAlarmBackup2');
  chrome.alarms.clear('microMovement');
}

// Handle the alarm event to move the mouse
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('moveMouseAlarm')) {
    simulateMouseMovement();
  } else if (alarm.name === 'microMovement') {
    // Perform a smaller, less intrusive movement
    simulateMicroMovement();
  }
});

// Simulate a small movement
function simulateMicroMovement() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      try {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: () => {
            // Small keyboard event that's less intrusive
            const keyEvent = new KeyboardEvent('keydown', {
              key: 'Shift',
              code: 'ShiftLeft',
              bubbles: true
            });
            document.dispatchEvent(keyEvent);
            
            setTimeout(() => {
              document.dispatchEvent(new KeyboardEvent('keyup', {
                key: 'Shift',
                code: 'ShiftLeft',
                bubbles: true
              }));
            }, 10);
            
            return true;
          }
        });
      } catch (error) {
        console.error('ZenMotion: Error in micro-movement:', error);
      }
    }
  });
}

// Simulate mouse movement by injecting script into active tab
function simulateMouseMovement() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      try {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: performMovements
        }).then(() => {
          lastMovementTime = Date.now();
          consecutiveFailures = 0;
          movementCount++;
          console.log('ZenMotion: Movement successful at', new Date().toLocaleTimeString());
        }).catch(error => {
          console.error('ZenMotion: Error executing script:', error);
          consecutiveFailures++;
          createFallbackTab();
        });
      } catch (error) {
        console.error('ZenMotion: Error executing script:', error);
        consecutiveFailures++;
        createFallbackTab();
      }
    } else {
      // If no active tab is found, create a new one
      createFallbackTab();
    }
  });
}

// Function to be injected into the page
function performMovements() {
  // Generate larger random movement
  const maxRadius = 150; // Increased for more noticeable movement
  const randomX = Math.floor(Math.random() * maxRadius * 2) - maxRadius;
  const randomY = Math.floor(Math.random() * maxRadius * 2) - maxRadius;
  
  // Create and dispatch multiple mouse events for better detection
  for (let i = 0; i < 8; i++) { // Increased number of movements
    // Move to different positions
    const mouseEvent = new MouseEvent('mousemove', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: window.innerWidth / 2 + randomX + (i * 15),
      clientY: window.innerHeight / 2 + randomY + (i * 15)
    });
    
    document.dispatchEvent(mouseEvent);
    
    // Add mouse down/up events which are more likely to be detected by the OS
    if (i % 3 === 0) { // More frequent clicks
      document.dispatchEvent(new MouseEvent('mousedown', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: window.innerWidth / 2 + randomX + (i * 15),
        clientY: window.innerHeight / 2 + randomY + (i * 15)
      }));
      
      setTimeout(() => {
        document.dispatchEvent(new MouseEvent('mouseup', {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: window.innerWidth / 2 + randomX + (i * 15),
          clientY: window.innerHeight / 2 + randomY + (i * 15)
        }));
      }, 10);
    }
  }
  
  // Simulate more aggressive scroll events
  window.scrollBy(0, 10);
  setTimeout(() => window.scrollBy(0, -10), 200);
  
  // Simulate keyboard activity with multiple keys
  const keys = ['Shift', 'Control', 'Alt', 'ArrowUp', 'ArrowDown', 'CapsLock', 'Tab'];
  
  // Use 2-3 random keys each time
  const numKeys = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < numKeys; i++) {
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    
    const keyDownEvent = new KeyboardEvent('keydown', {
      key: randomKey,
      code: randomKey + 'Left',
      bubbles: true
    });
    document.dispatchEvent(keyDownEvent);
    
    setTimeout(() => {
      const keyUpEvent = new KeyboardEvent('keyup', {
        key: randomKey,
        code: randomKey + 'Left',
        bubbles: true
      });
      document.dispatchEvent(keyUpEvent);
    }, 50 + (i * 25)); // Staggered release of keys
  }
  
  // Focus and blur elements to trigger focus events
  const activeElement = document.activeElement || document.body;
  const prevActive = activeElement;
  
  if (document.body !== activeElement) {
    document.body.focus();
    setTimeout(() => {
      if (prevActive && typeof prevActive.focus === 'function') {
        prevActive.focus();
      }
    }, 100);
  }
  
  // Find a clickable element and click it (like a button or link)
  const clickableElements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
  if (clickableElements.length > 0) {
    // Get a random element but don't actually click it (just simulate the events)
    const randomIndex = Math.floor(Math.random() * clickableElements.length);
    const element = clickableElements[randomIndex];
    
    // Get element position
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Simulate hovering over the element
    element.dispatchEvent(new MouseEvent('mouseover', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: centerX,
      clientY: centerY
    }));
    
    // Don't actually click to avoid navigation or form submission
  }
  
  console.log('ZenMotion: Enhanced movement simulated at ' + new Date().toLocaleTimeString());
  return true;
}

// Create a fallback tab when no active tab is available
function createFallbackTab() {
  chrome.tabs.create({ url: 'test.html', active: true }, (tab) => {
    setTimeout(() => {
      try {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: performMovements
        }).then(() => {
          lastMovementTime = Date.now();
          movementCount++;
          console.log('ZenMotion: Fallback movement successful at', new Date().toLocaleTimeString());
        });
      } catch (error) {
        console.error('ZenMotion: Error in fallback tab:', error);
        consecutiveFailures++;
      }
    }, 500);
  });
}