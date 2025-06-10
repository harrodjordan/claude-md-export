/**
 * Claude Markdown Export - Content Script
 * 
 * Content injection script derived from the claude-export project
 * https://github.com/ryanschiang/claude-export
 * 
 * Original work Copyright (c) 2023 Ryan Chiang
 * Modified work Copyright (c) 2024 Jordan Harrod
 */

function addExportButtons() {
  // Check if we're on a chat page
  if (window.location.href.includes('claude.ai/chat')) {
    // Check if panel already exists
    if (document.getElementById('claude-export-panel')) return;
    
    // Create slide-out panel container
    const panelContainer = document.createElement('div');
    panelContainer.id = 'claude-export-panel';
    panelContainer.style.position = 'fixed';
    panelContainer.style.top = '50%';
    panelContainer.style.right = '0';
    panelContainer.style.transform = 'translateY(-50%)';
    panelContainer.style.zIndex = '9999';
    panelContainer.style.display = 'flex';
    panelContainer.style.alignItems = 'center';
    panelContainer.style.transition = 'all 0.3s ease';
    
    // Create hover tab
    const hoverTab = document.createElement('div');
    hoverTab.style.backgroundColor = '#6d28d9';
    hoverTab.style.color = 'white';
    hoverTab.style.padding = '15px 8px';
    hoverTab.style.borderRadius = '8px 0 0 8px';
    hoverTab.style.cursor = 'pointer';
    hoverTab.style.writingMode = 'vertical-rl';
    hoverTab.style.textOrientation = 'mixed';
    hoverTab.style.fontSize = '14px';
    hoverTab.style.fontWeight = '500';
    hoverTab.style.boxShadow = '-2px 0 4px rgba(0, 0, 0, 0.1)';
    hoverTab.textContent = 'Export';
    
    // Create button panel
    const buttonPanel = document.createElement('div');
    buttonPanel.style.backgroundColor = 'white';
    buttonPanel.style.border = '1px solid #e5e7eb';
    buttonPanel.style.borderRadius = '8px 0 0 8px';
    buttonPanel.style.padding = '12px';
    buttonPanel.style.display = 'flex';
    buttonPanel.style.flexDirection = 'column';
    buttonPanel.style.gap = '8px';
    buttonPanel.style.boxShadow = '-2px 0 8px rgba(0, 0, 0, 0.1)';
    buttonPanel.style.marginRight = '-200px'; // Hidden by default
    buttonPanel.style.transition = 'margin-right 0.3s ease';
    buttonPanel.style.opacity = '0';
    buttonPanel.style.transition = 'all 0.3s ease';
    
    // Create Markdown export button
    const mdButton = document.createElement('button');
    mdButton.id = 'claude-md-export-button';
    mdButton.textContent = 'Export as Markdown';
    mdButton.style.padding = '8px 16px';
    mdButton.style.backgroundColor = '#6d28d9';
    mdButton.style.color = 'white';
    mdButton.style.border = 'none';
    mdButton.style.borderRadius = '6px';
    mdButton.style.cursor = 'pointer';
    mdButton.style.fontSize = '14px';
    mdButton.style.fontWeight = '500';
    mdButton.style.transition = 'background-color 0.2s ease';
    mdButton.style.whiteSpace = 'nowrap';
    
    // Add hover effect
    mdButton.onmouseover = function() {
      this.style.backgroundColor = '#5b21b6';
    };
    mdButton.onmouseout = function() {
      this.style.backgroundColor = '#6d28d9';
    };
    
    // Create export without thinking button
    const noThinkingButton = document.createElement('button');
    noThinkingButton.id = 'claude-no-thinking-export-button';
    noThinkingButton.textContent = 'Export (No Thinking)';
    noThinkingButton.style.padding = '8px 16px';
    noThinkingButton.style.backgroundColor = '#6d28d9';
    noThinkingButton.style.color = 'white';
    noThinkingButton.style.border = 'none';
    noThinkingButton.style.borderRadius = '6px';
    noThinkingButton.style.cursor = 'pointer';
    noThinkingButton.style.fontSize = '14px';
    noThinkingButton.style.fontWeight = '500';
    noThinkingButton.style.transition = 'background-color 0.2s ease';
    noThinkingButton.style.whiteSpace = 'nowrap';
    
    // Add hover effect
    noThinkingButton.onmouseover = function() {
      this.style.backgroundColor = '#5b21b6';
    };
    noThinkingButton.onmouseout = function() {
      this.style.backgroundColor = '#6d28d9';
    };
    
    // Add markdown button click handler
    mdButton.onclick = function() {
      exportChat("md", false);
    };
    
    // Add no thinking button click handler
    noThinkingButton.onclick = function() {
      exportChat("md", true);
    };
    
    // Add buttons to panel
    buttonPanel.appendChild(mdButton);
    buttonPanel.appendChild(noThinkingButton);
    
    // Add hover behavior
    let hoverTimeout;
    
    const showPanel = () => {
      clearTimeout(hoverTimeout);
      buttonPanel.style.marginRight = '0';
      buttonPanel.style.opacity = '1';
      hoverTab.style.opacity = '0.8';
    };
    
    const hidePanel = () => {
      hoverTimeout = setTimeout(() => {
        buttonPanel.style.marginRight = '-200px';
        buttonPanel.style.opacity = '0';
        hoverTab.style.opacity = '1';
      }, 300);
    };
    
    panelContainer.onmouseenter = showPanel;
    panelContainer.onmouseleave = hidePanel;
    
    // Touch support for mobile
    hoverTab.onclick = () => {
      if (buttonPanel.style.marginRight === '0px') {
        hidePanel();
      } else {
        showPanel();
      }
    };
    
    // Assemble the panel
    panelContainer.appendChild(hoverTab);
    panelContainer.appendChild(buttonPanel);
    
    // Add to page
    document.body.appendChild(panelContainer);
  }
}

// Function to export chat content
function exportChat(format, excludeThinking = false) {
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
      
      // Check for artifacts in Claude's message
      // Note: PDF export functionality has been removed
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