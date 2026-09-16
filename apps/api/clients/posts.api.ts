import type { APIRequestContext, APIResponse } from '@playwright/test';

// Returns the raw APIResponse so tests can assert on status, headers and body, including negative cases.
export class PostsApi {
  constructor(private readonly request: APIRequestContext) {}

  get(id: number): Promise<APIResponse> {
    return this.request.get(`/posts/${id}`);
  }
}
