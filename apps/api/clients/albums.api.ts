import type { APIResponse } from '@playwright/test';
import { BaseApi, type ResourceId } from '@api/clients/base.api';

export class AlbumsApi extends BaseApi {
  protected override readonly path = '/albums';

  listPhotos(albumId: ResourceId): Promise<APIResponse> {
    return this.send('GET', `${this.itemPath(albumId)}/photos`);
  }
}
