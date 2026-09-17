import type { APIResponse } from '@playwright/test';
import { BaseApi, type ResourceId } from '@api/clients/base.api';

export class PostsApi extends BaseApi {
  protected override readonly path = '/posts';

  listComments(postId: ResourceId): Promise<APIResponse> {
    return this.send('GET', `${this.itemPath(postId)}/comments`);
  }
}
