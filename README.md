# Documentation Helper

[简体中文](README.zh-CN.md)

An extension for DocSite-style documentation workflows, covering content search, link handling, Markdown copy, image upload, page maintenance, and redirect tracking.

## Features

- Content search: search page content by keywords
- Page link search: filter pages by title or URL and copy links
- Markdown tools: copy document Markdown, clean links, and format code
- Image tools: upload images and convert them to internal links
- Page maintenance: batch add and batch delete pages
- Document checks: built-in checks and custom rules
- Export: export Markdown, TOC, and redirect records
- Redirect records: compare TOC before and after changes, then generate redirect data

## Install

### Option 1: Download the release package

1. Open [Releases](https://github.com/airsasiu/doc-site-extension/releases)
2. Download `documentation-helper-1.0.zip`
3. Unzip it, then enable Developer mode in Chrome or Edge
4. Choose "Load unpacked" and select the extracted extension folder

Current release:
[documentation-helper-1.0.zip](https://github.com/airsasiu/doc-site-extension/releases/download/v1.0/documentation-helper-1.0.zip)

### Option 2: Local development

1. Clone the repository
2. Enable Developer mode in the browser extension page
3. Load the `extension` directory

## Configuration

Open the extension `Options` page and set these items first:

- `sourceBaseUrl`: base URL of the source documentation site
- `sourceProductId`: source documentation product ID
- `docApiUrl`: documentation site API URL
- `linkRules`: rules for API link handling
- `linkLocalizationRules`: rules for cross-site link conversion
- `customCheckRules`: custom check rules

## Shortcuts

- `Alt+Shift+F`: format selected code
- `Alt+Shift+U`: upload images in Markdown
- `Alt+Shift+D`: copy document Markdown
- `Alt+Shift+Y`: remove link URLs from selected text

## Development

The main extension code lives in `extension/`.

- `background.js`: command entry point
- `sidebar/`: sidebar UI and feature components
- `options/`: settings page
- `scripts/`: injected page scripts
- `help/`: help pages

## Notes

This project started as an internal DocSite workflow tool and has been gradually generalized for broader use.
