import { z } from 'zod';

// Coordinates come back as decimal strings, e.g. "-37.3159".
const coordinate = z.string().regex(/^-?\d+(\.\d+)?$/);

// Strict at every level: an unexpected extra field fails the schema check.
export const userSchema = z.strictObject({
  id: z.number().int().positive(),
  name: z.string(),
  username: z.string(),
  email: z.email(),
  address: z.strictObject({
    street: z.string(),
    suite: z.string(),
    city: z.string(),
    zipcode: z.string(),
    geo: z.strictObject({ lat: coordinate, lng: coordinate }),
  }),
  phone: z.string(),
  website: z.string(),
  company: z.strictObject({
    name: z.string(),
    catchPhrase: z.string(),
    bs: z.string(),
  }),
});

export type User = z.infer<typeof userSchema>;
export type NewUser = Omit<User, 'id'>;
