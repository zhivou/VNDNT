# UI testing practices

Rules for browser tests written with Playwright Test. The [general practices](general.md) apply too.

## 1. What to test in the UI

- User journeys and UI behavior: navigation, forms, feedback messages, state that the user can see change.
- Test what users see and do, not how it's built. Don't assert on CSS classes, component internals or DOM structure.
- Move data permutations and business-rule checks to [API tests](api-tests.md). A UI test that checks 20 input combinations belongs at a lower layer.
- Don't test third-party sites or services you don't control. Mock them (see [section 7](#7-network-control)).

## 2. Locators

Pick locators the way a user or assistive technology finds elements. In order of preference:

1. `getByRole('button', { name: 'Log in' })`: role plus accessible name
2. `getByLabel('Password')`: form fields
3. `getByPlaceholder('Search')`
4. `getByText('Welcome back')`: non-interactive content
5. `getByAltText()` / `getByTitle()`
6. `getByTestId('checkout')`: when there's no stable user-facing handle. If the app uses a custom attribute, set `use: { testIdAttribute: 'data-test' }` in the config.
7. CSS or XPath: last resort only, with a comment explaining why

```ts
// Good: resilient and readable
await page.getByRole('button', { name: 'Add to cart' }).click();

// Bad: breaks on any markup or styling change
await page.locator('#root > div > div:nth-child(2) > button.btn_primary').click();
```

**Scope locators with chaining and filtering** instead of using indexes:

```ts
const product = page.getByTestId('inventory-item').filter({ hasText: 'Backpack' });
await product.getByRole('button', { name: 'Add to cart' }).click();
```

- Avoid `first()`, `last()` and `nth()` unless order is what you're testing.
- Locators are **strict**: an action on a locator that matches several elements throws. Treat that as a signal to write a more precise locator. Don't reach for `first()` to silence it.
- Locators are lazy. Define them once, in a page object or at the top of a test, and they re-resolve each time they're used. Don't use `ElementHandle` (`page.$`, `page.$$`).
- Use `npx playwright codegen <url>` or the locator picker in UI mode to find good locators quickly.

## 3. Waiting: let Playwright do it

Playwright is built around **auto-waiting**. Every action waits until its target is ready, and every web-first assertion retries until it passes or times out. Explicit waits are almost never needed, and most flaky UI tests come from adding them.

Reference: [Auto-waiting (actionability)](https://playwright.dev/docs/actionability)

### 3.1 Actions wait for actionability

Before acting, Playwright checks the element and **keeps retrying** until every required check passes or the timeout expires:

| Check | Meaning |
|---|---|
| **Visible** | Non-empty bounding box and no `visibility: hidden` |
| **Stable** | Same bounding box for at least two consecutive animation frames (not animating) |
| **Receives events** | It's the actual hit target, not covered by an overlay, spinner or modal |
| **Enabled** | Not `disabled`, and not inside a disabled `fieldset` or an `aria-disabled` ancestor |
| **Editable** | Enabled and not `readonly` |

| Action | Visible | Stable | Receives events | Enabled | Editable |
|---|:-:|:-:|:-:|:-:|:-:|
| `click()`, `dblclick()`, `check()`, `uncheck()`, `setChecked()`, `tap()` | ✓ | ✓ | ✓ | ✓ | – |
| `hover()`, `dragTo()` | ✓ | ✓ | ✓ | – | – |
| `screenshot()` | ✓ | ✓ | – | – | – |
| `fill()`, `clear()` | ✓ | – | – | ✓ | ✓ |
| `selectOption()` | ✓ | – | – | ✓ | – |
| `selectText()` | ✓ | – | – | – | – |
| `scrollIntoViewIfNeeded()` | – | ✓ | – | – | – |
| `focus()`, `blur()`, `press()`, `pressSequentially()`, `setInputFiles()`, `dispatchEvent()` | – | – | – | – | – |

In practice:

- `click()` already waits for the button to appear, stop animating, become enabled and stop being covered by a loading overlay. **Don't wait for any of that yourself.**
- `fill()` already waits for the input to be visible, enabled and editable, and it replaces the existing value. You don't need `clear()` first.

### 3.2 Web-first assertions retry

`expect(locator)` assertions poll until the condition holds (default timeout: 5 s):

```ts
await expect(page.getByRole('alert')).toBeVisible();
await expect(page.getByTestId('cart-badge')).toHaveText('2');
await expect(page.getByRole('listitem')).toHaveCount(6);
await expect(page).toHaveURL(/\/checkout/);
await expect(page.getByRole('button', { name: 'Finish' })).toBeEnabled();
```

Common ones include `toBeVisible`, `toBeHidden`, `toBeEnabled`, `toBeDisabled`, `toBeChecked`, `toBeFocused`, `toHaveText`, `toContainText`, `toHaveValue`, `toHaveCount`, `toHaveAttribute`, `toHaveURL`, `toHaveTitle` and `toHaveScreenshot`.

Methods like `isVisible()`, `isEnabled()`, `isChecked()`, `textContent()`, `innerText()`, `inputValue()`, `count()` and `allTextContents()` **don't retry**. They read the current state once. Wrapping them in a plain `expect` creates a race condition:

```ts
// Bad: checks once, right now, and fails if the UI is a few ms behind
expect(await page.getByRole('alert').isVisible()).toBe(true);
expect(await page.getByTestId('cart-badge').textContent()).toBe('2');

// Good: retries until true or timeout
await expect(page.getByRole('alert')).toBeVisible();
await expect(page.getByTestId('cart-badge')).toHaveText('2');
```

### 3.3 Wait for an action's result by asserting on it

To know an action finished, assert on the outcome the user would see. Don't add a wait step.

```ts
// Bad
await page.getByRole('button', { name: 'Log in' }).click();
await page.waitForTimeout(2000);
await page.waitForLoadState('networkidle');
await page.waitForSelector('.inventory_list');

// Good
await page.getByRole('button', { name: 'Log in' }).click();
await expect(page).toHaveURL(/\/inventory/);
await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
```

### 3.4 Waiting do's and don'ts

| Don't | Do instead |
|---|---|
| `page.waitForTimeout(ms)` (fixed sleeps) | Assert on the expected state with a web-first assertion |
| `waitForSelector()` / `locator.waitFor()` before an action | Just perform the action. It auto-waits |
| `waitForLoadState('networkidle')` (discouraged by Playwright) | Assert on the element or URL that shows the page is ready |
| `waitForNavigation()` (deprecated) | `await expect(page).toHaveURL(...)` |
| `expect(await locator.isVisible()).toBe(true)` | `await expect(locator).toBeVisible()` |
| `{ force: true }` to "fix" a click | Find what's blocking the element. Force skips checks and hides real bugs, like an overlay the user can't click through |
| Raising timeouts to make a test pass | Find the actual race. Tune timeouts only for known slow operations, in one place |
| Waiting for a spinner to disappear before clicking | Click. The "receives events" check waits for the overlay to go away |

### 3.5 When explicit waiting is right

- **The network response is what you're testing,** or there's no visible UI signal. Start listening **before** the action that triggers the request:

  ```ts
  const responsePromise = page.waitForResponse(
    (r) => r.url().includes('/api/orders') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Place order' }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  ```

- **Conditions that aren't about a locator:** use `expect.poll()`:

  ```ts
  await expect.poll(() => getOrderStatus(orderId)).toBe('shipped');
  ```

- **A block of steps that has to succeed together:** use `expect(async () => { ... }).toPass()`. Use it sparingly, and only when the steps are safe to repeat.
- **Waiting for something to go away without asserting on anything else:** `await expect(locator).toBeHidden()`.

### 3.6 Timeouts

Configure timeouts centrally in `playwright.config.ts`, never ad hoc in tests:

```ts
export default defineConfig({
  timeout: 30_000,            // per test
  expect: { timeout: 5_000 }, // per web-first assertion
  use: {
    actionTimeout: 10_000,     // default is 0 (bounded only by the test timeout); a value gives faster, clearer failures
    navigationTimeout: 15_000,
  },
});
```

## 4. Page objects

- A page object holds **locators** as readonly fields and **user-level actions** as methods, such as `login(user)` or `addToCart(productName)`. Don't wrap every single click in its own method.
- **Assertions belong in tests.** Page objects expose locators so tests can assert on them. A small "page is loaded" check, like `expectLoaded()`, is an acceptable exception.
- Use **components** for UI that repeats across pages (header, product card, cart row), and compose them into page objects.
- Page objects contain **no waits or sleeps**. Auto-waiting covers them.
- Provide page objects through **fixtures**, not `new LoginPage(page)` in every test.
- Name methods after user intent (`checkout()`), not mechanics (`clickButton3()`).

```ts
export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByPlaceholder('Username');
    this.password = page.getByPlaceholder('Password');
    this.submit = page.getByRole('button', { name: 'Login' });
    this.error = page.getByTestId('error');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }
}
```

## 5. Authentication

- Test the login UI itself in **dedicated login tests** only.
- Every other test starts logged in. Log in once in a **setup project**, save `storageState` and reuse it:

  ```ts
  // playwright.config.ts
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    { name: 'chromium', use: { storageState: '.auth/user.json' }, dependencies: ['setup'] },
  ]
  ```

- Keep one storage-state file per role or user type. Add `.auth/` to `.gitignore`.
- If the app keeps state only on the client and doesn't restore it from storage state, log in through a fixture instead. Keep it fast and in one place.

## 6. Isolation

- Playwright gives each test a **new browser context**: clean cookies, storage and cache. Don't work around this by sharing a `page` across tests.
- Reset or prepare app state through the API or fixtures, not by clicking through the UI in `beforeEach`.
- Don't let tests depend on the state of a shared user account, such as items another test left in a cart.

## 7. Network control

- Mock third-party and unstable dependencies with `page.route()`.
- Use routing to reach states that are hard to trigger for real: server errors, empty responses, slow responses.

  ```ts
  await page.route('**/api/products', (route) => route.fulfill({ status: 500 }));
  await page.goto('/products');
  await expect(page.getByRole('alert')).toContainText('Something went wrong');
  ```

- Don't mock the system under test in end-to-end tests. That turns them into component tests.

## 8. Navigation

- Set `baseURL` in the config and navigate with relative paths: `page.goto('/cart')`.
- `goto()` already waits for the `load` event. Add a web-first assertion for the element that shows the page is ready, not an extra wait.

## 9. Browsers, viewports and visual checks

- Choose browser coverage on purpose: run the full suite on every browser you support, or only on Chromium if the product doesn't need more. Use `projects` and `devices['Pixel 7']`-style presets for mobile emulation.
- Visual comparisons (`toHaveScreenshot`) are powerful but brittle. Mask dynamic content (`mask: [...]`), generate baselines in the same OS and browser as CI (for example with the Playwright Docker image) and use them only where layout really matters.

## 10. Accessibility

- Role-based locators already push the app toward accessible markup. A locator that's hard to write is often an accessibility bug worth reporting.
- For key pages, consider automated scans with `@axe-core/playwright`, and report violations as findings.

## 11. Debugging

- `npx playwright test --ui`: watch mode, time-travel through actions and pick locators
- `npx playwright test --debug`: Playwright Inspector, step through actions
- `npx playwright show-trace trace.zip`: inspect a CI failure (DOM snapshots, network, console)
- `await page.pause()`: local debugging only. Never commit it.

## UI review checklist

- [ ] Locators are user-facing (role, label, text, test ID) with no brittle CSS or XPath chains
- [ ] No `waitForTimeout`, `waitForSelector`, `networkidle` or `force: true`
- [ ] All state checks use web-first `expect(locator)` / `expect(page)` assertions
- [ ] Each action's result is confirmed by asserting on a visible outcome
- [ ] Page objects hold locators and actions, and tests hold the assertions
- [ ] Login is reused through storage state, except in tests of login itself
- [ ] The test passes in a fresh context, alone and in parallel
