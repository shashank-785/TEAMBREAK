import os from 'os';
import path from 'path';

export const AI_MODEL_NAME = 'Qwen3-1.7B-Q8_0';
export const AI_MODEL_FILE = 'Qwen3-1.7B-Q8_0.gguf';
export const AI_MODEL_SIZE_BYTES = 1_834_426_016;
export const AI_MODEL_SHA256 = '061b54daade076b5d3362dac252678d17da8c68f07560be70818cace6590cb1a';
export const AI_MODEL_URL = `https://huggingface.co/Qwen/Qwen3-1.7B-GGUF/resolve/main/${AI_MODEL_FILE}?download=true`;
export const AI_MODEL_LICENSE_URL = 'https://huggingface.co/Qwen/Qwen3-1.7B-GGUF/raw/main/LICENSE';
export const AI_MINIMUM_RAM_BYTES = 8 * 1024 ** 3;
export const AI_CONTEXT_SIZE = 8192;

export function getAIModelPath(): string {
  const configuredPath = process.env.LEARNOS_MODEL_PATH?.trim();
  return configuredPath
    ? path.resolve(configuredPath)
    : path.join(os.homedir(), '.learnos', 'models', AI_MODEL_FILE);
}

export interface RemoteAIConfig {
  kind: 'gemini' | 'openai-compatible' | 'ollama';
  providerLabel: string;
  runtimeLabel: string;
  model: string;
  baseUrl: string;
  apiKey?: string;
  timeoutMs: number;
  maxTokens: number;
}

export function getAIRequestTimeoutMs(): number {
  const parsed = Number(process.env.AI_REQUEST_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed >= 1000 && parsed <= 120000 ? parsed : 20000;
}

export function getAIRateLimitPerMinute(): number {
  const parsed = Number(process.env.AI_RATE_LIMIT_PER_MINUTE);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 300 ? parsed : 20;
}

export function resolveRemoteAIConfig(): RemoteAIConfig | null {
  const timeoutMs = getAIRequestTimeoutMs();
  const maxTokens = Number(process.env.AI_MAX_TOKENS) || 1024;
  const explicitProvider = (process.env.AI_PROVIDER || '').trim().toLowerCase();

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  const genericApiKey = process.env.AI_API_KEY?.trim();
  const customBaseUrl = process.env.AI_BASE_URL?.trim();
  const ollamaUrl = process.env.OLLAMA_BASE_URL?.trim();

  if ((explicitProvider === 'gemini' || !explicitProvider) && geminiKey) {
    const model = process.env.AI_MODEL?.trim() || 'gemini-2.0-flash';
    return {
      kind: 'gemini',
      providerLabel: 'Google Gemini Remote Inference',
      runtimeLabel: `Gemini REST API (${model})`,
      model,
      baseUrl: customBaseUrl || 'https://generativelanguage.googleapis.com/v1beta',
      apiKey: geminiKey,
      timeoutMs,
      maxTokens
    };
  }

  if ((explicitProvider === 'groq' || !explicitProvider) && groqKey) {
    const model = process.env.AI_MODEL?.trim() || 'llama-3.1-8b-instant';
    return {
      kind: 'openai-compatible',
      providerLabel: 'Groq Cloud Remote Inference',
      runtimeLabel: `OpenAI-Compatible REST (${model})`,
      model,
      baseUrl: (customBaseUrl || 'https://api.groq.com/openai/v1').replace(/\/+$/, ''),
      apiKey: groqKey,
      timeoutMs,
      maxTokens
    };
  }

  if ((explicitProvider === 'openrouter' || !explicitProvider) && openRouterKey) {
    const model = process.env.AI_MODEL?.trim() || 'meta-llama/llama-3.1-8b-instruct:free';
    return {
      kind: 'openai-compatible',
      providerLabel: 'OpenRouter Remote Inference',
      runtimeLabel: `OpenAI-Compatible REST (${model})`,
      model,
      baseUrl: (customBaseUrl || 'https://openrouter.ai/api/v1').replace(/\/+$/, ''),
      apiKey: openRouterKey,
      timeoutMs,
      maxTokens
    };
  }

  if ((explicitProvider === 'openai' || !explicitProvider) && (openAiKey || genericApiKey)) {
    const apiKey = genericApiKey || openAiKey!;
    const baseUrl = (customBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const model = process.env.AI_MODEL?.trim() || 'gpt-4o-mini';
    return {
      kind: 'openai-compatible',
      providerLabel: 'LearnOS Remote Cloud Inference',
      runtimeLabel: `OpenAI-Compatible REST (${model})`,
      model,
      baseUrl,
      apiKey,
      timeoutMs,
      maxTokens
    };
  }

  if ((explicitProvider === 'ollama' || !explicitProvider) && ollamaUrl) {
    const model = process.env.AI_MODEL?.trim() || 'qwen2.5:3b';
    return {
      kind: 'ollama',
      providerLabel: 'Ollama Remote Endpoint',
      runtimeLabel: `Ollama Chat API (${model})`,
      model,
      baseUrl: ollamaUrl.replace(/\/+$/, ''),
      timeoutMs,
      maxTokens
    };
  }

  return null;
}
