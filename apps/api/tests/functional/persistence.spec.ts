import { buildNewAlbum } from '@api/data-models/album.builder';
import { buildNewComment } from '@api/data-models/comment.builder';
import { buildNewPhoto } from '@api/data-models/photo.builder';
import { buildNewPost } from '@api/data-models/post.builder';
import { buildNewTodo } from '@api/data-models/todo.builder';
import { buildNewUser } from '@api/data-models/user.builder';
import { expect, test } from '@api/fixtures/clients.fixture';
import type { ListedRecord } from '@api/utils/records';

// JSONPlaceholder answers writes like a real API but saves nothing. These tests pin that down, and check that PATCH
// merges the sent fields into the stored record.
const RESOURCES = [
  { resource: 'posts', buildNew: buildNewPost, buildChanges: () => ({ title: buildNewPost().title }) },
  { resource: 'comments', buildNew: buildNewComment, buildChanges: () => ({ name: buildNewComment().name }) },
  { resource: 'albums', buildNew: buildNewAlbum, buildChanges: () => ({ title: buildNewAlbum().title }) },
  { resource: 'photos', buildNew: buildNewPhoto, buildChanges: () => ({ title: buildNewPhoto().title }) },
  { resource: 'todos', buildNew: buildNewTodo, buildChanges: () => ({ title: buildNewTodo().title }) },
  { resource: 'users', buildNew: buildNewUser, buildChanges: () => ({ email: buildNewUser().email }) },
] as const;

for (const { resource, buildNew, buildChanges } of RESOURCES) {
  test.describe(resource, { tag: '@p2' }, () => {
    test.use({ resource });

    test('create is not persisted: the new id returns 404', async ({ api }) => {
      const created = await api.create(buildNew());
      expect(created.status()).toBe(201);
      const { id } = (await created.json()) as ListedRecord;

      const response = await api.get(id);

      expect(response.status()).toBe(404);
    });

    test('delete is not persisted: the record still returns 200', async ({ api, existingRecord }) => {
      const deleted = await api.delete(existingRecord.id);
      expect(deleted.status()).toBe(200);

      const response = await api.get(existingRecord.id);

      expect(response.status()).toBe(200);
    });

    test('update (PATCH) keeps the fields it did not send', async ({ api, existingRecord }) => {
      const before = await api.get(existingRecord.id);
      expect(before.status()).toBe(200);
      const original = (await before.json()) as ListedRecord;
      const changes = buildChanges();

      const response = await api.update(existingRecord.id, changes);

      expect(response.status()).toBe(200);
      const body: unknown = await response.json();
      expect(body).toEqual({ ...original, ...changes });
    });
  });
}
