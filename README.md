# PromptKeeper

Browser extension + local web app for saving, organizing, and searching prompts with AI-powered features.

**Key Features:**
- 💾 Save prompts from 15+ AI services (ChatGPT, Claude, Gemini, DeepSeek, Grok, and more)
- 🤖 AI-powered semantic search using Llama 3.3 70B
- 📚 Pre-loaded database of 115+ prompts and 240+ AI tools
- 🔍 Intelligent prompt categorization and deduplication
- 📤 Import/export JSON for backup and sync
- 🌐 Completely local (browser IndexedDB) — no account required
- 🆓 Free tier with generous rate limits

---

## Quick Start

### Option 1: Browser Extension (Recommended)

**For Yandex Browser, Chrome, or Edge:**

1. Clone or download this repository
2. Open your browser's extension page:
   - **Yandex Browser:** `browser://extensions/`
   - **Chrome:** `chrome://extensions/`
   - **Edge:** `edge://extensions/`
3. Enable **Developer Mode** (toggle in the top right)
4. Click **"Load unpacked"** and select the `extension/` folder
5. The PromptKeeper icon will appear in your extension panel

**Configure API Access (Free):**

1. Visit **https://openrouter.ai/keys** and sign up (Google login, no credit card required)
2. Click **"Create Key"** and copy your API key (starts with `sk-or-v1-...`)
3. Right-click the PromptKeeper icon → **Options** → paste your key → **Save**

> **Model:** Free tier uses `meta-llama/llama-3.3-70b-instruct` — excellent Russian language support, generous rate limits

**Using the Extension:**

- **Save prompts:** On ChatGPT, Claude, Gemini, etc., click the **"💾 Save Prompt"** button (bottom right) or use context menu
- **Browse & search:** Click the extension icon for:
  - **Prompts tab:** Browse, search, edit, delete
  - **AI Tools tab:** Pre-loaded database of 240+ AI services
  - **Import tab:** Paste Telegram chat exports or JSON to auto-import

### Option 2: Web Application

Simply open `webapp/index.html` in your browser. It uses the same local IndexedDB storage.

**First time setup:**
1. Click ⚙️ (settings) → add your OpenRouter API key
2. Manage prompts and AI tools locally
3. Import/export JSON to sync with the browser extension

---

## Project Structure

```
PromptKeeper/
├── extension/
│   ├── manifest.json       # V3 extension configuration
│   ├── background.js       # Service worker
│   ├── popup.html/css/js   # Extension popup UI
│   ├── content.js/css      # Injected into AI service websites
│   ├── options.html        # Settings page
│   ├── icons/              # Extension icons
│   └── data/
│       ├── ai-tools.json   # Pre-loaded AI tools database
│       └── imported.json   # Pre-loaded prompts
└── webapp/
    ├── index.html          # Complete single-file web app
    └── imported.json       # Same data as extension
```

---

## Architecture

### Browser Extension (Manifest V3)
- **Service Worker:** Handles storage, message routing, and context menus
- **Content Scripts:** Inject "Save Prompt" button into supported AI websites
- **Popup UI:** Three-tab interface for browsing, searching, and importing
- **Storage:** Chrome storage API + IndexedDB for persistent data

### Web App
- **Single HTML file:** Includes all CSS and JavaScript
- **IndexedDB:** Local browser database for offline access
- **File System Access API:** Can read/write JSON for import/export
- **OpenRouter API:** Semantic search via Llama 3.3 70B

### Data Flow
```
AI Website → Content Script → Service Worker → IndexedDB
                                    ↓
                            OpenRouter API
                             (AI Functions)
                                    ↓
                        Popup UI / Web App
```

---

## Supported AI Services

