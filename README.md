# WebCopilot - AI-Powered Web Assistant

<div align="center">

![WebCopilot](https://img.shields.io/badge/Chrome-Extension-blue?style=for-the-badge&logo=google-chrome)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=for-the-badge&logo=typescript)

**A production-ready Chrome extension that transforms web browsing with AI-powered page analysis, intelligent chat, and specialized job application features.**

[Features](#-features) • [Installation](#-installation) • [Architecture](#-architecture) • [Usage](#-usage)

</div>

---

## 🌟 Overview

WebCopilot is an intelligent AI assistant that lives in your browser, providing context-aware responses about any webpage you visit. Built with modern web technologies and powered by advanced AI models, it combines **Retrieval-Augmented Generation (RAG)** with a custom template system to deliver accurate, relevant insights.

### Why WebCopilot?

- 🎯 **Context-Aware Intelligence**: Uses RAG architecture for accurate, page-specific responses
- 🛠️ **Custom Template Engine**: Create and manage reusable AI prompts tailored to your workflow
- 💼 **Job Seeker Tools**: Specialized features for analyzing job postings and generating cover letters
- 🔒 **Privacy-First**: Local-first architecture with optional cloud sync
- ⚡ **Production-Ready**: Built with TypeScript, comprehensive error handling, and professional UX

---

## 🚀 Features

### Core Capabilities

#### 🤖 Intelligent AI Chat
- **Tab-Persistent Conversations**: Each tab maintains its own chat history across sessions
- **Context-Aware Responses**: AI understands the current page content automatically
- **Multi-Provider Support**: Works with OpenAI, Hugging Face, and local WASM models
- **Smart Cost Management**: Token estimation and cost warnings before expensive API calls
- **Response Caching**: Intelligent caching reduces API calls and improves response time

#### 📄 Advanced Page Extraction
- **Dual-Mode Extraction Pipeline**:
  - **JSON-LD Priority**: Extracts structured data from schema.org markup
  - **Readability Fallback**: Uses Mozilla Readability for clean content extraction
- **SPA Support**: MutationObserver tracks dynamic content changes on Single Page Applications
- **Retry Mechanism**: Manual retry with full page scrape for complex pages
- **Smart Chunking**: Automatically splits large pages for optimal AI processing

#### 🎨 Custom Template System
One of WebCopilot's standout features - a fully configurable prompt template engine:

- **Full CRUD Interface**: Create, read, update, and delete custom templates via settings page
- **Quick Access**: Templates appear in sidebar for one-click execution
- **Import/Export**: Share templates or backup your collection
- **Default Templates**: 5 pre-configured templates for common tasks:
  - Summarize Page
  - Extract Key Points
  - Explain Simply
  - Find Action Items
  - Analyze Pros & Cons

**Example Use Case**: Create a "Technical Analysis" template that automatically analyzes code documentation, extracts examples, and assesses difficulty level.

#### 💼 Job Application Intelligence

Specialized features for job seekers:

- **Job Posting Analyzer**: 
  - Extracts key requirements, qualifications, and responsibilities
  - Identifies visa sponsorship restrictions
  - Parses compensation and benefits information
  - Highlights must-have vs. nice-to-have skills

- **AI Cover Letter Generator**:
  - Creates tailored, professional cover letters (350 words)
  - Integrates with your resume data
  - Matches skills to job requirements
  - Generates PDF-ready formatted output

- **Interview Preparation**: Ask questions about company culture, role expectations, or technical requirements

### Professional UI/UX

#### 🎨 Modern Interface
- **Clean Design**: Built with TailwindCSS for a professional, corporate aesthetic
- **Dark/Light Themes**: Automatic theme detection with manual override
- **Responsive Layout**: Optimized for both popup (400x600) and expanded views
- **Smooth Animations**: Polished micro-interactions enhance user experience

#### ♿ Accessibility
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **High Contrast Mode**: Ensures readability for all users
- **Focus Management**: Clear visual indicators for focused elements

### Advanced Features

#### 💾 Storage & Sync
- **IndexedDB Storage**: Efficient local storage for large datasets
- **Semantic Search**: Vector-based search through processed page content
- **Optional Cloud Sync**: Supabase integration for cross-device synchronization
- **Data Export/Import**: Backup and restore your data in JSON format

#### 📤 File Generation
Export AI responses in multiple formats:
- **PDF**: Professional formatted documents via jsPDF
- **DOCX**: Microsoft Word compatible files
- **Markdown**: Development-friendly format
- **Plain Text**: Simple text files

#### 🖱️ Context Menu Integration
- Right-click any selected text on a webpage
- Send directly to WebCopilot for analysis
- Get instant AI insights without opening the full interface

---

## 🏗️ Architecture

### System Design

WebCopilot follows a modular, service-oriented architecture optimized for Chrome Extension Manifest V3.

### Core Components

#### 1. Background Service Worker
The central message router and orchestrator:
- **Message Handling**: Routes messages between popup, content scripts, and core libraries
- **State Management**: Maintains extension-wide state and tab-specific contexts
- **Tab Lifecycle**: Monitors tab events for cleanup and state synchronization
- **Context Menu**: Handles right-click integration
- **API Orchestration**: Coordinates between multiple services

#### 2. RAG System
Implements Retrieval-Augmented Generation for context-aware responses:

**Process Flow**:
1. **Ingestion**: Page content → Text chunks (500-1000 chars)
2. **Embedding**: Chunks → Vector embeddings (OpenAI text-embedding-3-small)
3. **Storage**: Vectors + metadata → IndexedDB
4. **Retrieval**: User query → Similarity search → Top K chunks
5. **Generation**: Relevant chunks + query → LLM → Response

**Benefits**:
- Handles pages larger than LLM context windows
- Reduces API costs by sending only relevant content
- Improves response accuracy with targeted context

#### 3. Page Extractor
Intelligent content extraction with multiple strategies:

**Extraction Pipeline**:
- **Strategy 1**: JSON-LD Structured Data
- **Strategy 2**: Mozilla Readability
- **Strategy 3**: Full DOM Scrape

**Special Handling**:
- **Job Postings**: Extracts requirements, qualifications, compensation, visa info
- **Articles**: Title, author, publish date, main content
- **Products**: Name, price, description, reviews
- **Generic Pages**: Cleaned text with metadata

#### 4. LLM Client
Unified interface for multiple AI providers:

**Supported Providers**:
- **OpenAI**: GPT-4, GPT-3.5-turbo with streaming
- **Hugging Face**: Open-source models via Inference API
- **Local Models**: WASM-based models for privacy

#### 5. Template Manager
Manages custom prompt templates with full CRUD operations, import/export functionality, and persistent storage.

#### 6. Embeddings Manager
Handles vector embeddings for semantic search with cosine similarity calculations and batch processing.

#### 7. Storage Manager
IndexedDB wrapper for page content, chat history, embeddings, and vector search.

#### 8. Tab Chat Manager
Manages per-tab conversation state with message history and automatic cleanup.

---

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern UI with hooks and functional components
- **TypeScript 5.2**: Type-safe code with strict mode enabled
- **TailwindCSS 3.3**: Utility-first CSS framework
- **React Markdown**: Render AI responses with markdown support
- **React Syntax Highlighter**: Code block syntax highlighting

### Build & Development
- **Webpack 5**: Module bundling with code splitting
- **PostCSS**: CSS processing with autoprefixer
- **Babel**: JavaScript transpilation
- **ts-loader**: TypeScript compilation for Webpack

### Chrome Extension APIs
- **Manifest V3**: Latest extension platform
- **Service Workers**: Background processing
- **Content Scripts**: Page injection and DOM access
- **Chrome Storage API**: Secure settings storage
- **Context Menus API**: Right-click integration
- **Scripting API**: Dynamic script injection

### AI & Data
- **OpenAI API**: GPT models and embeddings
- **@supabase/supabase-js**: Optional cloud sync
- **idb**: IndexedDB wrapper for local storage
- **@mozilla/readability**: Content extraction

### Document Generation
- **jsPDF**: PDF generation
- **docx**: DOCX file creation
- **mammoth**: DOCX parsing
- **pdfjs-dist**: PDF parsing

### Testing & Quality
- **Jest**: Unit testing framework
- **Playwright**: End-to-end testing
- **ESLint**: Code linting with TypeScript rules
- **Prettier**: Code formatting
- **TypeScript**: Compile-time type checking

---

## 📦 Installation

### Prerequisites
- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js
- **Chrome Browser**: Version 88 or higher
- **OpenAI API Key**: (Optional, for AI features)

### Local Development Setup

Clone the repository, install dependencies, build the extension, and load it in Chrome:

1. Clone and install
2. Run `npm install`
3. Build with `npm run dev` (development) or `npm run build` (production)
4. Load unpacked extension in Chrome from the `dist` folder
5. Configure API keys in extension settings

---

## 🎯 Usage

### Basic Workflow

1. **Navigate to Any Webpage** - Open any website you want to analyze
2. **Open WebCopilot** - Click the extension icon in Chrome toolbar
3. **Ask Questions** - AI responds with context from the current page
4. **Use Templates** - Click sidebar to access custom prompt templates

### Job Seeker Workflow

**Analyzing Job Postings:**
- Open job posting → Click WebCopilot → Ask about requirements

**Generating Cover Letters:**
- Use "Generate Cover Letter" template → Export as PDF/DOCX

**Interview Preparation:**
- Ask about company culture, tech stack, or role details

### Creating Custom Templates

Navigate to Settings → Templates Tab → Add new template with title, description, and prompt. Templates appear in sidebar for one-click execution.

### Advanced Features

- **Context Menu**: Right-click selected text → Send to WebCopilot
- **Export Responses**: Download as PDF, DOCX, Markdown, or Text
- **Data Management**: Backup and restore templates and chat history

---

## ⚙️ Configuration

### Settings Overview

Access via extension popup → Options (⚙️ icon)

- **General Settings**: Theme, language, model selection, token limits
- **AI Configuration**: OpenAI API key, model selection, temperature
- **Storage Settings**: Optional Supabase cloud sync
- **Template Management**: Create, edit, import/export templates
- **Advanced Settings**: Debug mode, performance, privacy controls

### API Key Setup

**OpenAI**: Get API key from [OpenAI Platform](https://platform.openai.com/api-keys) and add to extension settings.

**Supabase** (Optional): Create project at [Supabase](https://supabase.com) for cloud sync.

---

## 🤝 Contributing

Contributions welcome! Fork the repository, create a feature branch, make changes, and submit a pull request.

### Development Setup
1. Fork and clone the repository
2. Create feature branch
3. Follow TypeScript best practices
4. Add tests and update documentation
5. Follow Conventional Commits format

### Areas for Contribution
- Multi-language support
- Voice input/output
- Analytics dashboard
- Additional LLM providers
- UI/UX improvements
- Documentation and examples
- Bug fixes

---

## 🆘 Support & Resources

### Community
- **Issues**: [GitHub Issues](https://github.com/sreerammelpadi/WebJarvis/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sreerammelpadi/WebJarvis/discussions)

### Troubleshooting

**Extension Not Loading?**
- Check Chrome version (requires 88+)
- Verify manifest.json syntax
- Check browser console for errors

**API Calls Failing?**
- Verify API key is correct
- Check API key permissions
- Ensure sufficient API credits

**Content Not Extracting?**
- Page may block content scripts
- Try refreshing the page
- Use manual retry option

---

**WebCopilot** - Making the web more intelligent, one page at a time. 🚀
