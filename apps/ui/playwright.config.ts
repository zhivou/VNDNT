import { defineConfig, devices } from '@playwright/test';
import { baseConfig } from '../../playwright.config';
import { SAUCE_USERS } from './data-models/sauce-user.model';
import { storageStatePath } from './utils/auth';
import { env } from './utils/env';

export default defineConfig(baseConfig, {
  use: {
    ...devices['Desktop Chrome'],
    baseURL: env.UI_BASE_URL,
    testIdAttribute: 'data-test',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: 'precondition',
      testDir: './setup',
      testMatch: 'precondition.setup.ts',
    },
    {
      name: 'auth',
      testDir: './setup',
      testMatch: 'auth.setup.ts',
      dependencies: ['precondition'],
    },
    {
      name: 'chromium',
      testDir: './tests',
      dependencies: ['auth'],
      use: { storageState: storageStatePath(SAUCE_USERS.standard) },
    },
  ],
});
