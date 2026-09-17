import { todoSchema } from '@api/data-models/todo.model';
import { expect, test } from '@api/fixtures/clients.fixture';

// These tests check types and structure against our own schemas, never the dataset's content.

test.describe('schema', () => {
  test('list returns todos matching the schema', async ({ todosApi }) => {
    const response = await todosApi.list();

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    const body: unknown = await response.json();
    expect(body).toMatchSchema(todoSchema.array().min(1));
  });

  test('get returns the requested todo matching the schema', async ({ todosApi, existingTodoId }) => {
    const response = await todosApi.get(existingTodoId);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(todoSchema);
    expect(body).toMatchObject({ id: existingTodoId });
  });

  // Ids are positive integers, so 0 can never exist.
  test('get returns 404 for a todo id that cannot exist', async ({ todosApi }) => {
    const response = await todosApi.get(0);

    expect(response.status()).toBe(404);
    const body: unknown = await response.json();
    expect(body).toEqual({});
  });
});
