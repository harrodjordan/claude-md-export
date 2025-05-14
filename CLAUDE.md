# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Markdown Export is a Chrome extension (Manifest V3) that adds functionality to export Claude AI conversations to Markdown format. The extension adds a floating "Export as Markdown" button to Claude chat pages and allows users to save their conversations with proper formatting.

## Key Features

- Adds a floating "Export as Markdown" button to Claude chat pages
- Exports entire conversations with proper formatting
- Preserves structure of both user prompts and Claude responses
- Handles various content types (text, lists, code blocks, tables)
- Automatically names files based on chat title

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