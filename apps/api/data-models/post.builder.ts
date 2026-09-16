import type { NewPost } from '@api/data-models/post.model';

// A valid new post. JSONPlaceholder doesn't check that the author exists.
export const buildNewPost = (overrides: Partial<NewPost> = {}): NewPost => ({
  userId: 1,
  title: `Test post ${crypto.randomUUID().slice(0, 8)}`,
  body: 'Created by the API tests.',
  ...overrides,
});
