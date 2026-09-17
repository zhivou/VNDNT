import { commentSchema } from '@api/data-models/comment.model';
import { expect, test } from '@api/fixtures/clients.fixture';

// These tests check types and structure against our own schemas, never the dataset's content.

test.describe('schema', () => {
  test('list returns comments matching the schema', async ({ commentsApi }) => {
    const response = await commentsApi.list();

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    const body: unknown = await response.json();
    expect(body).toMatchSchema(commentSchema.array().min(1));
  });

  test('get returns the requested comment matching the schema', async ({ commentsApi, existingCommentId }) => {
    const response = await commentsApi.get(existingCommentId);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(commentSchema);
    expect(body).toMatchObject({ id: existingCommentId });
  });

  // Ids are positive integers, so 0 can never exist.
  test('get returns 404 for a comment id that cannot exist', async ({ commentsApi }) => {
    const response = await commentsApi.get(0);

    expect(response.status()).toBe(404);
    const body: unknown = await response.json();
    expect(body).toEqual({});
  });
});
