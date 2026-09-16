import { BaseApi } from '@api/clients/base.api';

export class PhotosApi extends BaseApi {
  protected override readonly path = '/photos';
}
