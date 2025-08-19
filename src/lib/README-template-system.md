# Configurable Template System

This document explains how WebCopilot's configurable template system works, allowing users to create and manage custom prompt templates through the options page.

## Overview

The template system provides:
- **Configurable Templates**: Create custom prompt templates with titles and descriptions
- **Options Page Management**: Full CRUD operations for templates in the settings
- **LeftNav Integration**: Templates appear in the sidebar for quick access
- **Default Templates**: Pre-configured templates for common tasks
- **Persistent Storage**: Templates are saved locally and persist across sessions

## Architecture

### Core Components

1. **TemplateManager** (`src/lib/template-manager.ts`)
   - Handles all template CRUD operations
   - Manages storage and retrieval
   - Provides default templates
   - Handles import/export functionality

2. **Updated PromptTemplate Interface** (`src/types/index.ts`)
   - Simplified structure with `title`, `prompt`, `description`
   - Removed complex category and placeholder system
   - Focus on simplicity and user-friendliness

3. **LeftNav Component** (`src/components/LeftNav.tsx`)
   - Shows only Templates section (Memory toggle and Quick Actions removed)
   - Loads templates dynamically from storage
   - Allows direct insertion of templates into chat

4. **Options Page** (`src/options.tsx`)
   - Full template management UI
   - Add, edit, delete templates
   - Reset to defaults functionality
   - Clean, modern interface

## Template Structure

```typescript
interface PromptTemplate {
  id: string;           // Unique identifier
  title: string;        // Display name in LeftNav
  prompt: string;       // The actual prompt sent to AI
  description?: string; // Optional description for clarity
  isDefault: boolean;   // Whether it's a default template
  createdAt: number;    // Creation timestamp
  updatedAt: number;    // Last update timestamp
}
```

## Default Templates

The system comes with 5 pre-configured templates:

1. **Summarize Page**
   - Creates a brief summary of page content
   - Prompt: "Please provide a concise summary of this page in 3-4 bullet points..."

2. **Extract Key Points**
   - Identifies important information as numbered list
   - Prompt: "Extract the most important key points from this page..."

3. **Explain Simply**
   - Simplifies complex content for easy understanding
   - Prompt: "Explain the content of this page in simple terms..."

4. **Find Action Items**
   - Identifies actionable tasks and next steps
   - Prompt: "Identify any action items, next steps, or tasks mentioned..."

5. **Analyze Pros & Cons**
   - Provides balanced analysis of positive and negative aspects
   - Prompt: "Analyze this content and provide a balanced view of pros and cons..."

## How It Works

### Template Creation
1. User goes to Options page → Templates tab
2. Fills out "Add New Template" form with title, description, and prompt
3. Clicks "Add Template" to save
4. Template immediately appears in LeftNav

### Template Usage
1. User opens extension popup
2. Clicks sidebar toggle to show LeftNav
3. Clicks on any template in the Templates section
4. Template's prompt is automatically sent to AI with current page context

### Template Management
1. **Edit**: Click edit icon next to template in Options page
2. **Delete**: Click delete icon (only for custom templates)
3. **Reset**: Use "Reset to Defaults" to restore original templates

## Storage

Templates are stored using Chrome's local storage:
- **Storage Key**: `'promptTemplates'`
- **Format**: Array of PromptTemplate objects
- **Persistence**: Survives browser restarts and extension updates
- **Sync**: No cloud sync (local only for privacy)

## API Reference

### TemplateManager Methods

```typescript
// Get all templates
static async getTemplates(): Promise<PromptTemplate[]>

// Add new template
static async addTemplate(title: string, prompt: string, description?: string): Promise<PromptTemplate>

// Update existing template
static async updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<void>

// Delete template (custom only)
static async deleteTemplate(id: string): Promise<void>

// Get single template
static async getTemplate(id: string): Promise<PromptTemplate | null>

// Reset to defaults
static async resetToDefaults(): Promise<void>

// Export/Import
static async exportTemplates(): Promise<string>
static async importTemplates(jsonData: string, replace?: boolean): Promise<void>
```

### LeftNav Integration

The LeftNav component automatically:
- Loads templates on mount using `TemplateManager.getTemplates()`
- Displays templates with their titles and descriptions
- Handles template clicks by calling `onQuickAction(template.prompt, context)`
- Shows appropriate empty state when no templates exist

## User Interface

### Options Page - Templates Tab

**Add New Template Section:**
- Title input field (required)
- Description input field (optional)
- Prompt textarea (required)
- "Add Template" button

**Existing Templates Section:**
- List of all templates with titles, descriptions, and prompts
- Edit/Delete buttons for each template
- "Default" badge for built-in templates
- "Reset to Defaults" button

**Template Editing:**
- Inline editing with Save/Cancel buttons
- All fields editable except for default status
- Real-time updates

### LeftNav - Templates Section

**Clean Interface:**
- Only Templates section visible (Memory toggle and Quick Actions removed)
- Template titles as clickable buttons
- Descriptions shown on hover
- Visual indicators (dots) for better UX
- Empty state with helpful message

## Benefits

1. **User Customization**
   - Create templates for specific workflows
   - Tailor prompts to personal or professional needs
   - Build library of reusable prompts

2. **Improved Productivity**
   - Quick access to common tasks
   - No need to retype similar prompts
   - Consistent prompt quality

3. **Clean Interface**
   - Simplified LeftNav with focus on templates
   - Removed clutter from unused features
   - Better space utilization

4. **Flexibility**
   - Edit templates as needs change
   - Import/export for sharing or backup
   - Reset to defaults when needed

## Usage Examples

### Creating a Custom Template

**Title**: "Technical Analysis"
**Description**: "Analyze technical content for developers"
**Prompt**: "Analyze this technical content and provide: 1) Main concepts explained, 2) Code examples if any, 3) Key takeaways for developers, 4) Difficulty level assessment"

### Using Templates

1. Open extension on a technical blog post
2. Click sidebar to show templates
3. Click "Technical Analysis" template
4. AI analyzes the page using the custom prompt
5. Get structured technical analysis

## Migration from Old System

The new system is a complete replacement:
- ✅ **Removed**: Complex category system
- ✅ **Removed**: Placeholder replacement logic  
- ✅ **Removed**: Quick Actions hardcoded prompts
- ✅ **Removed**: Memory toggle (unused feature)
- ✅ **Added**: Simple title + prompt structure
- ✅ **Added**: Full template management UI
- ✅ **Added**: Better default templates

## Future Enhancements

Possible future improvements:
- Template sharing between users
- Template categories/tags for organization
- Template usage statistics
- Import templates from community library
- Template variables/placeholders (if needed)
- Cloud sync for templates across devices
