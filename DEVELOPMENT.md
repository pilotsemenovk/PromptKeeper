# Development Guide

This document provides technical details for developers working on PromptKeeper.

## Project Structure

```
PromptKeeper/
├── extension/
│   ├── manifest.json
│   ├── background.js          # Service Worker
│   ├── content.js             # Content script for AI websites
│   ├── content.css            # Content script styles
│   ├── popup.html             # Extension popup UI
│   ├── popup.js               # Popup logic and state
│   ├── popup.css              # Popup styles
│   ├── options.html           # Settings page
│   ├── icons/                 # Extension icons (16, 48, 128 px)
│   └── data/
│       ├── ai-tools.json      # Pre-loaded 240+ AI tools
│       └── imported.json      # Pre-loaded 115+ prompts
└── webapp/
    ├── index.html             # Single-file web application
    └── imported.json          # Same data as extension
```

## Key Concepts

### Manifest V3
The extension uses Chrome Manifest V3 standard, which:
- Requires a Service Worker instead of background page
- Content scripts communicate via `chrome.runtime.sendMessage()`
- No inline scripts allowed (all code must be in separate files)
- Stricter CSP (Content Security Policy)

### Storage Architecture

**Extension:**
- Uses `chrome.storage.local` API for persistent data
- IndexedDB for larger datasets (if needed in future)
- Data survives browser restart

**Web App:**
- Uses browser's IndexedDB API
- Completely separate database from extension
- Can export/import JSON to sync with extension

### Message Passing

The extension uses a simple message protocol between content script, popup, and service worker:

```javascript
// From content script to service worker:
chrome.runtime.sendMessage({
  action: "savePrompt",
  data: { title, content }
}, response => console.log(response));

// Service worker listens:
chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg.action === "savePrompt") {
    // Handle and respond
  }
});
```

## API Integration

### OpenRouter API

All AI functions use OpenRouter's free tier:

**Endpoint:** `https://openrouter.ai/api/v1/chat/completions`

**Authentication:**
```javascript
headers: {
  "Authorization": `Bearer sk-or-v1-...`,
  "HTTP-Referer": location.href,
  "X-Title": "PromptKeeper",
  "Content-Type": "application/json"
}
```

**Models:**
- **Free model:** `meta-llama/llama-3.3-70b-instruct:free`
- **Fallback models:** Available on openrouter.ai/models

**Functions:**
1. **Search:** Find similar prompts given a query
2. **Clean:** Remove Telegram metadata from imported prompts
3. **Extract:** Identify prompts and tools in pasted text

### Response Handling

The API may return responses wrapped in markdown code blocks:
```javascript
let json = response;
// Try to extract JSON if wrapped in markdown
if (typeof response === 'string' && response.includes('```json')) {
  const match = response.match(/```json\n([\s\S]*?)\n```/);
  if (match) json = match[1];
}
return JSON.parse(json);
```

## Key Functions

### Extension (`popup.js`)

```javascript
// Search prompts by text (semantic search via AI)
async function searchPromptsWithAI(query) { }

// Find AI tools matching a description
async function findToolsWithAI(description) { }

// Parse imported text and extract prompts/tools
async function importFromText(text) { }

// Save/delete prompts to storage
function savePrompt(prompt) { }
function deletePrompt(id) { }
```

### Web App (`webapp/index.html`)

```javascript
// Initialize IndexedDB
async function initDB() { }

// Load/save data
async function getAllPrompts() { }
async function savePrompt(prompt) { }

// Import/export
async function importJSON(json) { }
async function exportAsJSON() { }

// Search
async function search(query, useAI = false) { }
```

## Local Development Workflow

### 1. Install Extension

```bash
# In Chrome/Yandex/Edge:
# 1. Go to extensions page
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the extension/ folder
```

### 2. Test Content Script Injection

Open any supported AI website (ChatGPT, Claude, etc.) and look for:
- "Save Prompt" button in bottom-right corner
- Or right-click → "PromptKeeper: Save selection as prompt"

### 3. Test Web App

```bash
# Open in browser (file:// protocol works)
open webapp/index.html
# Or use a local HTTP server
python3 -m http.server 8000
# Then open http://localhost:8000/webapp/
```

### 4. Debug

**Extension debugging:**
- Open DevTools in popup: Right-click popup → "Inspect"
- Service worker console: Extension details page → "Service worker"
- Content script console: Regular page console (Ctrl+Shift+J)

**Web app debugging:**
- Standard browser DevTools (F12)
- IndexedDB available in Storage tab

### 5. Test Data

Use the pre-loaded JSON files:
- `extension/data/imported.json` — 115+ prompts
- `extension/data/ai-tools.json` — 240+ tools

Or create test data:
```json
{
  "prompts": [
    {
      "id": "test-1",
      "title": "Test Prompt",
      "content": "This is a test",
      "tags": ["test"],
      "created": 1234567890000
    }
  ],
  "tools": []
}
```

## Common Tasks

### Add Support for New AI Website

1. Update `manifest.json` content script matches:
```json
"matches": [
  "*://example-ai.com/*",
  // ... other sites
]
```

2. Update `content.js` to detect the chat interface:
```javascript
function detectChatContent() {
  // Find the last message or input area
  // Extract text content
  // Return { title, content }
}
```

### Add New AI Function

1. Create function in service worker that calls OpenRouter
2. Call from popup/webapp with `chrome.runtime.sendMessage()`
3. Handle JSON response and error cases
4. Update UI to display results

### Update Pre-loaded Data

1. Edit `extension/data/imported.json` or `ai-tools.json`
2. Ensure proper JSON format
3. Test import with web app
4. Web app will merge with existing data

## Performance Considerations

- **Content script** runs on every page visit → keep it lightweight
- **Service worker** persists between sessions → handle state carefully
- **Storage API** has limits (~10MB per extension) → compress if needed
- **OpenRouter API** has rate limits → add request deduplication

## Security Considerations

- **API Key:** Never expose in client-side code; keep in extension storage
- **CORS:** Use OpenRouter's `/api/` endpoint (they handle CORS)
- **CSP:** Extension has strict CSP; no `eval()`, no inline scripts
- **Storage:** IndexedDB has same-origin policy; web app can't access extension data

## Deployment

### For Chrome Web Store / Yandex Store:

1. Create a zip file:
```bash
cd extension
zip -r ../PromptKeeper-extension.zip .
```

2. Upload to store with required assets:
   - 128×128 icon
   - Screenshots
   - Description
   - Category (productivity, tools)

### For Distribution as Unpacked:

Include setup instructions in README pointing to:
1. Extension page (`browser://extensions/`)
2. Developer Mode
3. Load unpacked → select `extension/` folder

## Testing Checklist

- [ ] Saving prompts from different AI websites
- [ ] Search functionality (text + AI-powered)
- [ ] Import/export JSON
- [ ] Data persistence after browser restart
- [ ] Right-click context menu
- [ ] Extension options page
- [ ] Web app IndexedDB
- [ ] File import in web app
- [ ] API key validation
- [ ] Error handling for failed API requests

## Future Enhancements

Potential features to consider:
- Cloud sync (Firebase, Supabase)
- Sharing prompts with other users
- Prompt versioning and history
- Custom AI models via API selection
- Browser sync via extensions API
- Mobile web app version
- Keyboard shortcuts for quick save
- Prompt scheduling/reminders
- Advanced analytics on most-used prompts

## Getting Help

- Check existing code comments
- Review git history for context on changes
- Test with browser DevTools
- Consult OpenRouter API documentation
- Ask in Issues/Discussions
