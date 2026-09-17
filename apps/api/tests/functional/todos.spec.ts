import { buildNewTodo } from '@api/data-models/todo.builder';
import { todoSchema } from '@api/data-models/todo.model';
import { expect, test } from '@api/fixtures/clients.fixture';

// JSONPlaceholder fakes writes: it answers like a real API but saves nothing, so these tests check only the response.
test.describe('CRUD', () => {
  test('create echoes the new todo with a generated id', async ({ todosApi }) => {
    const todo = buildNewTodo();

    const response = await todosApi.create(todo);

    expect(response.status()).toBe(201);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(todoSchema);
    expect(body).toEqual({ ...todo, id: expect.any(Number) });
  });

  test('replace (PUT) echoes the full new todo', async ({ todosApi, existingTodoId }) => {
    const todo = buildNewTodo();

    const response = await todosApi.replace(existingTodoId, todo);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(todoSchema);
    expect(body).toEqual({ ...todo, id: existingTodoId });
  });

  test('update (PATCH) applies the sent fields', async ({ todosApi, existingTodoId }) => {
    const changes = { completed: true };

    const response = await todosApi.update(existingTodoId, changes);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(todoSchema);
    expect(body).toMatchObject({ ...changes, id: existingTodoId });
  });

  test('delete returns an empty body', async ({ todosApi, existingTodoId }) => {
    const response = await todosApi.delete(existingTodoId);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toEqual({});
  });
});
