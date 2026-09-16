import { expect, test as setup } from '@api/fixtures/clients.fixture';

setup('JSONPlaceholder responds', async ({ postsApi }) => {
  const response = await postsApi.get(1);

  await expect(response).toBeOK();
});
