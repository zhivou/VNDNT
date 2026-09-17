import { buildNewAlbum } from '@api/data-models/album.builder';
import { albumSchema } from '@api/data-models/album.model';
import { expect, test } from '@api/fixtures/clients.fixture';

// JSONPlaceholder fakes writes: it answers like a real API but saves nothing, so these tests check only the response.
test.describe('CRUD', { tag: '@p2' }, () => {
  test('create echoes the new album with a generated id', async ({ albumsApi }) => {
    const album = buildNewAlbum();

    const response = await albumsApi.create(album);

    expect(response.status()).toBe(201);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(albumSchema);
    expect(body).toEqual({ ...album, id: expect.any(Number) });
  });

  test('replace (PUT) echoes the full new album', async ({ albumsApi, existingAlbumId }) => {
    const album = buildNewAlbum();

    const response = await albumsApi.replace(existingAlbumId, album);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(albumSchema);
    expect(body).toEqual({ ...album, id: existingAlbumId });
  });

  test('update (PATCH) applies the sent fields', async ({ albumsApi, existingAlbumId }) => {
    const changes = { title: buildNewAlbum().title };

    const response = await albumsApi.update(existingAlbumId, changes);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(albumSchema);
    expect(body).toMatchObject({ ...changes, id: existingAlbumId });
  });

  test('delete returns an empty body', async ({ albumsApi, existingAlbumId }) => {
    const response = await albumsApi.delete(existingAlbumId);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toEqual({});
  });
});
