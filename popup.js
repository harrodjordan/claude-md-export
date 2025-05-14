/**
 * Claude Markdown Export - Popup Script
 * 
 * Extension popup interface derived from the claude-export project
 * https://github.com/ryanschiang/claude-export
 * 
 * Original work Copyright (c) 2023 Ryan Chiang
 * Modified work Copyright (c) 2024 Jordan Harrod
 * Licensed under the MIT License
 */

// Add event listener for Markdown export
document.addEventListener('DOMContentLoaded', function() {
  const mdButton = document.getElementById('export-md');
  const pdfButton = document.getElementById('export-pdf');
  
  if (mdButton) {
    mdButton.addEventListener('click', function() {
      executeExport('md');
    });
  }
  
  if (pdfButton) {
    pdfButton.addEventListener('click', function() {
      executeExport('pdf');
    });
  }
});

function executeExport(format) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      files: ['utils.js']
    }).then(() => {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: exportAs,
        args: [format]
      });
    });
  });
}

function exportAs(format) {
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
  
  // Save content based on format
  if (format === "pdf") {
    generatePDF(markdownContent, title);
  } else {
    saveToFile(markdownContent, "md", title);
  }
}