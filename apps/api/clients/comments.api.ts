import { BaseApi } from '@api/clients/base.api';

export class CommentsApi extends BaseApi {
  protected override readonly path = '/comments';
}
