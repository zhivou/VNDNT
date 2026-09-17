import type { Page } from '@playwright/test';
import path from 'node:path';

const authDir = path.join(__dirname, '..', '.auth');

// Absolute path, so the setup project and the config agree no matter where Playwright runs from.
export const storageStatePath = (username: string): string => path.join(authDir, `${username}.json`);

// No cookies and no localStorage. For tests that start logged out: test.use({ storageState: emptyStorageState })
export const emptyStorageState = { cookies: [], origins: [] };

// SauceDemo has no login API: the browser writes the session itself as a session-username cookie that lasts
// 10 minutes. So a session can only come from logging in through the UI. Call this once the page is logged in.
export const createStorageStateUI = async (page: Page, username: string): Promise<void> => {
  await page.context().storageState({ path: storageStatePath(username) });
};
