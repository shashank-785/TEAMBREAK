import { createHash } from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir, rename, stat, unlink, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';
import {
  AI_MODEL_FILE,
  AI_MODEL_LICENSE_URL,
  AI_MODEL_NAME,
  AI_MODEL_SHA256,
  AI_MODEL_SIZE_BYTES,
  AI_MODEL_URL,
  getAIModelPath
} from '../src/services/aiConfig.js';

async function downloadFile(url: string): Promise<Response> {
  const response = await fetch(url, { signal: AbortSignal.timeout(30 * 60 * 1000) });
  if (!response.ok) {
    throw new Error(`Download failed with HTTP ${response.status}: ${url}`);
  }
  return response;
}

async function ensureModelLicense(modelDirectory: string) {
  const licensePath = path.join(modelDirectory, `${AI_MODEL_FILE}.LICENSE`);
  try {
    const existing = await stat(licensePath);
    if (existing.isFile()) return;
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
  }
  const licenseResponse = await downloadFile(AI_MODEL_LICENSE_URL);
  await writeFile(licensePath, await licenseResponse.text(), 'utf8');
}

async function verifyRuntime() {
  const { getLlama, LlamaLogLevel } = await import('node-llama-cpp');
  const llama = await getLlama({ gpu: false, build: 'auto', logLevel: LlamaLogLevel.error });
  await llama.dispose();
}

async function verifyExistingModel(modelPath: string): Promise<boolean> {
  try {
    const modelFile = await stat(modelPath);
    if (!modelFile.isFile() || modelFile.size !== AI_MODEL_SIZE_BYTES) return false;
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(modelPath)) hash.update(chunk);
    return hash.digest('hex') === AI_MODEL_SHA256;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false;
    throw error;
  }
}

async function setupModel() {
  const modelPath = getAIModelPath();
  const modelDirectory = path.dirname(modelPath);
  const temporaryPath = `${modelPath}.partial`;

  if (os.totalmem() < 8 * 1024 ** 3) {
    console.warn(`Warning: this computer has less than the recommended 8 GB of RAM (${(os.totalmem() / 1024 ** 3).toFixed(1)} GB detected).`);
  }

  console.log('Checking the embedded llama.cpp CPU runtime.');
  await verifyRuntime();

  const modelInstalled = await verifyExistingModel(modelPath);
  if (modelInstalled) {
    await ensureModelLicense(modelDirectory);
    console.log(`Model already installed and verified: ${modelPath}`);
    return;
  }
  try {
    await stat(modelPath);
    throw new Error(`An incomplete or unexpected model file already exists at ${modelPath}. Remove that file before retrying setup.`);
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
  }

  await mkdir(modelDirectory, { recursive: true });
  console.log(`Downloading ${AI_MODEL_NAME} (~1.83 GB) to ${modelPath}`);
  const response = await downloadFile(AI_MODEL_URL);
  if (!response.body) throw new Error('The model download did not provide a response stream.');

  const hash = createHash('sha256');
  let downloadedBytes = 0;
  let lastReportedPercent = -1;
  const hasher = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      downloadedBytes += chunk.length;
      hash.update(chunk);
      const percent = Math.floor(downloadedBytes / AI_MODEL_SIZE_BYTES * 100);
      if (percent >= lastReportedPercent + 5) {
        lastReportedPercent = percent;
        console.log(`Model download: ${percent}%`);
      }
      callback(null, chunk);
    }
  });

  try {
    await pipeline(
      Readable.fromWeb(response.body as import('stream/web').ReadableStream),
      hasher,
      createWriteStream(temporaryPath, { flags: 'wx' })
    );
    if (downloadedBytes !== AI_MODEL_SIZE_BYTES) {
      throw new Error(`Downloaded ${downloadedBytes} bytes; expected ${AI_MODEL_SIZE_BYTES}.`);
    }
    const actualHash = hash.digest('hex');
    if (actualHash !== AI_MODEL_SHA256) {
      throw new Error('The downloaded model checksum does not match the official model file.');
    }
    await rename(temporaryPath, modelPath);
    await ensureModelLicense(modelDirectory);
    console.log(`Model setup complete. Weights and license are stored outside the LearnOS repository.`);
  } catch (error) {
    await unlink(temporaryPath).catch(cleanupError => {
      if (!(cleanupError instanceof Error && 'code' in cleanupError && cleanupError.code === 'ENOENT')) {
        console.error('Unable to remove the partial model download:', cleanupError);
      }
    });
    throw error;
  }
}

setupModel().catch(error => {
  console.error('[LearnOS model setup failed]', error);
  process.exitCode = 1;
});
