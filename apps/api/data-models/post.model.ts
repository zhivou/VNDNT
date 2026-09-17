import { z } from 'zod';

// Strict: an unexpected extra field fails the schema check.
export const postSchema = z.strictObject({
  userId: z.number().int().positive(),
  id: z.number().int().positive(),
  title: z.string(),
  body: z.string(),
});

export type Post = z.infer<typeof postSchema>;
export type NewPost = Omit<Post, 'id'>;
