import { expect, test } from '@api/fixtures/clients.fixture';
import { idsOf, readRecords, sortedByText } from '@api/utils/records';

// Expected results come from the whole collection, listed at runtime in its default order.
// Each resource sorts by a text field, whose order differs from that default id order.
const RESOURCES = [
  { resource: 'posts', sortField: 'title' },
  { resource: 'comments', sortField: 'name' },
  { resource: 'albums', sortField: 'title' },
  { resource: 'photos', sortField: 'title' },
  { resource: 'todos', sortField: 'title' },
  { resource: 'users', sortField: 'name' },
] as const;

const PAGE_SIZE = 3;

for (const { resource, sortField } of RESOURCES) {
  test.describe(resource, () => {
    test.use({ resource });

    test(`_limit returns the first ${PAGE_SIZE} records`, async ({ api, allRecords }) => {
      const response = await api.list({ _limit: PAGE_SIZE });

      expect(response.status()).toBe(200);
      expect(idsOf(await readRecords(response))).toEqual(idsOf(allRecords.slice(0, PAGE_SIZE)));
    });

    test(`_page returns that page of _limit records`, async ({ api, allRecords }) => {
      const response = await api.list({ _page: 2, _limit: PAGE_SIZE });

      expect(response.status()).toBe(200);
      expect(idsOf(await readRecords(response))).toEqual(idsOf(allRecords.slice(PAGE_SIZE, 2 * PAGE_SIZE)));
    });

    test('_page reports the collection size in x-total-count', async ({ api, allRecords }) => {
      const response = await api.list({ _page: 2, _limit: PAGE_SIZE });

      expect(response.status()).toBe(200);
      expect(response.headers()['x-total-count']).toBe(String(allRecords.length));
    });

    for (const order of ['asc', 'desc'] as const) {
      test(`_sort=${sortField} with _order=${order} sorts every record`, async ({ api, allRecords }) => {
        const response = await api.list({ _sort: sortField, _order: order });

        expect(response.status()).toBe(200);
        expect(idsOf(await readRecords(response))).toEqual(idsOf(sortedByText(allRecords, sortField, order)));
      });
    }
  });
}
