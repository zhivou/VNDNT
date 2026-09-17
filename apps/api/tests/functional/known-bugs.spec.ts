import { buildNewAlbum } from '@api/data-models/album.builder';
import { buildNewComment } from '@api/data-models/comment.builder';
import { buildNewPhoto } from '@api/data-models/photo.builder';
import { buildNewPost } from '@api/data-models/post.builder';
import { buildNewTodo } from '@api/data-models/todo.builder';
import { buildNewUser } from '@api/data-models/user.builder';
import { expect, test } from '@api/fixtures/clients.fixture';

// Known JSONPlaceholder bugs, pinned with test.fail. Each test asserts the correct behavior, so it fails while the bug
// is there. Once the API is fixed, Playwright reports an unexpected pass: then remove test.fail.
const RESOURCES = [
  { resource: 'posts', buildNew: buildNewPost },
  { resource: 'comments', buildNew: buildNewComment },
  { resource: 'albums', buildNew: buildNewAlbum },
  { resource: 'photos', buildNew: buildNewPhoto },
  { resource: 'todos', buildNew: buildNewTodo },
  { resource: 'users', buildNew: buildNewUser },
] as const;

for (const { resource, buildNew } of RESOURCES) {
  test.describe(resource, () => {
    test.use({ resource });

    // Ids are positive integers, so 0 can never exist.
    test.fail(
      'replace (PUT) on a missing id returns 404',
      { annotation: { type: 'issue', description: 'Returns 500: the server throws reading the id of a missing record' } },
      async ({ api }) => {
        const response = await api.replace(0, buildNew());

        expect(response.status()).toBe(404);
      },
    );

    test.describe('with a JSON content type', () => {
      // The body is a raw string, so the JSON content type has to be set by hand. Without it the API ignores the body
      // and returns 201. This replaces the config's extra headers for these tests only.
      test.use({ extraHTTPHeaders: { 'Content-Type': 'application/json' } });

      test.fail(
        'create (POST) with malformed JSON returns 400',
        { annotation: { type: 'issue', description: "Returns 500: the JSON parse error isn't handled" } },
        async ({ api }) => {
          const response = await api.create('{"title": ');

          expect(response.status()).toBe(400);
        },
      );
    });
  });
}
