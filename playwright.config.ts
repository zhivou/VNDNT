import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';

// One .env for the repo. Each app reads only its own variables.
dotenv.config({ path: path.join(__dirname, '.env'), quiet: true });

// Settings every app shares. App configs extend this object with defineConfig(baseConfig, { ... }).
export const baseConfig = defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Explicit relative paths resolve from the app config that runs, so each app keeps its own results and report.
  // Left unset, Playwright would put both apps' output next to the root package.json, where they overwrite each other.
  outputDir: 'test-results',
  reporter: process.env.CI
    ? [
        ['list'],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
      ]
    : [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});

// This file only holds shared settings and runs no tests. Run an app instead: -c apps/ui or -c apps/api
export default defineConfig(baseConfig, { testIgnore: '**/*' });
