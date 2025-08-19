# Model Configuration System

This document explains how to add new AI models to WebCopilot using the centralized model configuration system.

## Overview

The model configuration system is designed to handle different API parameters and requirements across various AI models. All model-specific configurations are centralized in `src/lib/model-config.ts`.

## Adding a New Model

To add a new model, follow these steps:

### 1. Update Type Definitions

First, add the model to the `UserSettings.defaultModel` union type in `src/types/index.ts`:

```typescript
export interface UserSettings {
  // ... other properties
  defaultModel: 'gpt-4o-mini' | 'gpt-3.5-turbo' | 'gpt-5-mini' | 'o4-mini' | 'your-new-model' | 'local-wasm';
  // ... other properties
}
```

### 2. Add Model Configuration

Add the model configuration to the `MODEL_CONFIGS` object in `src/lib/model-config.ts`:

```typescript
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // ... existing models
  'your-new-model': {
    apiModelName: 'actual-api-model-name', // The name to send to the API
    useMaxCompletionTokens: false, // true if model uses max_completion_tokens instead of max_tokens
    defaultTemperature: 0.7,
    maxTokensSupported: 128000, // Maximum tokens this model supports
    inputCostPer1K: 0.0001, // Cost per 1K input tokens in USD
    outputCostPer1K: 0.0004, // Cost per 1K output tokens in USD
    supportsSystemMessages: true, // Whether model supports system messages
    additionalParams: { // Optional: any additional API parameters
      // example: 'special_param': 'value'
    }
  },
  // ... other models
};
```

### 3. Add Display Information

Add the model to the display information in the `getModelDisplayInfo()` function:

```typescript
export function getModelDisplayInfo(): ModelDisplayInfo[] {
  return [
    // ... existing models
    {
      name: 'your-new-model',
      displayName: 'Your New Model',
      description: 'Description for UI',
      maxTokens: MODEL_CONFIGS['your-new-model'].maxTokensSupported,
      costInfo: `$${MODEL_CONFIGS['your-new-model'].inputCostPer1K}/1K input tokens`,
    },
    // ... other models
  ];
}
```

### 4. Update Default Settings (Optional)

If you want to change the default model, update the `defaultSettings` objects in:
- `src/options.tsx`
- `src/hooks/useExtensionState.ts`
- `src/background.ts` (in `initializeDefaultSettings`)

## Model Configuration Properties

### Required Properties

- `apiModelName`: The actual model name to send to the OpenAI API
- `useMaxCompletionTokens`: Whether to use `max_completion_tokens` instead of `max_tokens`
- `defaultTemperature`: Default temperature for the model (0.0 to 1.0)
- `maxTokensSupported`: Maximum tokens the model can handle
- `inputCostPer1K`: Cost per 1000 input tokens in USD
- `outputCostPer1K`: Cost per 1000 output tokens in USD
- `supportsSystemMessages`: Whether the model supports system messages

### Optional Properties

- `additionalParams`: Any additional parameters to include in API requests

## API Parameter Handling

The system automatically handles different API parameter requirements:

### Standard Models (GPT-4o-mini, GPT-3.5-turbo, etc.)
- Uses `max_tokens` parameter
- Standard OpenAI API format

### Special Models (O4-mini, etc.)
- Uses `max_completion_tokens` parameter instead of `max_tokens`
- Automatically handled by setting `useMaxCompletionTokens: true`

## Cost Estimation

The system provides accurate cost estimation based on the model configuration:

```typescript
const cost = estimateModelCost('model-name', inputTokens, outputTokens);
```

## Example: Adding GPT-4 Turbo

```typescript
// 1. Add to types/index.ts
defaultModel: 'gpt-4o-mini' | 'gpt-4-turbo' | ... | 'local-wasm';

// 2. Add to model-config.ts
'gpt-4-turbo': {
  apiModelName: 'gpt-4-turbo-preview',
  useMaxCompletionTokens: false,
  defaultTemperature: 0.7,
  maxTokensSupported: 128000,
  inputCostPer1K: 0.01,
  outputCostPer1K: 0.03,
  supportsSystemMessages: true,
},

// 3. Add to display info
{
  name: 'gpt-4-turbo',
  displayName: 'GPT-4 Turbo',
  description: 'Most capable model, higher cost',
  maxTokens: 128000,
  costInfo: '$0.01/1K input tokens',
},
```

## Error Handling

The system includes fallback handling:
- If an unknown model is requested, it falls back to GPT-4o-mini configuration
- Warnings are logged for unknown models
- Model validation is available via `isModelSupported(modelName)`

## Testing New Models

After adding a new model:
1. Build the extension: `npm run build`
2. Load the extension in Chrome
3. Go to Settings → AI Models
4. Select your new model from the dropdown
5. Test with a simple query to ensure API parameters are correct

## Troubleshooting

### Common Issues

1. **"Unsupported parameter" errors**: Check if the model requires `max_completion_tokens` instead of `max_tokens`
2. **"Model not found" errors**: Verify the `apiModelName` matches the actual API model name
3. **Cost estimation errors**: Ensure `inputCostPer1K` and `outputCostPer1K` are set correctly

### Debug Logging

The system includes logging for model configuration:
- Check browser console for model configuration warnings
- Background script logs show which model and parameters are being used
