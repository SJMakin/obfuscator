import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  webServer: {
    command: 'node scripts/dev-server.mjs',
    port: 8080,
    reuseExistingServer: true,
    timeout: 120_000
  },
  use: {
    headless: true,
    baseURL: 'http://localhost:8080'
  }
});