import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env['BASE_URL'] ?? 'https://opencart.abstracta.us',
    headless: process.env['HEADLESS'] !== 'false',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
    viewport: { width: 1280, height: 720 },
  },
  timeout: 60_000,
  retries: 0,
});
