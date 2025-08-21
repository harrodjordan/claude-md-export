/**
 * Claude Markdown Export - Popup Script (Updated)
 * 
 * Updated version to work with Claude's new DOM structure
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
  console.log('Starting export from popup...');
  
  // Get chat title
  const menuButton = document.querySelector("button[data-testid='chat-menu-trigger']");
  const title = menuButton ? menuButton.textContent : "Claude Chat";
  
  // Initialize markdown content
  let markdownContent = `# ${title}\n\`${getFormattedDateTime()}\`\n\n`;
  
  // Find all message containers using data-test-render-count attribute
  const messages = [];
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
  
  // Save content to file
  const filename = excludeThinking ? `${title}-no-thinking` : title;
  saveToFile(markdownContent, "md", filename);
}