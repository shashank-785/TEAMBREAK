import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'client', 'dist');
const docs = path.join(root, 'docs');
const index = path.join(dist, 'index.html');

if (!existsSync(index)) {
  throw new Error('Client build is missing. Run the publish:pages script from the repository root.');
}

mkdirSync(docs, { recursive: true });
cpSync(dist, docs, { recursive: true, force: true });
const html = readFileSync(index, 'utf8').replace(/\r\n?/g, '\n');
writeFileSync(path.join(docs, 'index.html'), html);
writeFileSync(path.join(docs, '404.html'), html);
console.log('GitHub Pages files copied to docs/, including SPA route fallback.');
