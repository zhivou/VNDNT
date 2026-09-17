import { userSchema } from '@api/data-models/user.model';
import { expect, test } from '@api/fixtures/clients.fixture';

// These tests check types and structure against our own schemas, never the dataset's content.

test.describe('schema', () => {
  test('list returns users matching the schema', async ({ usersApi }) => {
    const response = await usersApi.list();

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    const body: unknown = await response.json();
    expect(body).toMatchSchema(userSchema.array().min(1));
  });

  test('get returns the requested user matching the schema', async ({ usersApi, existingUserId }) => {
    const response = await usersApi.get(existingUserId);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(userSchema);
    expect(body).toMatchObject({ id: existingUserId });
  });

  // Ids are positive integers, so 0 can never exist.
  test('get returns 404 for a user id that cannot exist', async ({ usersApi }) => {
    const response = await usersApi.get(0);

    expect(response.status()).toBe(404);
    const body: unknown = await response.json();
    expect(body).toEqual({});
  });
});
