/**
 * Claude Markdown Export - Popup Script
 * 
 * Extension popup interface derived from the claude-export project
 * https://github.com/ryanschiang/claude-export
 * 
 * Original work Copyright (c) 2023 Ryan Chiang
 * Modified work Copyright (c) 2024 Jordan Harrod
 */

// Add event listener for Markdown export
document.addEventListener('DOMContentLoaded', function() {
  const mdButton = document.getElementById('export-md');
  const noThinkingButton = document.getElementById('export-no-thinking');
  
  if (mdButton) {
    mdButton.addEventListener('click', function() {
      executeExport('md', false);
    });
  }
  
  if (noThinkingButton) {
    noThinkingButton.addEventListener('click', function() {
      executeExport('md', true);
    });
  }
});

function executeExport(format, excludeThinking = false) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      files: ['utils.js']
    }).then(() => {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: exportAs,
        args: [format, excludeThinking]
      });
    });
  });
}

function exportAs(format, excludeThinking = false) {
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
      
      // First, check for thinking panel (collapsible section with thinking content)
      const thinkingPanel = element.querySelector('div[class*="font-tiempos"]');
      const hasThinkingPanel = thinkingPanel !== null;
      
      if (hasThinkingPanel && !excludeThinking) {
        // Extract thinking content from the panel (whether open or closed)
        const thinkingContent = thinkingPanel.querySelectorAll("p, ol, ul, pre, table");
        if (thinkingContent.length > 0) {
          markdownContent += "\n**Thinking:**\n";
          thinkingContent.forEach(node => {
            const processedContent = processContentNode(node, markdownContent, false);
            markdownContent += processedContent;
          });
          markdownContent += "\n**Response:**\n";
        }
      }
      
      // Now process the main response content
      // Get all content nodes but exclude those within the thinking panel
      let contentNodes;
      if (hasThinkingPanel) {
        // Get all nodes and filter out those inside the thinking panel
        const allNodes = element.querySelectorAll("p, ol, ul, pre, table");
        contentNodes = Array.from(allNodes).filter(node => {
          // Check if this node is inside the thinking panel
          return !thinkingPanel.contains(node);
        });
      } else {
        // No thinking panel, get all content nodes
        contentNodes = element.querySelectorAll("p, ol, ul, pre, table");
      }
      
      if (contentNodes.length > 0) {
        // Process each content node
        contentNodes.forEach(node => {
          const processedContent = processContentNode(node, markdownContent, false);
          markdownContent += processedContent;
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
          const processedContent = processContentNode(node, markdownContent, excludeThinking);
          markdownContent += processedContent;
        });
      } else {
        // Fallback: get text content directly
        markdownContent += `${element.textContent.trim()}\n\n`;
      }
    }
    
    // Add spacing between messages
    markdownContent += "\n";
  }
  
  // Save content to file
  const filename = excludeThinking ? `${title}-no-thinking` : title;
  saveToFile(markdownContent, "md", filename);
}