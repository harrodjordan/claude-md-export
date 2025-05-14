# Changelog

This changelog documents the major differences between Claude Markdown Export and the original [claude-export](https://github.com/ryanschiang/claude-export) project by Ryan Chiang.

## Major Changes

### Packaging and Distribution
- Converted from browser console scripts to a Chrome browser extension
- Added extension manifest and configuration
- Created extension icon assets

### User Interface
- Added persistent floating "Export as Markdown" button to Claude chat interface
- Created extension popup with export functionality
- Implemented automatic detection of Claude chat pages

### Functionality
- Focused exclusively on Markdown export (removed JSON and PNG export options)
- Enhanced content extraction selectors for compatibility with Claude UI updates
- Implemented automatic chat title extraction for filename generation
- Added timestamp inclusion in exported Markdown files

### Code Structure
- Reorganized code into modular components:
  - `content.js`: Claude UI interaction and button injection
  - `utils.js`: Content processing and file operations
  - `popup.js`: Extension popup functionality
- Improved error handling for DOM element selection
- Added mutation observer to handle Claude's SPA navigation