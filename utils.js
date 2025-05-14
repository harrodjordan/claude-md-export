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
    title.trim().toLowerCase().replace(/^[^\w\d]+|[^\w\d]+$/g, "").replace(/[\s\W-]+/g, "-") : 
    "claude";
  
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