/**
 * Claude Markdown Export - Content Script
 * 
 * Content injection script derived from the claude-export project
 * https://github.com/ryanschiang/claude-export
 * 
 * Original work Copyright (c) 2023 Ryan Chiang
 * Modified work Copyright (c) 2024 Jordan Harrod
 * Licensed under the MIT License
 */

function addExportButton() {
  // Check if we're on a chat page
  if (window.location.href.includes('claude.ai/chat')) {
    // Check if button already exists
    if (document.getElementById('claude-md-export-button')) return;
    
    // Create button
    const button = document.createElement('button');
    button.id = 'claude-md-export-button';
    button.textContent = 'Export as Markdown';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.zIndex = '9999';
    button.style.padding = '8px 12px';
    button.style.backgroundColor = '#6d28d9';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    
    // Add hover effect
    button.onmouseover = function() {
      this.style.backgroundColor = '#5b21b6';
    };
    button.onmouseout = function() {
      this.style.backgroundColor = '#6d28d9';
    };
    
    // Add click handler
    button.onclick = function() {
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
    };
    
    // Add button to page
    document.body.appendChild(button);
  }
}

// Initialize and handle URL changes for SPA
addExportButton();

// Watch for navigation in the SPA
let lastUrl = location.href; 
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(addExportButton, 1000); // Delay to ensure DOM is ready
  }
}).observe(document, {subtree: true, childList: true});