# WebCopilot - AI Web Assistant

A production-ready Chrome extension that serves as an intelligent AI copilot for any webpage. WebCopilot provides professional chat UI, intelligent page analysis, and powerful AI-powered features for web content understanding and interaction.

## 🚀 Features

### Core Functionality
- **Intelligent Page Extraction**: Automatically extracts and processes page content using JSON-LD structured data and Readability fallback
- **AI-Powered Chat**: Interactive chat interface for asking questions about page content
- **Context-Aware Responses**: Uses RAG (Retrieval-Augmented Generation) for intelligent, contextual answers
- **Memory System**: Stores and retrieves page content chunks with semantic search capabilities

### Professional UI
- **Clean, Modern Design**: Built with TailwindCSS for a professional, corporate aesthetic
- **Responsive Layout**: Optimized for both popup and full-page usage
- **Dark/Light Theme**: Automatic theme switching with manual override options
- **Accessibility**: Keyboard navigation, screen reader support, and high contrast mode

### AI Integration
- **Multiple Providers**: Support for OpenAI, Hugging Face, and local WASM models
- **Cost Control**: Token estimation and cost warnings before API calls
- **Local Processing**: Option to run lightweight tasks locally for privacy
- **Smart Caching**: Intelligent caching of responses and embeddings

### Advanced Features
- **Context Menu Integration**: Right-click to send selected text to WebCopilot
- **File Generation**: Export responses as PDF, DOCX, Markdown, or plain text
- **Prompt Templates**: Customizable templates for common tasks
- **SPA Support**: MutationObserver for dynamic content changes
- **Cross-Device Sync**: Optional Supabase integration for cloud storage

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Storage**: IndexedDB with idb wrapper
- **AI**: OpenAI API, Hugging Face, Local WASM models
- **Build**: Webpack 5 + PostCSS
- **Testing**: Jest + Playwright
- **Linting**: ESLint + Prettier

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Chrome browser
- OpenAI API key (optional, for cloud features)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/webcopilot.git
   cd webcopilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder from the project

### Development Mode

For development with auto-rebuild:
```bash
npm run dev
```

## 🔧 Configuration

### API Keys Setup

1. **OpenAI API Key**
   - Get your key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Add it in the extension options page
   - Used for GPT models and embeddings

2. **Supabase (Optional)**
   - Create a project at [Supabase](https://supabase.com)
   - Add URL and API key in options for cloud storage

### Settings

Access settings via the extension popup or `chrome://extensions/webcopilot/options`:

- **General**: Theme, language, token limits, cost thresholds
- **AI**: Model selection, API keys, local model options
- **Storage**: Cloud sync, data export/import
- **Templates**: Custom prompt templates
- **Advanced**: Debug mode, performance settings

## 📱 Usage

### Basic Usage

1. **Navigate to any webpage**
2. **Click the WebCopilot extension icon**
3. **Ask questions about the page content**
4. **Use quick actions for common tasks**

### Quick Actions

- **📝 Summarize Page**: Get concise page summaries
- **💼 Extract Job Details**: Parse job postings for key information
- **✉️ Generate Cover Letter**: Create tailored cover letters
- **🔍 Context Search**: Find specific information on the page

### Advanced Features

- **Right-click Selection**: Select text and right-click to send to WebCopilot
- **File Export**: Download responses in various formats
- **Template System**: Use and customize prompt templates
- **Memory Search**: Search through previously processed pages

## 🏗️ Architecture

### File Structure
```
src/
├── lib/                 # Core libraries
│   ├── page-extractor.ts    # Page content extraction
│   ├── embeddings.ts        # AI embeddings management
│   ├── rag.ts              # RAG system
│   ├── storage.ts          # IndexedDB storage
│   └── llm-client.ts       # AI model clients
├── types/               # TypeScript definitions
├── background.ts        # Service worker
├── content-script.ts    # Page injection script
├── popup.tsx           # Main UI
└── options.tsx         # Settings page
```

### Key Components

- **PageExtractor**: Intelligent content extraction with JSON-LD priority
- **EmbeddingsManager**: Handles text embeddings for semantic search
- **RAGSystem**: Retrieval-augmented generation for context-aware responses
- **StorageManager**: IndexedDB wrapper for local data storage
- **LLMClient**: Unified interface for multiple AI providers

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Code Quality
```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
npm run format        # Format code
npm run type-check    # TypeScript validation
```

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Publishing to Chrome Web Store

1. **Build the extension**
   ```bash
   npm run build
   ```

2. **Create a ZIP file**
   - Zip the contents of the `dist` folder
   - Ensure `manifest.json` is at the root

3. **Upload to Chrome Web Store**
   - Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Create new item
   - Upload the ZIP file
   - Fill in store listing details
   - Submit for review

### Manual Installation

For users who prefer manual installation:
1. Download the release ZIP
2. Extract to a folder
3. Load as unpacked extension in Chrome

## 🔒 Privacy & Security

- **Local-First**: All data is stored locally by default
- **No Data Collection**: We don't collect or store your data
- **API Key Security**: API keys are stored only in Chrome's secure storage
- **Optional Cloud**: Cloud features are opt-in and clearly labeled
- **Transparent Processing**: Clear indication of what data is sent to external services

## 🎯 Use Cases

### Job Seekers
- Extract key requirements from job postings
- Generate tailored cover letters
- Analyze company information
- Prepare for interviews

### Researchers
- Summarize long articles
- Extract key points from research papers
- Compare multiple sources
- Generate research summaries

### Content Creators
- Analyze competitor content
- Extract key insights from articles
- Generate content outlines
- Research topics efficiently

### Business Users
- Analyze market research
- Extract business intelligence
- Generate reports from web content
- Monitor industry trends

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Style
- Follow TypeScript best practices
- Use ESLint and Prettier
- Write comprehensive tests
- Document new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [User Guide](docs/user-guide.md)
- [Developer Guide](docs/developer-guide.md)
- [API Reference](docs/api-reference.md)

### Community
- [GitHub Issues](https://github.com/yourusername/webcopilot/issues)
- [Discussions](https://github.com/yourusername/webcopilot/discussions)
- [Wiki](https://github.com/yourusername/webcopilot/wiki)

### Troubleshooting

Common issues and solutions:

1. **Extension not loading**
   - Check Chrome version (requires 88+)
   - Verify manifest.json syntax
   - Check browser console for errors

2. **API calls failing**
   - Verify API key is correct
   - Check API key permissions
   - Ensure internet connection

3. **Content not extracting**
   - Page may be using heavy JavaScript
   - Try refreshing the page
   - Check if page has anti-bot protection

## 🔮 Roadmap

### Upcoming Features
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] Mobile app companion

### Long-term Vision
- [ ] Cross-browser support
- [ ] Desktop application
- [ ] Enterprise features
- [ ] AI model fine-tuning
- [ ] Plugin ecosystem

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) for AI models
- [TailwindCSS](https://tailwindcss.com) for styling
- [Chrome Extensions](https://developer.chrome.com/docs/extensions/) team
- [Mozilla Readability](https://github.com/mozilla/readability) for content extraction

---

**WebCopilot** - Making the web more intelligent, one page at a time. 🚀 