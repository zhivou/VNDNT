import { expect, test } from '@api/fixtures/clients.fixture';
import { readRecords } from '@api/utils/records';

// Each child resource filtered by its parent's id. The filter value comes from an existing record at runtime.
const FILTERS = [
  { resource: 'posts', key: 'userId' },
  { resource: 'comments', key: 'postId' },
  { resource: 'albums', key: 'userId' },
  { resource: 'photos', key: 'albumId' },
  { resource: 'todos', key: 'userId' },
] as const;

for (const { resource, key } of FILTERS) {
  test.describe(resource, () => {
    test.use({ resource });

    test(`filter by ${key} returns only matching items`, async ({ api, existingRecord }) => {
      const value = existingRecord[key] as number;

      const response = await api.list({ [key]: value });

      expect(response.status()).toBe(200);
      const items = await readRecords(response);
      // Also fails on an empty list, which would match trivially.
      expect(new Set(items.map((item) => item[key]))).toEqual(new Set([value]));
    });

    // Ids are positive integers, so no record has a parent id of 0.
    test(`filter by ${key} with no match returns an empty array`, async ({ api }) => {
      const response = await api.list({ [key]: 0 });

      expect(response.status()).toBe(200);
      const body: unknown = await response.json();
      expect(body).toEqual([]);
    });
  });
}
