import { z } from 'zod';

// Strict: an unexpected extra field fails the contract check.
export const postSchema = z.strictObject({
  userId: z.number().int().positive(),
  id: z.number().int().positive(),
  title: z.string(),
  body: z.string(),
});

export type Post = z.infer<typeof postSchema>;
