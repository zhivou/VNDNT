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
      // Runs once chromium has finished, whether its tests passed or failed
      teardown: 'session-end',
    },
    {
      name: 'chromium',
      testDir: './tests',
      testIgnore: 'session-end.spec.ts',
      dependencies: ['auth'],
      use: { storageState: storageStatePath(SAUCE_USERS.standard) },
    },
    {
      // Tests that end one of the shared sessions, run last and one at a time so no other test loses its session
      name: 'session-end',
      testDir: './tests',
      testMatch: 'session-end.spec.ts',
      workers: 1,
      use: { storageState: storageStatePath(SAUCE_USERS.standard) },
    },
  ],
});
