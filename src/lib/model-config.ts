/**
 * Model configuration system for handling different API parameters
 * across various OpenAI models and providers
 */

export interface ModelConfig {
  /** The actual model name to send to the API */
  apiModelName: string;
  /** Whether to use max_tokens or max_completion_tokens */
  useMaxCompletionTokens: boolean;
  /** Default temperature for this model */
  defaultTemperature: number;
  /** Maximum tokens supported by this model */
  maxTokensSupported: number;
  /** Cost per 1K input tokens (USD) */
  inputCostPer1K: number;
  /** Cost per 1K output tokens (USD) */
  outputCostPer1K: number;
  /** Whether this model supports system messages */
  supportsSystemMessages: boolean;
  /** Additional model-specific parameters */
  additionalParams?: Record<string, any>;
}

/**
 * Configuration for all supported models
 * Add new models here with their specific API requirements
 */
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'gpt-4o-mini': {
    apiModelName: 'gpt-4o-mini',
    useMaxCompletionTokens: false,
    defaultTemperature: 0.7,
    maxTokensSupported: 128000,
    inputCostPer1K: 0.00015,
    outputCostPer1K: 0.0006,
    supportsSystemMessages: true,
  },
  'gpt-3.5-turbo': {
    apiModelName: 'gpt-3.5-turbo',
    useMaxCompletionTokens: false,
    defaultTemperature: 0.7,
    maxTokensSupported: 16385,
    inputCostPer1K: 0.0015,
    outputCostPer1K: 0.002,
    supportsSystemMessages: true,
  },
  'gpt-5-mini': {
    apiModelName: 'gpt-5-mini',
    useMaxCompletionTokens: true,
    defaultTemperature: 1,
    maxTokensSupported: 128000,
    inputCostPer1K: 0.0001, // Estimated
    outputCostPer1K: 0.0004, // Estimated
    supportsSystemMessages: true,
  },
  'o4-mini': {
    apiModelName: 'o4-mini',
    useMaxCompletionTokens: true, // This model requires max_completion_tokens
    defaultTemperature: 1,
    maxTokensSupported: 65536,
    inputCostPer1K: 0.0002, // Estimated
    outputCostPer1K: 0.0008, // Estimated
    supportsSystemMessages: true,
  },
  'local-wasm': {
    apiModelName: 'local-wasm',
    useMaxCompletionTokens: false,
    defaultTemperature: 0.7,
    maxTokensSupported: 4096,
    inputCostPer1K: 0,
    outputCostPer1K: 0,
    supportsSystemMessages: true,
  },
};

/**
 * Get configuration for a specific model
 */
export function getModelConfig(modelName: string): ModelConfig {
  const config = MODEL_CONFIGS[modelName];
  if (!config) {
    // Fallback to gpt-4o-mini config for unknown models
    console.warn(`Unknown model: ${modelName}, falling back to gpt-4o-mini config`);
    return MODEL_CONFIGS['gpt-4o-mini'];
  }
  return config;
}

/**
 * Build the API request body for a specific model
 */
export function buildApiRequestBody(
  modelName: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  temperature?: number
): Record<string, any> {
  const config = getModelConfig(modelName);
  
  const body: Record<string, any> = {
    model: config.apiModelName,
    messages,
    temperature: temperature ?? config.defaultTemperature,
  };

  // Use the correct token parameter based on model requirements
  if (config.useMaxCompletionTokens) {
    body.max_completion_tokens = Math.min(maxTokens, config.maxTokensSupported);
  } else {
    body.max_tokens = Math.min(maxTokens, config.maxTokensSupported);
  }

  // Add any additional model-specific parameters
  if (config.additionalParams) {
    Object.assign(body, config.additionalParams);
  }

  return body;
}

/**
 * Estimate cost for a model based on token usage
 */
export function estimateModelCost(
  modelName: string,
  inputTokens: number,
  outputTokens: number
): number {
  const config = getModelConfig(modelName);
  return (
    (inputTokens / 1000) * config.inputCostPer1K +
    (outputTokens / 1000) * config.outputCostPer1K
  );
}

/**
 * Get all available model names
 */
export function getAvailableModels(): string[] {
  return Object.keys(MODEL_CONFIGS);
}

/**
 * Validate if a model is supported
 */
export function isModelSupported(modelName: string): boolean {
  return modelName in MODEL_CONFIGS;
}

/**
 * Get model display information for UI
 */
export interface ModelDisplayInfo {
  name: string;
  displayName: string;
  description: string;
  maxTokens: number;
  costInfo: string;
}

export function getModelDisplayInfo(): ModelDisplayInfo[] {
  return [
    {
      name: 'gpt-4o-mini',
      displayName: 'GPT-4o Mini',
      description: 'Recommended - Fast and cost-effective',
      maxTokens: MODEL_CONFIGS['gpt-4o-mini'].maxTokensSupported,
      costInfo: `$${MODEL_CONFIGS['gpt-4o-mini'].inputCostPer1K}/1K input tokens`,
    },
    {
      name: 'gpt-5-mini',
      displayName: 'GPT-5 Mini',
      description: 'Latest generation model',
      maxTokens: MODEL_CONFIGS['gpt-5-mini'].maxTokensSupported,
      costInfo: `$${MODEL_CONFIGS['gpt-5-mini'].inputCostPer1K}/1K input tokens`,
    },
    {
      name: 'o4-mini',
      displayName: 'O4 Mini',
      description: 'Advanced reasoning model',
      maxTokens: MODEL_CONFIGS['o4-mini'].maxTokensSupported,
      costInfo: `$${MODEL_CONFIGS['o4-mini'].inputCostPer1K}/1K input tokens`,
    },
    {
      name: 'gpt-3.5-turbo',
      displayName: 'GPT-3.5 Turbo',
      description: 'Faster and cheaper option',
      maxTokens: MODEL_CONFIGS['gpt-3.5-turbo'].maxTokensSupported,
      costInfo: `$${MODEL_CONFIGS['gpt-3.5-turbo'].inputCostPer1K}/1K input tokens`,
    },
    {
      name: 'local-wasm',
      displayName: 'Local WASM',
      description: 'Offline model (experimental)',
      maxTokens: MODEL_CONFIGS['local-wasm'].maxTokensSupported,
      costInfo: 'Free',
    },
  ];
}