The extension automatically detects and works with:
- ChatGPT (chat.openai.com, chatgpt.com)
- Claude (claude.ai)
- Gemini (gemini.google.com, aistudio.google.com)
- Grok (grok.com)
- Mistral (chat.mistral.ai)
- DeepSeek (chat.deepseek.com)
- Qwen (chat.qwenlm.ai)
- Baidu (yiyan.baidu.com)
- You.com
- Perplexity
- Poe
- Copilot (copilot.microsoft.com)
- Hugging Face Chat

---

## Features Explained

### 🤖 AI-Powered Search
Type any question or description → Llama 3.3 finds semantically similar prompts in your database

### 📝 Smart Prompt Import
Paste Telegram chat exports or article text → AI automatically extracts prompts and AI tools, removing metadata and noise

### 🔄 Sync Between Extension & Web App
1. In extension popup → **Import** → **Export entire database**
2. In web app → **Import JSON** → upload the exported file

### 🏷️ Auto-Categorization
Prompts automatically get titles extracted from their content. URLs in prompts are clickable.

---

## API & Rate Limits

**OpenRouter Free Tier:**
- Model: `meta-llama/llama-3.3-70b-instruct:free`
- Rate limit: Varies by time of day
- Cost: Free
- Request latency: ~2-5 seconds
- No credit card required

For higher rate limits or paid models, update `callOpenRouter()` in the code and choose a different model.

---

## Development

### Extension Development
- Edit files in `extension/`
- Changes to service worker require re-loading the extension (refresh in `chrome://extensions/`)
- Changes to popup UI or content script take effect on page reload

### Webapp Development
- Single file: `webapp/index.html`
- Open in browser with `file://` protocol or local HTTP server
- Data persists in browser's IndexedDB
- Export JSON to backup your database

### Build & Deploy
For distribution:
1. Create a zip of the `extension/` folder
2. Submit to Chrome Web Store or similar
3. Or distribute as unpacked extension with instructions

---

## Privacy & Security

- ✅ **No server storage:** All prompts and tools stored locally in your browser
- ✅ **API key kept local:** Never sent to servers (only to OpenRouter for AI requests)
- ✅ **No tracking:** No analytics or telemetry
- ✅ **Open source:** Full transparency on what the code does
- ⚠️ **Browser security:** Extension has access to all websites you visit (required for injection), but only reads/writes to IndexedDB

---

## Pre-loaded Data

### 115+ Prompts
- Organized by use case and AI service
- Extracted from real Telegram chat exports
- Ready to use or customize

### 240+ AI Tools
- Collected from desktop shortcuts and web scrapers
- Includes all major AI services and emerging models
- Useful for the AI Tools database

Both databases can be updated by importing new JSON files or adding entries manually.

---

## Troubleshooting

**Q: Extension doesn't appear in my browser**
- Check if it's enabled in `chrome://extensions/` (or `browser://extensions/` in Yandex)
- Try reloading the extension page

**Q: "API key not set" error**
- Open extension options (right-click icon → Options)
- Paste your OpenRouter API key and save
- Ensure key starts with `sk-or-v1-`

**Q: AI search not working**
- Check that your API key is valid at https://openrouter.ai/
- Try a simpler search query
- Check browser console for error messages

**Q: Can't import JSON file in web app**
- Ensure the JSON format matches `data/imported.json`
- Try exporting from the extension first to get valid format

**Q: Prompts not syncing between extension and web app**
- They use separate databases (IndexedDB isolation)
- Use Export/Import JSON to manually sync
- Or use the **"Load database from extension"** button in web app (if in same directory)

---

## License

MIT License — See LICENSE file for details

---

## Contributing

Found a bug or have an improvement? Feel free to:
1. Open an issue with details and steps to reproduce
2. Submit a pull request with your enhancement
3. Suggest new AI tools or prompts to include

---

## Made with

- **Manifest V3** — Modern browser extension standard
- **IndexedDB** — Offline-capable local storage
- **OpenRouter API** — Free access to 100+ AI models
- **Apple Design System** — Clean, intuitive UI
- **Vanilla JS** — No frameworks, lightweight and fast

Enjoy saving and discovering prompts! 🚀
