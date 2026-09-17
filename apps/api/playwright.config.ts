import { defineConfig } from '@playwright/test';
import { baseConfig } from '../../playwright.config';
import { env } from './utils/env';

// No device and only the request fixture, so no browser is launched for this app.
export default defineConfig(baseConfig, {
  use: {
    baseURL: env.API_BASE_URL,
    extraHTTPHeaders: { Accept: 'application/json' },
  },
  projects: [
    {
      name: 'setup',
      testDir: './setup',
      testMatch: '*.setup.ts',
    },
    {
      name: 'api',
      testDir: './tests',
      dependencies: ['setup'],
    },
  ],
});
