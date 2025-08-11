// Injected script that runs in the page context
// This script is injected by the content script to access page-specific APIs

console.log('WebCopilot injected script loaded');

// Expose functions to the content script
(window as any).extractPageContent = () => {
  // This function will be called by the content script
  // to extract page content from the page context
  return {
    url: window.location.href,
    title: document.title,
    content: document.body?.textContent || '',
    timestamp: Date.now()
  };
};

// Listen for messages from the content script
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  
  if (event.data.type === 'WEBCOPILOT_EXTRACT') {
    const pageData = (window as any).extractPageContent();
    window.postMessage({
      type: 'WEBCOPILOT_EXTRACT_RESPONSE',
      data: pageData
    }, '*');
  }
});

// Notify that the script is ready
window.postMessage({
  type: 'WEBCOPILOT_READY'
}, '*'); 