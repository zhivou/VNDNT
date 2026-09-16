import { postSchema } from '@api/data-models/post.model';
import { expect, test } from '@api/fixtures/clients.fixture';

test('returns a post by id', { tag: '@smoke' }, async ({ postsApi }) => {
  const response = await postsApi.get(1);

  expect(response.status()).toBe(200);
  const body: unknown = await response.json();
  expect(body).toMatchSchema(postSchema);
  expect(body).toMatchObject({ id: 1 });
});
