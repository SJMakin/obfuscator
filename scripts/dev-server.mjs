#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();
const distFile = resolve(root, 'dist', 'asm', 'module.js');

tryBuildIfNeeded();
startServer();

function tryBuildIfNeeded() {
  if (existsSync(distFile)) return;

  const dockerOk = hasDocker();
  const imageOk = dockerOk && hasDockerImage('asmjs-tigress');

  if (!dockerOk) {
    console.warn('[dev-server] Docker not found; skipping auto-build. You can run "npm run docker:build-image" then "npm run build:fast" manually.');
    return;
  }
  if (!imageOk) {
    console.warn('[dev-server] Docker image asmjs-tigress not found; run "npm run docker:build-image" first. Skipping auto-build.');
    return;
  }

  console.log('[dev-server] Building dist via Docker (fast profile)…');
  const r = spawnSync(process.execPath, [resolve(root, 'scripts', 'build.mjs'), 'fast'], { stdio: 'inherit' });
  if ((r.status ?? 1) !== 0) {
    console.warn('[dev-server] Build failed, continuing without dist (the page will not load the module).');
  } else if (!existsSync(distFile)) {
    console.warn('[dev-server] Build completed but dist file missing at ' + distFile);
  }
}

function startServer() {
  const bin = resolve(root, 'node_modules', '.bin', process.platform === 'win32' ? 'http-server.cmd' : 'http-server');
  const cmd = existsSync(bin) ? bin : 'http-server';
  const args = [root, '-p', '8080', '-c-1', '-s'];

  console.log('[dev-server] Starting http-server on http://localhost:8080 …');
  const srv = spawn(cmd, args, { stdio: 'inherit' });

  srv.on('exit', (code, signal) => {
    if (typeof code === 'number') process.exit(code);
    if (signal) process.kill(process.pid, signal);
  });

  process.on('SIGINT', () => srv.kill('SIGINT'));
  process.on('SIGTERM', () => srv.kill('SIGTERM'));
}

function hasDocker() {
  const r = spawnSync('docker', ['version'], { stdio: 'ignore' });
  return r.status === 0;
}

function hasDockerImage(name) {
  const r = spawnSync('docker', ['image', 'inspect', name], { stdio: 'ignore' });
  return r.status === 0;
}