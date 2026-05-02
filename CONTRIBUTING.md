# Contributing to PromptKeeper

Thank you for your interest in contributing! This guide will help you get started.

## How to Contribute

### Reporting Bugs
1. Check if the bug has already been reported in Issues
2. Provide a clear description with steps to reproduce
3. Include browser version, OS, and any error messages
4. Attach screenshots if relevant

### Suggesting Features
1. Describe the feature and why it would be useful
2. Provide examples of how it would work
3. Discuss any potential trade-offs or challenges

### Submitting Code

1. **Fork the repository**
   ```bash
   git clone https://github.com/pilotsemenovk/PromptKeeper.git
   cd PromptKeeper
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Edit extension files in `extension/` or web app in `webapp/`
   - Test thoroughly before submitting
   - Keep commits focused and descriptive

4. **Test your changes**
   - Load the extension in your browser (`chrome://extensions/`)
   - Test the web app
   - Verify data import/export works
   - Test with different AI services

5. **Commit and push**
   ```bash
   git add .
   git commit -m "Add: brief description of changes"
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Describe what you changed and why
   - Reference any related issues
   - Wait for review and be responsive to feedback

## Code Style Guidelines

- Use `const` and `let` (avoid `var`)
- Use descriptive function names: `callOpenRouter()`, `parsePromptText()`
- Keep functions focused and under 50 lines when possible
- Add comments only for "why" (non-obvious logic), not "what"
- Use semicolons consistently
- Indent with 2 spaces

## Architecture Notes

### Extension (Manifest V3)
- **Service Worker** (`background.js`): Handles all background operations, storage, messaging
- **Content Scripts** (`content.js`): Injected into AI websites, lightweight and fast
- **Popup** (`popup.html/js`): Main UI with three tabs (Prompts, Tools, Import)
- **Options** (`options.html`): Settings page for API key

### Web App (`webapp/index.html`)
- Single-file app with inline CSS and JavaScript
- Uses IndexedDB for data persistence
- Can import/export JSON for sync with extension

## Data Format

Both extension and web app use the same data format:

**Prompts:**
```json
{
  "id": "unique-id",
  "title": "Prompt title",
  "content": "Full prompt text here...",
  "tags": ["tag1", "tag2"],
  "created": 1234567890000
}
```

**Tools:**
```json
{
  "id": "unique-id",
  "name": "AI Tool Name",
  "url": "https://example.com",
  "description": "What this tool does",
  "tags": ["category", "feature"]
}
```

## Testing

Before submitting a PR:
1. Test saving prompts from different AI services
2. Test search functionality (both text and AI-powered)
3. Test import/export with sample data
4. Verify that prompts and tools persist after browser restart
5. Test the context menu (right-click) functionality

## Need Help?

- Check existing Issues and Discussions
- Look at the README for feature explanations
- Review the code comments for implementation details
- Test locally to understand how features work

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Happy coding! 🚀
