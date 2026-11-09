import fs from 'fs';
import os from 'os';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

// Setup: npm i -D archiver

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const deliverablesDir = path.join(projectRoot, 'deliverables');

// Staging project ke BAHAR (OS temp dir) -> master zip mein recursion ka chance hi nahi
const stagingDir = fs.mkdtempSync(path.join(os.tmpdir(), 'learnos-staging-'));

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'temp_staging', 'deliverables']);
const missing = [];

function shouldSkipFile(base) {
  if (base === '.env') return true;
  if (base.startsWith('.env.') && base !== '.env.example') return true;
  return base.endsWith('.log') || base.endsWith('.zip');
}

function isInside(child, parent) {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function copyFiltered(src, dest) {
  if (!fs.existsSync(src)) {
    missing.push(path.relative(projectRoot, src));
    console.warn(`  ⚠️  Missing: ${path.relative(projectRoot, src)}`);
    return;
  }

  // Guard: destination source ke andar ho to infinite copy loop banega
  if (isInside(dest, src) && path.resolve(dest) !== path.resolve(src)) return;
  if (isInside(src, stagingDir) || isInside(src, deliverablesDir)) return;

  const stat = fs.lstatSync(src);
  if (stat.isSymbolicLink()) return; // symlink loops se bacho

  if (stat.isDirectory()) {
    if (SKIP_DIRS.has(path.basename(src))) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyFiltered(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    if (shouldSkipFile(path.basename(src))) return;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    n += entry.isDirectory() ? countFiles(full) : 1;
  }
  return n;
}

function makeZip(zipName, stageSubdir) {
  return new Promise((resolve, reject) => {
    const sourcePath = path.join(stagingDir, stageSubdir);
    const targetZip = path.join(deliverablesDir, `${zipName}.zip`);

    if (countFiles(sourcePath) === 0) {
      console.warn(`  ⚠️  ${zipName}.zip skip kiya: staging khaali hai`);
      return resolve(false);
    }

    const output = fs.createWriteStream(targetZip);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      fs.copyFileSync(targetZip, path.join(projectRoot, `${zipName}.zip`));
      console.log(`  ✅ ${zipName}.zip (${Math.round(archive.pointer() / 1024)} KB)`);
      resolve(true);
    });
    archive.on('warning', (err) => console.warn('  ⚠️ ', err.message));
    archive.on('error', reject);
    output.on('error', reject);

    archive.pipe(output);
    archive.directory(sourcePath, false);
    archive.finalize();
  });
}

const agents = [
  {
    name: 'ATLAS',
    paths: [
      'client/src/components',
      'client/src/pages/Dashboard',
      'client/src/pages/AIAssistant',
      'client/src/pages/Analytics',
      'client/src/pages/ProfileSettings',
      'client/src/App.tsx',
      'client/src/main.tsx',
      'client/src/types',
      'client/src/services',
      'client/package.json',
      'client/tsconfig.json',
      'client/vite.config.ts',
      'client/tailwind.config.js',
    ],
  },
  {
    name: 'NOVA',
    paths: [
      'client/src/pages/CollegeTutor',
      'client/src/pages/Notes',
      'client/src/pages/ExamCentre',
      'server/src/routes/tutor.ts',
      'server/src/routes/notes.ts',
      'server/src/routes/exams.ts',
      'server/src/types',
    ],
  },
  {
    name: 'ORBIT',
    paths: ['client/src/pages/StudyPlanner', 'server/src/routes/planner.ts', 'server/src/types'],
  },
  {
    name: 'FORGE',
    paths: [
      'client/src/pages/CodingLab',
      'client/src/pages/SkillDevelopment',
      'server/src/routes/coding.ts',
      'server/src/routes/skills.ts',
      'server/src/services/codeExecutionService.ts',
      'server/src/types',
    ],
  },
  {
    name: 'KERNEL',
    paths: ['server/src', 'server/package.json', 'server/tsconfig.json'],
  },
  {
    name: 'SENTINEL',
    paths: ['server/test', 'server/src/routes/system.ts'],
  },
];

async function main() {
  console.log('🚀 LearnOS Autonomous Deliverable Packaging Engine');
  console.log(`Root: ${projectRoot}`);

  fs.rmSync(deliverablesDir, { recursive: true, force: true });
  fs.mkdirSync(deliverablesDir, { recursive: true });

  for (const agent of agents) {
    console.log(`📦 Building ${agent.name}_LearnOS.zip...`);
    const stage = path.join(stagingDir, agent.name);
    fs.mkdirSync(stage, { recursive: true });

    copyFiltered(path.join(projectRoot, 'agents', agent.name, 'README.md'), path.join(stage, 'README.md'));
    copyFiltered(path.join(projectRoot, 'README.md'), path.join(stage, 'PROJECT_README.md'));
    for (const p of agent.paths) {
      copyFiltered(path.join(projectRoot, p), path.join(stage, p));
    }
    await makeZip(`${agent.name}_LearnOS`, agent.name);
  }

  console.log('⭐ Building LearnOS_Complete_Project.zip...');
  const masterStage = path.join(stagingDir, 'Master');
  fs.mkdirSync(masterStage, { recursive: true });
  copyFiltered(projectRoot, masterStage);
  await makeZip('LearnOS_Complete_Project', 'Master');

  const files = fs.readdirSync(deliverablesDir);
  console.log(`\n🎉 ${files.length} deliverable ZIP package(s) ban gaye:`);
  for (const f of files) {
    const size = Math.round(fs.statSync(path.join(deliverablesDir, f)).size / 1024);
    console.log(`  - ${f} (${size} KB)`);
  }

  if (missing.length) {
    console.warn(`\n⚠️  ${missing.length} path(s) missing the (check karo):`);
    for (const m of [...new Set(missing)]) console.warn(`  - ${m}`);
  }
}

main()
  .catch((err) => {
    console.error('❌ Packaging fail ho gayi:', err);
    process.exitCode = 1;
  })
  .finally(() => {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  });
