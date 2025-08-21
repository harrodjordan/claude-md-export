/**
 * Claude Markdown Export - Content Script (Updated)
 * 
 * Updated version to work with Claude's new DOM structure
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
  console.log('Starting export...');
  
  // Get chat title
  const menuButton = document.querySelector("button[data-testid='chat-menu-trigger']");
  const title = menuButton?.textContent?.trim() || "Claude Chat";
  
  // Initialize content
  let markdownContent = `# ${title}\n\`${getFormattedDateTime()}\`\n\n`;
  
  // Find all message containers using multiple strategies
  const messages = [];
  
  // Strategy 1: Look for containers with data-test-render-count
  const renderContainers = document.querySelectorAll('[data-test-render-count]');
  console.log(`Found ${renderContainers.length} render containers`);
  
  renderContainers.forEach(container => {
    // Check if this container has a user message
    const userMessage = container.querySelector('[data-testid="user-message"]');
    if (userMessage) {
      messages.push({
        type: 'user',
        element: container,
        content: userMessage
      });
    }
    
    // Check if this container has a Claude response
    const claudeResponse = container.querySelector('[data-is-streaming]');
    if (claudeResponse) {
      messages.push({
        type: 'claude',
        element: container,
        content: claudeResponse
      });
    }
  });
  
  console.log(`Found ${messages.length} messages`);
  
  // Process each message
  messages.forEach((message, index) => {
    console.log(`Processing message ${index + 1}: ${message.type}`);
    
    if (message.type === 'user') {
      markdownContent += "_Prompt_:\n";
      
      // Extract text from user message
      const paragraphs = message.content.querySelectorAll('p');
      paragraphs.forEach(p => {
        markdownContent += p.textContent + '\n\n';
      });
    } else if (message.type === 'claude') {
      markdownContent += "_Claude_:\n";
      
      // Check for thinking sections if not excluding
      let hasThinking = false;
      const extractedThinkingContent = new Set(); // Track what we've already extracted
      
      if (!excludeThinking) {
        // Look for thinking button summaries first
        const thinkingButtons = message.element.querySelectorAll('button.group\\/row');
        
        thinkingButtons.forEach(button => {
          const buttonText = button.textContent || '';
          if (buttonText.match(/Analyzed|Pondering|Thinking|Processing|Crafted|Unraveled/i)) {
            const buttonKey = buttonText.trim();
            
            // Only process if we haven't seen this thinking section before
            if (!extractedThinkingContent.has(buttonKey)) {
              extractedThinkingContent.add(buttonKey);
              hasThinking = true;
              
              markdownContent += "\n**[Thinking]:** " + buttonKey + "\n\n";
              
              // The thinking content is in a sibling div after the button
              // Look for the collapsed content container within the same parent
              const buttonContainer = button.closest('.transition-all');
              if (buttonContainer) {
                // The content is in the next sibling div with tabindex="-1"
                const contentContainer = buttonContainer.querySelector('div[tabindex="-1"].overflow-hidden');
                if (contentContainer) {
                  // Extract all paragraphs and lists from the thinking content
                  const thinkingElements = contentContainer.querySelectorAll('p.whitespace-normal, li.whitespace-normal');
                  
                  thinkingElements.forEach(element => {
                    const text = element.textContent.trim();
                    if (text) {
                      // Handle list items vs paragraphs
                      if (element.tagName === 'LI') {
                        markdownContent += '- ' + text + '\n';
                      } else {
                        markdownContent += text + '\n\n';
                      }
                    }
                  });
                }
              }
            }
          }
        });
        
        // Add visual separator between thinking and response
        if (hasThinking) {
          markdownContent += "\n---\n\n**[Response]:**\n\n";
        }
      }
      
      // Extract main response content
      // Look for the actual response text in various possible containers
      const responseContainers = message.element.querySelectorAll('.font-claude-response p.whitespace-normal, [class*="grid-cols"] p.whitespace-normal');
      
      if (responseContainers.length > 0) {
        responseContainers.forEach(p => {
          const text = p.textContent.trim();
          // Skip thinking panel content and summaries
          if (text && !text.match(/^(Analyzed|Pondering|Thinking|Processing|Crafted|Unraveled)/i) &&
              !p.closest('[tabindex="-1"]')) { // Skip content inside thinking panels
            markdownContent += text + '\n\n';
          }
        });
      } else {
        // Fallback: try to get any paragraph content outside thinking panels
        const allParagraphs = message.element.querySelectorAll('p');
        allParagraphs.forEach(p => {
          const text = p.textContent.trim();
          // Skip thinking content and empty paragraphs
          if (text && 
              !text.match(/^(This is a really interesting case study|The user pointed out|In my thinking|But then in my actual output|The user then corrected|Why did this happen|I think what happened|The reasoning reveals)/i) &&
              !p.closest('[tabindex="-1"]') && // Skip content inside thinking panels
              !text.match(/^(Analyzed|Pondering|Thinking|Processing|Crafted|Unraveled)/i)) {
            markdownContent += text + '\n\n';
          }
        });
      }
      
      // Handle code blocks
      const codeBlocks = message.element.querySelectorAll('pre code');
      codeBlocks.forEach(code => {
        const language = code.className.match(/language-(\w+)/)?.[1] || '';
        markdownContent += `\`\`\`${language}\n${code.textContent}\n\`\`\`\n\n`;
      });
      
      // Handle lists
      const lists = message.element.querySelectorAll('ol, ul');
      lists.forEach(list => {
        const items = list.querySelectorAll('li');
        items.forEach((item, i) => {
          if (list.tagName === 'OL') {
            markdownContent += `${i + 1}. ${item.textContent}\n`;
          } else {
            markdownContent += `- ${item.textContent}\n`;
          }
        });
        markdownContent += '\n';
      });
    }
    
    markdownContent += '\n';
  });
  
  // If no messages found, try alternative approach
  if (messages.length === 0) {
    console.log('No messages found with primary method, trying alternative...');
    
    // Try to find any user messages and Claude responses directly
    const userMessages = document.querySelectorAll('[data-testid="user-message"]');
    const claudeResponses = document.querySelectorAll('.font-claude-response');
    
    console.log(`Alternative found: ${userMessages.length} user messages, ${claudeResponses.length} Claude responses`);
    
    // Process any found messages
    userMessages.forEach(msg => {
      markdownContent += "_Prompt_:\n";
      const paragraphs = msg.querySelectorAll('p');
      paragraphs.forEach(p => {
        markdownContent += p.textContent + '\n\n';
      });
      markdownContent += '\n';
    });
    
    claudeResponses.forEach(resp => {
      markdownContent += "_Claude_:\n";
      const paragraphs = resp.querySelectorAll('p');
      paragraphs.forEach(p => {
        markdownContent += p.textContent + '\n\n';
      });
      markdownContent += '\n';
    });
  }
  
  // Save the file
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