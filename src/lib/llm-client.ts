import { LLMResponse, CostEstimate, ModelProvider } from '@/types';

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

  async generateResponse(systemPrompt: string, userPrompt: string, maxTokens: number = 1000): Promise<LLMResponse> {
    if (this.provider === 'openai') return this.generateOpenAIResponse(systemPrompt, userPrompt, maxTokens);
    if (this.provider === 'local-wasm') return this.generateLocalResponse(systemPrompt, userPrompt, maxTokens);
    throw new Error(`Unsupported LLM provider: ${this.provider}`);
  }

  private async generateOpenAIResponse(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<LLMResponse> {
    if (!this.apiKey) throw new Error('OpenAI API key not set');

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    };

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
      cost: this.estimateOpenAICost(usage.prompt_tokens, usage.completion_tokens),
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

  private estimateOpenAICost(inputTokens: number, outputTokens: number): number {
    const inputCostPer1K = 0.00015;
    const outputCostPer1K = 0.0006;
    return (inputTokens / 1000) * inputCostPer1K + (outputTokens / 1000) * outputCostPer1K;
  }

  estimateCost(systemPrompt: string, userPrompt: string, maxTokens: number): CostEstimate {
    const inputTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
    const estimatedOutputTokens = Math.min(maxTokens, 1000);
    let estimatedCost = 0;
    let model = this.provider;
    if (this.provider === 'openai') {
      estimatedCost = this.estimateOpenAICost(inputTokens, estimatedOutputTokens);
      model = 'openai';
    }
    return { inputTokens, outputTokens: estimatedOutputTokens, estimatedCost, model };
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

  async *streamResponse(systemPrompt: string, userPrompt: string, maxTokens: number): AsyncGenerator<string> {
    const response = await this.generateResponse(systemPrompt, userPrompt, maxTokens);
    yield response.content;
  }
} 