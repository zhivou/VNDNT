import { expect as baseExpect, test as base } from '@playwright/test';
import { AlbumsApi } from '@api/clients/albums.api';
import type { BaseApi } from '@api/clients/base.api';
import { CommentsApi } from '@api/clients/comments.api';
import { PhotosApi } from '@api/clients/photos.api';
import { PostsApi } from '@api/clients/posts.api';
import { TodosApi } from '@api/clients/todos.api';
import { UsersApi } from '@api/clients/users.api';
import { schemaMatchers } from '@api/utils/matchers';
import { readRecords, type ListedRecord } from '@api/utils/records';

export const expect = baseExpect.extend(schemaMatchers);

export type Clients = {
  posts: PostsApi;
  comments: CommentsApi;
  albums: AlbumsApi;
  photos: PhotosApi;
  todos: TodosApi;
  users: UsersApi;
};
export type Resource = keyof Clients;

type ClientFixtures = {
  clients: Clients;
  albumsApi: AlbumsApi;
  commentsApi: CommentsApi;
  photosApi: PhotosApi;
  postsApi: PostsApi;
  todosApi: TodosApi;
  usersApi: UsersApi;
};

// JSONPlaceholder saves no writes, so a test can't create the record it reads, replaces, updates or deletes.
// These fixtures find an existing one at runtime instead of hardcoding an id: the first record the collection lists.
type ExistingRecordFixtures = {
  existingAlbumId: number;
  existingCommentId: number;
  existingPhotoId: number;
  existingPostId: number;
  existingTodoId: number;
  existingUserId: number;
};

// For tests that run the same checks against every resource. Pick the resource per describe with
// test.use({ resource: 'posts' }), then use api, existingRecord and allRecords for that resource.
type ResourceFixtures = {
  resource: Resource | undefined;
  api: BaseApi;
  existingRecord: ListedRecord;
  allRecords: ListedRecord[];
};

const firstListedRecord = async (api: BaseApi): Promise<ListedRecord> => {
  const response = await api.list({ _limit: 1 });
  await expect(response, 'list the collection to find an existing record').toBeOK();
  const [record] = await readRecords(response);
  if (!record) throw new Error(`${response.url()} returned no records, so there is no existing record to test with`);
  return record;
};

export const test = base.extend<ClientFixtures & ExistingRecordFixtures & ResourceFixtures>({
  clients: async ({ request }, use) => {
    await use({
      posts: new PostsApi(request),
      comments: new CommentsApi(request),
      albums: new AlbumsApi(request),
      photos: new PhotosApi(request),
      todos: new TodosApi(request),
      users: new UsersApi(request),
    });
  },
  albumsApi: async ({ clients }, use) => {
    await use(clients.albums);
  },
  commentsApi: async ({ clients }, use) => {
    await use(clients.comments);
  },
  photosApi: async ({ clients }, use) => {
    await use(clients.photos);
  },
  postsApi: async ({ clients }, use) => {
    await use(clients.posts);
  },
  todosApi: async ({ clients }, use) => {
    await use(clients.todos);
  },
  usersApi: async ({ clients }, use) => {
    await use(clients.users);
  },

  existingAlbumId: async ({ albumsApi }, use) => {
    await use((await firstListedRecord(albumsApi)).id);
  },
  existingCommentId: async ({ commentsApi }, use) => {
    await use((await firstListedRecord(commentsApi)).id);
  },
  existingPhotoId: async ({ photosApi }, use) => {
    await use((await firstListedRecord(photosApi)).id);
  },
  existingPostId: async ({ postsApi }, use) => {
    await use((await firstListedRecord(postsApi)).id);
  },
  existingTodoId: async ({ todosApi }, use) => {
    await use((await firstListedRecord(todosApi)).id);
  },
  existingUserId: async ({ usersApi }, use) => {
    await use((await firstListedRecord(usersApi)).id);
  },

  resource: [undefined, { option: true }],
  api: async ({ clients, resource }, use) => {
    if (!resource) throw new Error("Pick the resource first, e.g. test.use({ resource: 'posts' })");
    await use(clients[resource]);
  },
  existingRecord: async ({ api }, use) => {
    await use(await firstListedRecord(api));
  },
  allRecords: async ({ api }, use) => {
    const response = await api.list();
    await expect(response, 'list the whole collection').toBeOK();
    await use(await readRecords(response));
  },
});
