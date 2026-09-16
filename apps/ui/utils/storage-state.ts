import path from 'node:path';

const authDir = path.join(__dirname, '..', '.auth');

// Absolute path, so the setup project and the config agree no matter where Playwright runs from.
export const storageStatePath = (username: string): string => path.join(authDir, `${username}.json`);
