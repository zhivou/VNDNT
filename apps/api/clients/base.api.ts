import type { APIRequestContext, APIResponse } from '@playwright/test';

export type RequestOptions = NonNullable<Parameters<APIRequestContext['fetch']>[1]>;

// Ids and request bodies (unknown) are loosely typed on purpose, so tests can also send invalid ones.
export type ResourceId = number | string;

// Base for every resource client: the CRUD routes JSONPlaceholder gives each resource, and the request
// settings all clients share. Returns the raw APIResponse so tests can assert on status, headers and body,
// including negative cases.
export abstract class BaseApi {
  // Shared by every client. Headers merge key by key, and any other option a call sets replaces the shared one.
  // The base URL and Accept header come from apps/api/playwright.config.ts.
  protected readonly defaults: RequestOptions = {};

  // The collection path, e.g. '/posts'.
  protected abstract readonly path: string;

  constructor(protected readonly request: APIRequestContext) {}

  // Query params filter, sort and page the collection, e.g. { userId: 1, _limit: 10 }.
  list(params?: RequestOptions['params']): Promise<APIResponse> {
    return this.send('GET', this.path, params === undefined ? {} : { params });
  }

  get(id: ResourceId): Promise<APIResponse> {
    return this.send('GET', this.itemPath(id));
  }

  create(data: unknown): Promise<APIResponse> {
    return this.send('POST', this.path, { data });
  }

  // PUT: sends the whole resource.
  replace(id: ResourceId, data: unknown): Promise<APIResponse> {
    return this.send('PUT', this.itemPath(id), { data });
  }

  // PATCH: sends only the fields that change.
  update(id: ResourceId, data: unknown): Promise<APIResponse> {
    return this.send('PATCH', this.itemPath(id), { data });
  }

  delete(id: ResourceId): Promise<APIResponse> {
    return this.send('DELETE', this.itemPath(id));
  }

  protected itemPath(id: ResourceId): string {
    return `${this.path}/${id}`;
  }

  protected send(method: string, url: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.request.fetch(url, {
      ...this.defaults,
      ...options,
      method,
      headers: { ...this.defaults.headers, ...options.headers },
    });
  }
}
