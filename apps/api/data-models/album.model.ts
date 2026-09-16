import { z } from 'zod';

// Strict: an unexpected extra field fails the schema check.
export const albumSchema = z.strictObject({
  userId: z.number().int().positive(),
  id: z.number().int().positive(),
  title: z.string(),
});

export type Album = z.infer<typeof albumSchema>;
export type NewAlbum = Omit<Album, 'id'>;
