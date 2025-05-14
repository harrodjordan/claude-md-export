document.getElementById('export-md').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      files: ['utils.js']
    }).then(() => {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: exportAsMarkdown
      });
    });
  });
});

function exportAsMarkdown() {
  // Get chat elements
  const container = document.querySelector("div.flex-1.flex.flex-col.gap-3.px-4");
  if (!container) {
    alert("Could not find chat container. Are you on a Claude chat page?");
    return;
  }
  
  const menuButton = document.querySelector("button[data-testid='chat-menu-trigger']");
  const title = menuButton ? menuButton.textContent : "Claude Chat";
  const elements = container.querySelectorAll("div.font-claude-message, div.font-user-message");
  
  // Initialize markdown content
  let markdownContent = `# ${title}\n\`${getFormattedDateTime()}\`\n\n`;
  
  // Process each message
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    
    // Handle Claude's messages vs user messages
    if (element.classList.contains("font-claude-message")) {
      markdownContent += "_Claude_:\n";
      
      // Find all content elements inside Claude's message
      const contentNodes = element.querySelectorAll("p, ol, ul, pre, table");
      
      if (contentNodes.length > 0) {
        // Process each content node
        contentNodes.forEach(node => {
          markdownContent += processContentNode(node, markdownContent);
        });
      } else {
        // Fallback: try to get the text content directly
        markdownContent += `${element.textContent.trim()}\n\n`;
      }
    } else {
      // User message
      markdownContent += "_Prompt_:\n";
      
      // Extract text content from user message
      // First try to get structured content
      const contentNodes = element.querySelectorAll("p, ol, ul, pre, table");
      
      if (contentNodes.length > 0) {
        // Process each content node
        contentNodes.forEach(node => {
          markdownContent += processContentNode(node, markdownContent);
        });
      } else {
        // Fallback: get text content directly
        markdownContent += `${element.textContent.trim()}\n\n`;
      }
    }
    
    // Add spacing between messages
    markdownContent += "\n";
  }
  
  // Save markdown content to file
  saveToFile(markdownContent, "md", title);
}