import { defineConfig, devices } from '@playwright/test';
import { baseConfig } from '../../playwright.config';
import { SAUCE_USERS } from './data-models/sauce-user.model';
import { env } from './utils/env';
import { storageStatePath } from './utils/storage-state';

export default defineConfig(baseConfig, {
  testDir: './tests',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: env.UI_BASE_URL,
    testIdAttribute: 'data-test',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: { storageState: storageStatePath(SAUCE_USERS.standard) },
    },
  ],
});
