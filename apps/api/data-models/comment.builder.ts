import type { NewComment } from '@api/data-models/comment.model';

// A valid new comment. JSONPlaceholder doesn't check that the post exists.
export const buildNewComment = (overrides: Partial<NewComment> = {}): NewComment => {
  const id = crypto.randomUUID().slice(0, 8);
  return {
    postId: 1,
    name: `Test comment ${id}`,
    email: `commenter-${id}@example.test`,
    body: 'Created by the API tests.',
    ...overrides,
  };
};
