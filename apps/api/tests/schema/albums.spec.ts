import { albumSchema } from '@api/data-models/album.model';
import { expect, test } from '@api/fixtures/clients.fixture';

// These tests check types and structure against our own schemas, never the dataset's content.

test.describe('schema', () => {
  test('list returns albums matching the schema', async ({ albumsApi }) => {
    const response = await albumsApi.list();

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    const body: unknown = await response.json();
    expect(body).toMatchSchema(albumSchema.array().min(1));
  });

  test('get returns the requested album matching the schema', async ({ albumsApi, existingAlbumId }) => {
    const response = await albumsApi.get(existingAlbumId);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(albumSchema);
    expect(body).toMatchObject({ id: existingAlbumId });
  });

  // Ids are positive integers, so 0 can never exist.
  test('get returns 404 for an album id that cannot exist', async ({ albumsApi }) => {
    const response = await albumsApi.get(0);

    expect(response.status()).toBe(404);
    const body: unknown = await response.json();
    expect(body).toEqual({});
  });
});
