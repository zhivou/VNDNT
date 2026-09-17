import type { NewTodo } from '@api/data-models/todo.model';

// A valid new todo. JSONPlaceholder doesn't check that the owner exists.
export const buildNewTodo = (overrides: Partial<NewTodo> = {}): NewTodo => ({
  userId: 1,
  title: `Test todo ${crypto.randomUUID().slice(0, 8)}`,
  completed: false,
  ...overrides,
});
