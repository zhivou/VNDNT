import { z } from 'zod';

// Strict: an unexpected extra field fails the schema check.
export const commentSchema = z.strictObject({
  postId: z.number().int().positive(),
  id: z.number().int().positive(),
  name: z.string(),
  email: z.email(),
  body: z.string(),
});

export type Comment = z.infer<typeof commentSchema>;
export type NewComment = Omit<Comment, 'id'>;
