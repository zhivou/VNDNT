import { BaseApi } from '@api/clients/base.api';

export class TodosApi extends BaseApi {
  protected override readonly path = '/todos';
}
