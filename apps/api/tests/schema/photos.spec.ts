import { photoSchema } from '@api/data-models/photo.model';
import { expect, test } from '@api/fixtures/clients.fixture';

// These tests check types and structure against our own schemas, never the dataset's content.

test.describe('schema', { tag: '@p1' }, () => {
  test('list returns photos matching the schema', async ({ photosApi }) => {
    const response = await photosApi.list();

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    const body: unknown = await response.json();
    expect(body).toMatchSchema(photoSchema.array().min(1));
  });

  test('get returns the requested photo matching the schema', async ({ photosApi, existingPhotoId }) => {
    const response = await photosApi.get(existingPhotoId);

    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(body).toMatchSchema(photoSchema);
    expect(body).toMatchObject({ id: existingPhotoId });
  });

  // Ids are positive integers, so 0 can never exist.
  test('get returns 404 for a photo id that cannot exist', async ({ photosApi }) => {
    const response = await photosApi.get(0);

    expect(response.status()).toBe(404);
    const body: unknown = await response.json();
    expect(body).toEqual({});
  });
});
