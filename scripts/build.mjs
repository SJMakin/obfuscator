#!/usr/bin/env node
/**
 * Build orchestrator:
 * - fast: emcc direct to asm.js (Docker Emscripten 1.38.45 fastcomp)
 * - hard: Tigress transforms (Flatten + Virtualize) then emcc to asm.js
 * - simple: emcc direct to asm.js (simple Docker image without Tigress)
 *
 * Requirements:
 * - Docker Desktop (Linux containers) available on PATH
 * - Image built: npm run docker:build-image (for fast/hard) or npm run docker:build-image-simple (for simple)
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const mode = (process.argv[2] || 'fast').toLowerCase();
if (!['fast', 'hard', 'simple'].includes(mode)) {
  console.error('Usage: node scripts/build.mjs [fast|hard|simple]');
  process.exit(2);
}

const root = process.cwd();
const outDir = path.join(root, 'dist', 'asm');
const buildDir = path.join(root, 'build');

ensureDir(buildDir);
ensureDir(outDir);

if (!hasDocker()) {
  console.error('Docker not found on PATH. Install Docker Desktop and try again.');
  process.exit(1);
}

// Ensure image exists; if not, instruct user to build it
const imageName = mode === 'simple' ? 'asmjs-simple' : 'asmjs-tigress';
const buildCmd = mode === 'simple' ? 'npm run docker:build-image-simple' : 'npm run docker:build-image';
if (!hasDockerImage(imageName)) {
  console.error(`Docker image ${imageName} not found. Run: ${buildCmd}`);
  process.exit(1);
}

const mount = process.platform === 'win32'
  ? root.replace(/\\/g, '/')
  : root;

const commonFlags = [
  '-O3',
  '-s', 'WASM=0',
  '-s', 'NO_FILESYSTEM=1',
  '-s', 'MODULARIZE=1',
  '-s', 'ENVIRONMENT=web',
  '-s', 'SINGLE_FILE=1',
  '-s', "EXPORTED_FUNCTIONS=['_checksum','_dom_touch','_init']",
  '-s', "EXPORTED_RUNTIME_METHODS=['cwrap','ccall','UTF8ToString']",
  '-s', "EXPORT_NAME='createObf'",
  '-s', 'TOTAL_MEMORY=33554432',
];

const emccFast = [
  'emcc',
  'src/native/main.c',
  ...commonFlags,
  '-o', 'dist/asm/module.js'
].join(' ');

const tigressHard = [
  // Chain transforms on checksum only; defaults keep compatibility with emscripten.
  'tigress',
  '--Seed=0xC0FFEE',
  '--Transform=Flatten', '--Functions=checksum',
  '--Transform=Virtualize', '--Functions=checksum',
  '--out=build/obf.c',
  'src/native/main.c'
].join(' ');

const emccHard = [
  'emcc',
  'build/obf.c',
  ...commonFlags,
  '-o', 'dist/asm/module.js'
].join(' ');

const cmds = [
  'set -e',
  'mkdir -p build dist/asm',
  mode === 'fast' || mode === 'simple' ? emccFast : [tigressHard, emccHard].join(' && ')
].join(' && ');

const run = spawnSync(
  'docker',
  [
    'run', '--rm',
    '-v', `${mount}:/work`,
    '-w', '/work',
    imageName,
    'bash', '-lc', cmds
  ],
  { stdio: 'inherit' }
);

process.exit(run.status ?? 1);

// Helpers
function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function hasDocker() {
  const r = spawnSync('docker', ['version'], { stdio: 'ignore' });
  return r.status === 0;
}

function hasDockerImage(name) {
  const r = spawnSync('docker', ['image', 'inspect', name], { stdio: 'ignore' });
  return r.status === 0;
}