# Claude Markdown Export

A Chrome extension that allows you to export [Claude AI](https://claude.ai) conversations as Markdown files.

## Features

- Adds a floating "Export as Markdown" button to Claude chat pages
- Exports entire conversations with proper formatting
- Preserves structure of both user prompts and Claude responses
- Handles text, lists, code blocks, and tables
- Automatically names files based on chat title

## Installation

1. Download this repository
2. Open Chrome extensions page (chrome://extensions/)
3. Enable Developer mode
4. Click "Load unpacked"
5. Select the project directory

## Usage

- Navigate to a Claude conversation at claude.ai
- Click the floating "Export as Markdown" button in the bottom right
- Or click the extension icon and use the popup menu
- The conversation will be downloaded as a Markdown file

## Credit and Attribution

This extension is based on the [claude-export](https://github.com/ryanschiang/claude-export) project by Ryan Chiang, which provided browser console scripts for exporting Claude conversations in various formats.

### Key Modifications

- Packaged as a Chrome browser extension for easier use
- Focus exclusively on Markdown export functionality
- Improved content extraction for compatibility with Claude UI updates
- Added floating button UI directly in the Claude interface
- Added extension popup interface

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [claude-export](https://github.com/ryanschiang/claude-export) - The original browser console scripts for exporting Claude conversations