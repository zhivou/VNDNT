import { buildNewPost } from '@api/data-models/post.builder';
import { postSchema } from '@api/data-models/post.model';
import { expect, test } from '@api/fixtures/clients.fixture';

// JSONPlaceholder fakes writes: it answers like a real API but saves nothing, so these tests check only the response.
test.describe('CRUD', { tag: '@p2' }, () => {
  test('create echoes the new post with a generated id', async ({ postsApi }) => {
    const post = buildNewPost();

    const response = await postsApi.create(post);

    expect(response.status()).toBe(201);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(postSchema);
    expect(body).toEqual({ ...post, id: expect.any(Number) });
  });

  test('replace (PUT) echoes the full new post', async ({ postsApi, existingPostId }) => {
    const post = buildNewPost();

    const response = await postsApi.replace(existingPostId, post);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(postSchema);
    expect(body).toEqual({ ...post, id: existingPostId });
  });

  test('update (PATCH) applies the sent fields', async ({ postsApi, existingPostId }) => {
    const changes = { title: buildNewPost().title };

    const response = await postsApi.update(existingPostId, changes);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(postSchema);
    expect(body).toMatchObject({ ...changes, id: existingPostId });
  });

  test('delete returns an empty body', async ({ postsApi, existingPostId }) => {
    const response = await postsApi.delete(existingPostId);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toEqual({});
  });
});
