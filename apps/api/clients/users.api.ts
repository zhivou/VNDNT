import type { APIResponse } from '@playwright/test';
import { BaseApi, type ResourceId } from '@api/clients/base.api';

export class UsersApi extends BaseApi {
  protected override readonly path = '/users';

  listPosts(userId: ResourceId): Promise<APIResponse> {
    return this.send('GET', `${this.itemPath(userId)}/posts`);
  }

  listAlbums(userId: ResourceId): Promise<APIResponse> {
    return this.send('GET', `${this.itemPath(userId)}/albums`);
  }

  listTodos(userId: ResourceId): Promise<APIResponse> {
    return this.send('GET', `${this.itemPath(userId)}/todos`);
  }
}
