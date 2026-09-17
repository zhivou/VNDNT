import { expect, test, type Clients } from '@api/fixtures/clients.fixture';
import { idsOf, readRecords } from '@api/utils/records';

// A nested route lists the same records, in the same order, as filtering the child collection by the parent's id.
const NESTED_ROUTES = [
  {
    route: '/posts/{id}/comments',
    parent: 'posts',
    child: 'comments',
    key: 'postId',
    listNested: (clients: Clients, id: number) => clients.posts.listComments(id),
  },
  {
    route: '/users/{id}/posts',
    parent: 'users',
    child: 'posts',
    key: 'userId',
    listNested: (clients: Clients, id: number) => clients.users.listPosts(id),
  },
  {
    route: '/users/{id}/albums',
    parent: 'users',
    child: 'albums',
    key: 'userId',
    listNested: (clients: Clients, id: number) => clients.users.listAlbums(id),
  },
  {
    route: '/users/{id}/todos',
    parent: 'users',
    child: 'todos',
    key: 'userId',
    listNested: (clients: Clients, id: number) => clients.users.listTodos(id),
  },
] as const;

for (const { route, parent, child, key, listNested } of NESTED_ROUTES) {
  test.describe(route, { tag: '@p3' }, () => {
    test.use({ resource: parent });

    test(`returns the same ${child} as filtering by ${key}`, async ({ clients, existingRecord }) => {
      const nested = await listNested(clients, existingRecord.id);
      const filtered = await clients[child].list({ [key]: existingRecord.id });

      expect(nested.status()).toBe(200);
      expect(filtered.status()).toBe(200);
      const nestedIds = idsOf(await readRecords(nested));
      expect(nestedIds, 'a parent with no children would match trivially').not.toHaveLength(0);
      expect(nestedIds).toEqual(idsOf(await readRecords(filtered)));
    });
  });
}
