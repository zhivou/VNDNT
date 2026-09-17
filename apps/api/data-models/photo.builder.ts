import type { NewPhoto } from '@api/data-models/photo.model';

// A valid new photo. JSONPlaceholder doesn't check that the album exists.
export const buildNewPhoto = (overrides: Partial<NewPhoto> = {}): NewPhoto => {
  const id = crypto.randomUUID().slice(0, 8);
  return {
    albumId: 1,
    title: `Test photo ${id}`,
    url: `https://example.test/photos/${id}/600.png`,
    thumbnailUrl: `https://example.test/photos/${id}/150.png`,
    ...overrides,
  };
};
