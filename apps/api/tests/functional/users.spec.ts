import { buildNewUser } from '@api/data-models/user.builder';
import { userSchema } from '@api/data-models/user.model';
import { expect, test } from '@api/fixtures/clients.fixture';

// JSONPlaceholder fakes writes: it answers like a real API but saves nothing, so these tests check only the response.
test.describe('CRUD', { tag: '@p2' }, () => {
  test('create echoes the new user with a generated id', async ({ usersApi }) => {
    const user = buildNewUser();

    const response = await usersApi.create(user);

    expect(response.status()).toBe(201);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(userSchema);
    expect(body).toEqual({ ...user, id: expect.any(Number) });
  });

  test('replace (PUT) echoes the full new user', async ({ usersApi, existingUserId }) => {
    const user = buildNewUser();

    const response = await usersApi.replace(existingUserId, user);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(userSchema);
    expect(body).toEqual({ ...user, id: existingUserId });
  });

  test('update (PATCH) applies the sent fields', async ({ usersApi, existingUserId }) => {
    const changes = { email: buildNewUser().email };

    const response = await usersApi.update(existingUserId, changes);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(userSchema);
    expect(body).toMatchObject({ ...changes, id: existingUserId });
  });

  test('delete returns an empty body', async ({ usersApi, existingUserId }) => {
    const response = await usersApi.delete(existingUserId);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toEqual({});
  });
});
