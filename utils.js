/**
 * Claude Markdown Export - Utils
 * 
 * Markdown export utilities derived from the claude-export project
 * https://github.com/ryanschiang/claude-export
 * 
 * Original work Copyright (c) 2023 Ryan Chiang
 * Modified work Copyright (c) 2024 Jordan Harrod
 * Licensed under the MIT License
 */

// Load PDF library
function loadPDFLibrary(callback) {
  if (typeof html2pdf !== 'undefined') {
    callback();
    return;
  }
  
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
  script.onload = callback;
  script.onerror = function() {
    alert('Failed to load PDF library. Please check your internet connection and try again.');
  };
  document.head.appendChild(script);
}

// Helper function to get formatted date time
function getFormattedDateTime() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - offset);
  return localDate.toISOString().slice(0, 19).replace("T", " ");
}

// Helper function to save content to file
function saveToFile(content, fileType, title) {
  const mimeType = "text/plain";
  let fileName = title ? 
    title.trim().toLowerCase().replace(/[^\w\d]+|[^\w\d]+$/g, "").replace(/[\s\W-]+/g, "-") : 
    "claude";
  
  // Ensure filename is not empty
  if (!fileName) fileName = "claude";
  
  fileName += ".md";
  
  const blob = new Blob([content], {type: mimeType});
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  
  // Clean up
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

// Process Claude's message content (paragraph, list, code block, etc.)
function processContentNode(node, markdownContent) {
  const tagName = node.tagName;
  
  // Handle different element types
  if (tagName === "P") {
    return `${node.textContent}\n\n`;
  }
  
  // Handle ordered lists
  else if (tagName === "OL") {
    let content = "";
    const items = node.querySelectorAll("li");
    items.forEach((li, index) => {
      content += `${index + 1}. ${li.textContent}\n`;
    });
    return content + "\n";
  }
  
  // Handle unordered lists
  else if (tagName === "UL") {
    let content = "";
    const items = node.querySelectorAll("li");
    items.forEach((li) => {
      content += `- ${li.textContent}\n`;
    });
    return content + "\n";
  }
  
  // Handle code blocks
  else if (tagName === "PRE") {
    const codeElement = node.querySelector("code");
    if (codeElement) {
      const code = codeElement.textContent;
      let language = "";
      
      // Try to extract language from class
      if (codeElement.className && codeElement.className.includes("language-")) {
        language = codeElement.className.split("language-")[1].split(" ")[0];
      } else if (codeElement.className && codeElement.className.includes("-")) {
        language = codeElement.className.split("-")[1];
      }
      
      return `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    }
    return "";
  }
  
  // Handle tables
  else if (tagName === "TABLE") {
    let tableContent = "";
    const headerRows = node.querySelectorAll("thead tr");
    const bodyRows = node.querySelectorAll("tbody tr");
    
    // Process header rows
    if (headerRows.length > 0) {
      headerRows.forEach(row => {
        let cellsContent = "";
        const cells = row.querySelectorAll("th");
        cells.forEach(cell => {
          cellsContent += `| ${cell.textContent} `;
        });
        tableContent += `${cellsContent}|\n`;
        
        // Add separator after header
        if (cells.length > 0) {
          tableContent += `| ${Array(cells.length).fill("---").join(" | ")} |\n`;
        }
      });
    }
    
    // Process body rows
    bodyRows.forEach(row => {
      let cellsContent = "";
      const cells = row.querySelectorAll("td");
      cells.forEach(cell => {
        cellsContent += `| ${cell.textContent} `;
      });
      tableContent += `${cellsContent}|\n`;
    });
    
    return tableContent + "\n";
  }
  
  return "";
}

// Process content for PDF generation, extracting artifacts
function processContentForPDF(container, markdownContent) {
  // Convert markdown to HTML
  let htmlContent = convertMarkdownToHTML(markdownContent);
  
  // Process messages with custom styling
  htmlContent = htmlContent
    .replace(/<em>Prompt<\/em>:/g, '<div class="message-prompt">Prompt:</div>')
    .replace(/<em>Claude<\/em>:/g, '<div class="message-claude">Claude:</div>');
  
  // Extract and render artifacts if present
  if (container) {
    const messages = container.querySelectorAll("div.font-claude-message");
    messages.forEach((message, index) => {
      // Look for artifact content or rendered components
      const artifactContainers = message.querySelectorAll('[data-artifact], iframe, .artifact-container, canvas');
      
      artifactContainers.forEach(artifact => {
        // Try to capture the content
        if (artifact.tagName === 'IFRAME') {
          // For iframes, we'll add a placeholder
          const placeholder = `<div style="border: 1px solid #ccc; padding: 20px; margin: 10px 0; text-align: center; background: #f9f9f9;">
            <p>Rendered artifact preview not available in PDF</p>
          </div>`;
          htmlContent = htmlContent.replace(`Claude_${index}:`, `Claude_${index}:${placeholder}`);
        } else if (artifact.tagName === 'CANVAS') {
          // For canvas elements, try to convert to image
          try {
            const dataUrl = artifact.toDataURL();
            const img = `<img src="${dataUrl}" style="max-width: 100%; margin: 10px 0;">`;
            htmlContent = htmlContent.replace(`Claude_${index}:`, `Claude_${index}:${img}`);
          } catch (e) {
            // If canvas can't be captured, add placeholder
            const placeholder = `<div style="border: 1px solid #ccc; padding: 20px; margin: 10px 0; text-align: center; background: #f9f9f9;">
              <p>Canvas content not available in PDF</p>
            </div>`;
            htmlContent = htmlContent.replace(`Claude_${index}:`, `Claude_${index}:${placeholder}`);
          }
        }
      });
    });
  }
  
  return htmlContent;
}

// Generate PDF from markdown content with enhanced HTML rendering
function generatePDF(markdownContent, title) {
  loadPDFLibrary(() => {
    try {
      // Get the chat container to extract artifacts and graphics
      const container = document.querySelector("div.flex-1.flex.flex-col.gap-3.px-4");
      
      // Create a container for the PDF content
      const pdfContainer = document.createElement('div');
      pdfContainer.style.fontFamily = 'Arial, sans-serif';
      pdfContainer.style.maxWidth = '800px';
      pdfContainer.style.margin = '0 auto';
      pdfContainer.style.padding = '20px';
      
      // Process the content to extract artifacts
      const htmlContent = processContentForPDF(container, markdownContent);
      pdfContainer.innerHTML = htmlContent;
    
    // Style the content for PDF
    pdfContainer.querySelectorAll('pre').forEach(pre => {
      pre.style.backgroundColor = '#f4f4f4';
      pre.style.padding = '10px';
      pre.style.borderRadius = '4px';
      pre.style.overflow = 'auto';
      pre.style.marginBottom = '10px';
    });
    
    pdfContainer.querySelectorAll('code').forEach(code => {
      if (!code.parentElement.matches('pre')) {
        code.style.backgroundColor = '#f4f4f4';
        code.style.padding = '2px 4px';
        code.style.borderRadius = '2px';
        code.style.fontFamily = 'Consolas, Monaco, monospace';
      }
    });
    
    // Style messages
    pdfContainer.querySelectorAll('.message-prompt').forEach(prompt => {
      prompt.style.fontWeight = 'bold';
      prompt.style.marginTop = '20px';
      prompt.style.marginBottom = '10px';
    });
    
    pdfContainer.querySelectorAll('.message-claude').forEach(claude => {
      claude.style.fontWeight = 'bold';
      claude.style.marginTop = '20px';
      claude.style.marginBottom = '10px';
    });
    
    let pdfFileName = title ? 
      title.trim().toLowerCase().replace(/[^\w\d]+/g, '-') : 
      'claude';
    
    // Ensure filename is not empty
    if (!pdfFileName) pdfFileName = 'claude';
    
    const opt = {
      margin: 0.5,
      filename: pdfFileName + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
      html2pdf().from(pdfContainer).set(opt).save();
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  });
}

// Helper function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Convert markdown to HTML for PDF generation
function convertMarkdownToHTML(markdown) {
  // First escape any existing HTML to prevent XSS
  let html = escapeHtml(markdown)
    // Headers
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    
    // Inline code (single backticks)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // Code blocks (triple backticks)
    .replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      // Decode HTML entities in code blocks back to original
      const decodedCode = code
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
      const escapedCode = decodedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<pre><code class="language-${lang || 'text'}">${escapedCode}</code></pre>`;
    })
    
    // Emphasis
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    
    // Lists
    .replace(/^\d+\.\s+(.+)$/gm, '<olli>$1</olli>')
    .replace(/^-\s+(.+)$/gm, '<ulli>$1</ulli>')
    
    // Group ordered list items
    .replace(/(<olli>.*<\/olli>\n?)+/g, function(match) {
      return '<ol>' + match.replace(/<olli>/g, '<li>').replace(/<\/olli>/g, '</li>') + '</ol>';
    })
    
    // Group unordered list items
    .replace(/(<ulli>.*<\/ulli>\n?)+/g, function(match) {
      return '<ul>' + match.replace(/<ulli>/g, '<li>').replace(/<\/ulli>/g, '</li>') + '</ul>';
    })
    
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[houl])/gm, '<p>')
    .replace(/(?<![>])$/gm, '</p>');
  
  // Clean up
  html = html
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<[hol])/g, '$1')
    .replace(/(<\/[hol]>)<\/p>/g, '$1');
  
  return html;
}