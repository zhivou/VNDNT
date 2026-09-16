import { z } from 'zod';

// Strict: an unexpected extra field fails the schema check.
export const todoSchema = z.strictObject({
  userId: z.number().int().positive(),
  id: z.number().int().positive(),
  title: z.string(),
  completed: z.boolean(),
});

export type Todo = z.infer<typeof todoSchema>;
export type NewTodo = Omit<Todo, 'id'>;
