# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Markdown Export is a Chrome extension (Manifest V3) that adds functionality to export Claude AI conversations to Markdown format. The extension adds a floating "Export as Markdown" button to Claude chat pages and allows users to save their conversations with proper formatting.

## Key Features

- Adds a floating export panel to Claude chat pages with two options:
  - "Export as Markdown" - Full conversation including thinking sections
  - "Export (No Thinking)" - Conversation without Claude's thinking process
- Exports entire conversations with proper formatting
- Preserves structure of both user prompts and Claude responses
- Handles various content types (text, lists, code blocks, tables)
- Automatically names files based on chat title
- Smart detection of thinking panels (works whether open or closed)

## Codebase Structure

- **manifest.json**: Extension configuration, permissions, and content script definitions
- **content.js**: Injects the export button on Claude pages and handles DOM interaction
- **popup.html/popup.js**: Simple UI with an export button and functionality
- **utils.js**: Helper functions for formatting dates, saving files, and processing content nodes

## Development

### Installation for Development

1. Clone this repository
2. Open Chrome extensions page (chrome://extensions/)
3. Enable Developer mode
4. Click "Load unpacked"
5. Select the project directory

### Testing Changes

1. Make changes to the relevant files
2. Go to chrome://extensions/ and click the refresh icon on the extension
3. Open or refresh Claude.ai to test your changes

### Common Issues

- If the export button doesn't appear, ensure the content.js selectors match Claude's current DOM structure
- Claude's web interface may change, requiring selector updates in content.js and popup.js
- Thinking detection relies on finding elements with class "font-tiempos" - if Claude changes this, the detection will need updating

## Recent Changes

- Removed PDF export functionality (was unreliable due to browser security constraints)
- Added "Export (No Thinking)" option that filters out thinking sections
- Implemented detection of thinking panels that works regardless of open/closed state
- Removed MIT license as this is now a private repository

## Future Development

See ROADMAP.md for planned features including:
- Multi-tier export system with AI-compressed summaries
- Claude API integration for intelligent conversation compression
- Adaptive DOM detection for resilience to UI changes
- Token estimation and context window management