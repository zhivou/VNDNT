import type { NewAlbum } from '@api/data-models/album.model';

// A valid new album. JSONPlaceholder doesn't check that the owner exists.
export const buildNewAlbum = (overrides: Partial<NewAlbum> = {}): NewAlbum => ({
  userId: 1,
  title: `Test album ${crypto.randomUUID().slice(0, 8)}`,
  ...overrides,
});
