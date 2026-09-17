import { z } from 'zod';

// Strict: an unexpected extra field fails the schema check.
export const photoSchema = z.strictObject({
  albumId: z.number().int().positive(),
  id: z.number().int().positive(),
  title: z.string(),
  url: z.url(),
  thumbnailUrl: z.url(),
});

export type Photo = z.infer<typeof photoSchema>;
export type NewPhoto = Omit<Photo, 'id'>;
