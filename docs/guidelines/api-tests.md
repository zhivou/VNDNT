# API testing practices

Rules for API tests written with Playwright Test's `APIRequestContext`. The [general practices](general.md) apply too.

Reference: [Playwright API testing](https://playwright.dev/docs/api-testing)

## 1. Tooling

- Use the built-in **`request` fixture**. It sends HTTP requests straight from Node, with no browser, and picks up `baseURL` and `extraHTTPHeaders` from the config.
- Give API tests their **own project** with its own `baseURL`, so UI and API settings never mix:

  ```ts
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: process.env.API_BASE_URL,
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },
  ]
  ```

- UI tests can use the same API layer to **set up preconditions** or **check server state** after a UI action.

## 2. What to cover per endpoint

| Area | Examples |
|---|---|
| **Status code** | `200`/`201`/`204` on success. Assert the *exact* code when the contract defines it. |
| **Contract / schema** | Required fields exist, types are correct, no unexpected shape changes. Validate with a schema library (e.g. Zod or Ajv). |
| **Data correctness** | Returned values match what was requested or created. Filters and query parameters really filter. |
| **Headers** | `Content-Type`, caching and pagination headers where relevant |
| **Negative cases** | Unknown ID → `404`. Malformed body, missing required fields or wrong types → `4xx`. Unsupported method → `404`/`405`. |
| **Auth** | Missing, invalid or expired credentials → `401`. Insufficient permissions → `403`. |
| **Boundaries** | Empty results, first and last page, max lengths, special characters and Unicode, very large or zero values |
| **Lifecycle** | Create → read → update → delete → confirm the resource is gone |
| **Idempotency and side effects** | `GET` changes nothing. Repeating `PUT`/`DELETE` behaves as documented. |

**Know your backend.** Some sandbox or mock APIs return success for writes without persisting them. Check what the API actually guarantees before you write read-after-write assertions, and record that decision in the test.

## 3. Assertions

- `await expect(response).toBeOK()` checks for a 2xx status and, on failure, prints the response details. That's better than `expect(response.ok()).toBeTruthy()`.
- When the exact code matters, assert it: `expect(response.status()).toBe(201)`.
- Parse the body once: `const body = await response.json()`.
- Partial matching: `expect(body).toMatchObject({ title: payload.title })`. Exact matching with `toEqual` only where the contract requires it.
- **Echo checks:** whatever you sent in a create or update request should come back in the response.
- **Volatile values** (generated IDs, timestamps): assert type and format, not exact values:

  ```ts
  expect(body).toMatchObject({
    id: expect.any(Number),
    createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
  });
  ```

- A response is a finished value, so plain `expect` matchers are correct here. No retrying needed.
- **Eventual consistency** (async processing, queues): poll with `expect.poll()` or `toPass()`. Never sleep.

  ```ts
  await expect.poll(async () => (await api.getOrder(id)).status, { timeout: 15_000 }).toBe('completed');
  ```

- Use `expect.soft()` when checking many independent fields, so one run reports every mismatch.

## 4. Structure

**API clients.** Write one small class per resource that wraps `APIRequestContext`. Tests describe *what* they do, and clients know *how*:

```ts
export class UsersApi {
  constructor(private readonly request: APIRequestContext) {}

  list(params?: { page?: number }) {
    return this.request.get('/users', { params });
  }

  get(id: number) {
    return this.request.get(`/users/${id}`);
  }

  create(user: NewUser) {
    return this.request.post('/users', { data: user });
  }

  delete(id: number) {
    return this.request.delete(`/users/${id}`);
  }
}
```

- **Clients return the raw `APIResponse`,** so tests can assert on status, headers and body, including negative cases. If you add typed convenience helpers, add them next to the raw methods, not instead of them.
- Keep **paths in the client**, not scattered through specs.
- Write **types** for request and response models, and use the same types as the source of truth for schema validation.
- **Data builders** supply valid defaults with overrides, so each test states only what matters to it:

  ```ts
  export const buildUser = (overrides: Partial<NewUser> = {}): NewUser => ({
    name: `Test User ${crypto.randomUUID().slice(0, 8)}`,
    email: `user-${crypto.randomUUID()}@example.test`,
    ...overrides,
  });

  test('rejects a user without an email', async ({ usersApi }) => {
    const response = await usersApi.create(buildUser({ email: undefined }));
    expect(response.status()).toBe(400);
  });
  ```

- Provide clients through **fixtures**:

  ```ts
  export const test = base.extend<{ usersApi: UsersApi }>({
    usersApi: async ({ request }, use) => {
      await use(new UsersApi(request));
    },
  });
  ```

## 5. Test data and cleanup

- Each test creates the data it needs. Don't depend on records that happen to exist.
- If you must use pre-existing data (a known seeded or read-only dataset), write down that assumption in the test or the fixture.
- **Clean up in fixture teardown.** Code after `use()` runs even when the test fails:

  ```ts
  createdUser: async ({ usersApi }, use) => {
    const response = await usersApi.create(buildUser());
    await expect(response).toBeOK();
    const user = await response.json();
    await use(user);
    await usersApi.delete(user.id);
  },
  ```

- Use unique values (UUIDs, worker index) so parallel tests never collide.

## 6. Authentication

- Read credentials and tokens from environment variables. Never hard-code or commit them.
- Get a token once per worker with a worker-scoped fixture, or in a setup project. Don't log in before every request.
- Keep auth failure tests (`401`/`403`) separate. Build a context without credentials with `playwright.request.newContext()`, and remember to `dispose()` it.
- Never print tokens in logs, test titles or attachments.

## 7. Reporting and debugging

- Use `test.step()` for multi-call flows so the report reads as a scenario.
- Traces record API calls, including request and response headers and bodies. Use them when an API test fails on CI.
- For complex failures, attach the relevant request and response with `testInfo.attach()`, with secrets redacted.

## 8. Parallelism and performance

- API tests are fast and parallel-safe when their data is isolated. Enable `fullyParallel: true` for the API project.
- A lenient response-time sanity check is fine, for example flagging requests that take over 2 s. Load and performance testing belongs in dedicated tools, not in this suite.

## API review checklist

- [ ] Asserts the exact status code, the schema or shape, and the key values
- [ ] Includes negative and boundary cases, not just the happy path
- [ ] Goes through an API client. No raw URLs in the spec.
- [ ] Builds data with builders. Unique values, no reliance on existing records.
- [ ] Cleans up created resources in fixture teardown
- [ ] Volatile fields are checked by type or format, not by exact value
- [ ] No secrets in code, logs or reports
