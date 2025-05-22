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

function addExportButtons() {
  // Check if we're on a chat page
  if (window.location.href.includes('claude.ai/chat')) {
    // Check if buttons already exist
    if (document.getElementById('claude-md-export-button')) return;
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.position = 'fixed';
    buttonContainer.style.bottom = '20px';
    buttonContainer.style.right = '20px';
    buttonContainer.style.zIndex = '9999';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.gap = '8px';
    
    // Create Markdown export button
    const mdButton = document.createElement('button');
    mdButton.id = 'claude-md-export-button';
    mdButton.textContent = 'Export as Markdown';
    mdButton.style.padding = '8px 12px';
    mdButton.style.backgroundColor = '#6d28d9';
    mdButton.style.color = 'white';
    mdButton.style.border = 'none';
    mdButton.style.borderRadius = '4px';
    mdButton.style.cursor = 'pointer';
    mdButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    
    // Add hover effect
    mdButton.onmouseover = function() {
      this.style.backgroundColor = '#5b21b6';
    };
    mdButton.onmouseout = function() {
      this.style.backgroundColor = '#6d28d9';
    };
    
    // Create PDF export button
    const pdfButton = document.createElement('button');
    pdfButton.id = 'claude-pdf-export-button';
    pdfButton.textContent = 'Export as PDF';
    pdfButton.style.padding = '8px 12px';
    pdfButton.style.backgroundColor = '#6d28d9';
    pdfButton.style.color = 'white';
    pdfButton.style.border = 'none';
    pdfButton.style.borderRadius = '4px';
    pdfButton.style.cursor = 'pointer';
    pdfButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    
    // Add hover effect
    pdfButton.onmouseover = function() {
      this.style.backgroundColor = '#5b21b6';
    };
    pdfButton.onmouseout = function() {
      this.style.backgroundColor = '#6d28d9';
    };
    
    // Add markdown button click handler
    mdButton.onclick = function() {
      exportChat("md");
    };
    
    // Add PDF button click handler
    pdfButton.onclick = function() {
      exportChat("pdf");
    };
    
    // Add buttons to container
    buttonContainer.appendChild(mdButton);
    buttonContainer.appendChild(pdfButton);
    
    // Add container to page
    document.body.appendChild(buttonContainer);
  }
}

// Function to export chat content
function exportChat(format) {
  // Get chat elements
  const container = document.querySelector("div.flex-1.flex.flex-col.gap-3.px-4");
  if (!container) {
    alert("Could not find chat container. Are you on a Claude chat page?");
    return;
  }
  
  const menuButton = document.querySelector("button[data-testid='chat-menu-trigger']");
  const title = menuButton?.textContent?.trim() || "Claude Chat";
  const elements = container.querySelectorAll("div.font-claude-message, div.font-user-message");
  
  // Initialize content
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
      
      // Check for artifacts in Claude's message
      const artifacts = element.querySelectorAll('[data-artifact], .artifact-content, iframe[src*="artifact"]');
      if (artifacts.length > 0 && format === "pdf") {
        markdownContent += "\n[Artifact content will be included in PDF]\n\n";
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
  
  // Save content to file based on format
  if (format === "pdf") {
    generatePDF(markdownContent, title);
  } else {
    saveToFile(markdownContent, "md", title);
  }
}

// Initialize and handle URL changes for SPA
addExportButtons();

// Watch for navigation in the SPA
let lastUrl = location.href; 
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(addExportButtons, 1000); // Delay to ensure DOM is ready
  }
}).observe(document, {subtree: true, childList: true});