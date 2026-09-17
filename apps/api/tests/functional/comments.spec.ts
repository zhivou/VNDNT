import { buildNewComment } from '@api/data-models/comment.builder';
import { commentSchema } from '@api/data-models/comment.model';
import { expect, test } from '@api/fixtures/clients.fixture';

// JSONPlaceholder fakes writes: it answers like a real API but saves nothing, so these tests check only the response.
test.describe('CRUD', () => {
  test('create echoes the new comment with a generated id', async ({ commentsApi }) => {
    const comment = buildNewComment();

    const response = await commentsApi.create(comment);

    expect(response.status()).toBe(201);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(commentSchema);
    expect(body).toEqual({ ...comment, id: expect.any(Number) });
  });

  test('replace (PUT) echoes the full new comment', async ({ commentsApi, existingCommentId }) => {
    const comment = buildNewComment();

    const response = await commentsApi.replace(existingCommentId, comment);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(commentSchema);
    expect(body).toEqual({ ...comment, id: existingCommentId });
  });

  test('update (PATCH) applies the sent fields', async ({ commentsApi, existingCommentId }) => {
    const changes = { name: buildNewComment().name };

    const response = await commentsApi.update(existingCommentId, changes);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(commentSchema);
    expect(body).toMatchObject({ ...changes, id: existingCommentId });
  });

  test('delete returns an empty body', async ({ commentsApi, existingCommentId }) => {
    const response = await commentsApi.delete(existingCommentId);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toEqual({});
  });
});
