import { postSchema } from '@api/data-models/post.model';
import { expect, test } from '@api/fixtures/clients.fixture';

// These tests check types and structure against our own schemas, never the dataset's content.

test.describe('schema', () => {
  test('list returns posts matching the schema', async ({ postsApi }) => {
    const response = await postsApi.list();

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    const body: unknown = await response.json();
    expect(body).toMatchSchema(postSchema.array().min(1));
  });

  test('get returns the requested post matching the schema', async ({ postsApi, existingPostId }) => {
    const response = await postsApi.get(existingPostId);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(postSchema);
    expect(body).toMatchObject({ id: existingPostId });
  });

  // Ids are positive integers, so 0 can never exist.
  test('get returns 404 for a post id that cannot exist', async ({ postsApi }) => {
    const response = await postsApi.get(0);

    expect(response.status()).toBe(404);
    const body: unknown = await response.json();
    expect(body).toEqual({});
  });
});
