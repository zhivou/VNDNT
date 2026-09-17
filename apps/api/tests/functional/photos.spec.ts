import { buildNewPhoto } from '@api/data-models/photo.builder';
import { photoSchema } from '@api/data-models/photo.model';
import { expect, test } from '@api/fixtures/clients.fixture';

// JSONPlaceholder fakes writes: it answers like a real API but saves nothing, so these tests check only the response.
test.describe('CRUD', { tag: '@p2' }, () => {
  test('create echoes the new photo with a generated id', async ({ photosApi }) => {
    const photo = buildNewPhoto();

    const response = await photosApi.create(photo);

    expect(response.status()).toBe(201);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(photoSchema);
    expect(body).toEqual({ ...photo, id: expect.any(Number) });
  });

  test('replace (PUT) echoes the full new photo', async ({ photosApi, existingPhotoId }) => {
    const photo = buildNewPhoto();

    const response = await photosApi.replace(existingPhotoId, photo);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(photoSchema);
    expect(body).toEqual({ ...photo, id: existingPhotoId });
  });

  test('update (PATCH) applies the sent fields', async ({ photosApi, existingPhotoId }) => {
    const changes = { title: buildNewPhoto().title };

    const response = await photosApi.update(existingPhotoId, changes);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(photoSchema);
    expect(body).toMatchObject({ ...changes, id: existingPhotoId });
  });

  test('delete returns an empty body', async ({ photosApi, existingPhotoId }) => {
    const response = await photosApi.delete(existingPhotoId);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toEqual({});
  });
});
