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
