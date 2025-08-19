import { LLMResponse, CostEstimate, ModelProvider } from '@/types';
import { buildApiRequestBody, estimateModelCost, getModelConfig } from './model-config';

/**
 * LLM client wrapper supporting multiple providers (OpenAI via fetch, local placeholder)
 */
export class LLMClient {
  private localModel: any = null;
  private provider: ModelProvider = 'openai';
  private apiKey?: string;

  constructor(provider: ModelProvider = 'openai', apiKey?: string) {
    this.provider = provider;
    this.apiKey = apiKey;
  }

  async generateResponse(systemPrompt: string, userPrompt: string, maxTokens: number = 1000, model?: string): Promise<LLMResponse> {
    if (this.provider === 'openai') return this.generateOpenAIResponse(systemPrompt, userPrompt, maxTokens, model);
    if (this.provider === 'local-wasm') return this.generateLocalResponse(systemPrompt, userPrompt, maxTokens);
    throw new Error(`Unsupported LLM provider: ${this.provider}`);
  }

  private async generateOpenAIResponse(systemPrompt: string, userPrompt: string, maxTokens: number, model?: string): Promise<LLMResponse> {
    if (!this.apiKey) throw new Error('OpenAI API key not set');

    const modelName = model || 'gpt-4o-mini';
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // Use the model configuration system to build the correct API request
    const body = buildApiRequestBody(modelName, messages, maxTokens);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`OpenAI HTTP ${res.status}: ${errText}`);
    }

    const json = await res.json();
    const choice = json.choices?.[0];
    const usage = json.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return {
      content: choice?.message?.content || '',
      tokens: usage.total_tokens,
      model: json.model,
      cost: estimateModelCost(modelName, usage.prompt_tokens, usage.completion_tokens),
      finishReason: choice?.finish_reason || 'stop'
    };
  }

  private async generateLocalResponse(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<LLMResponse> {
    if (!this.localModel) await this.initializeLocalModel();
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const estimatedTokens = Math.ceil(combinedPrompt.length / 4);
    return {
      content: `[Local Model Response]\n\nSystem: ${systemPrompt}\n\nUser: ${userPrompt}`,
      tokens: estimatedTokens,
      model: 'local-wasm',
      cost: 0,
      finishReason: 'stop'
    };
  }

  private async initializeLocalModel(): Promise<void> {
    this.localModel = 'initialized';
  }

  estimateCost(systemPrompt: string, userPrompt: string, maxTokens: number, model?: string): CostEstimate {
    const inputTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
    const estimatedOutputTokens = Math.min(maxTokens, 1000);
    let estimatedCost = 0;
    let modelName: string = this.provider;
    
    if (this.provider === 'openai') {
      const actualModel = model || 'gpt-4o-mini';
      estimatedCost = estimateModelCost(actualModel, inputTokens, estimatedOutputTokens);
      modelName = actualModel;
    }
    
    return { inputTokens, outputTokens: estimatedOutputTokens, estimatedCost, model: modelName };
  }

  async setProvider(provider: ModelProvider, apiKey?: string): Promise<void> {
    this.provider = provider;
    this.apiKey = apiKey;
    this.localModel = null;
  }

  getProvider(): ModelProvider {
    return this.provider;
  }

  isProviderAvailable(): boolean {
    if (this.provider === 'openai') return !!this.apiKey;
    if (this.provider === 'local-wasm') return !!this.localModel;
    return false;
  }

  async *streamResponse(systemPrompt: string, userPrompt: string, maxTokens: number, model?: string): AsyncGenerator<string> {
    const response = await this.generateResponse(systemPrompt, userPrompt, maxTokens, model);
    yield response.content;
  }
} 