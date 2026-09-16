import { expect as baseExpect, test as base } from '@playwright/test';
import { PostsApi } from '@api/clients/posts.api';
import { schemaMatchers } from '@api/utils/matchers';

type ClientFixtures = {
  postsApi: PostsApi;
};

export const test = base.extend<ClientFixtures>({
  postsApi: async ({ request }, use) => {
    await use(new PostsApi(request));
  },
});

export const expect = baseExpect.extend(schemaMatchers);
