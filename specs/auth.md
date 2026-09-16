# Authentication Test Plan

## Application Overview

SauceDemo (https://www.saucedemo.com) is a single-page demo store. Authentication is entirely client-side: there is no login API, the login form posts nothing, and a signed-in session is represented only by a `session-username` cookie (localStorage held only unrelated analytics/backtrace keys during these checks, not session data). Every internal link performs a real page navigation (not a client-side route change), so the cookie is (re-)checked on every navigation and reload.

The login page (`/`) accepts one of six fixed usernames — `standard_user`, `locked_out_user`, `problem_user`, `performance_glitch_user`, `error_user`, `visual_user` — all sharing one password (referred to here as "the shared password (SAUCE_PASSWORD)"; its literal value is never written in this plan and is printed at the bottom of the login page under the heading "Password for all users:"). All accounts except `locked_out_user` land on `/inventory.html` (page heading "Products") after a successful login. Validation and authentication errors are shown in an `alert` region with a "Dismiss error" button, always prefixed with "Epic sadface: ". Any protected page (`/inventory.html`, `/inventory-item.html`, `/cart.html`, `/checkout-step-one.html`, `/checkout-step-two.html`, `/checkout-complete.html`) opened without a valid session redirects to `/` with an error naming the requested page's path (its query string, if any, is dropped from the message).

**Seed:** apps/ui/tests/seed.spec.ts — the seed logs in as `standard_user` and leaves the page on `/inventory.html`. Scenarios that need a logged-out visitor must first log out via the side menu, or clear cookies/localStorage with `browser_evaluate`/`context.clearCookies()` and navigate to `/`.

## Test Scenarios

### 1. Login

**Seed:** `apps/ui/tests/seed.spec.ts`

#### 1.1. standard_user logs in and lands on the inventory page

**File:** `apps/ui/tests/auth.spec.ts`

**Steps:**
  1. Starting state: logged out (no session cookie). From the seed's initial page, clear cookies and localStorage, then navigate to https://www.saucedemo.com/.
    - expect: The "Login" form is shown with textbox "Username", textbox "Password" and button "Login".
  2. Fill textbox "Username" with "standard_user" and textbox "Password" with the shared password (SAUCE_PASSWORD), then click button "Login".
    - expect: The page navigates to https://www.saucedemo.com/inventory.html.
    - expect: The page shows the "Products" title.

#### 1.2. Login form can be submitted with the Enter key

**File:** `apps/ui/tests/auth.spec.ts`

**Steps:**
  1. Starting state: logged out (no session cookie), at https://www.saucedemo.com/ (clear cookies/localStorage first if needed).
    - expect: The "Login" form is shown.
  2. Fill textbox "Username" with "standard_user", fill textbox "Password" with the shared password (SAUCE_PASSWORD), then press Enter while focus is in the Password field (do not click the Login button).
    - expect: The page navigates to https://www.saucedemo.com/inventory.html.
    - expect: The "Products" title is shown.

#### 1.3. Each other login-capable account reaches the inventory page

**File:** `apps/ui/tests/auth.spec.ts`

**Steps:**
  1. Starting state: logged out (no session cookie), at https://www.saucedemo.com/. Data-driven: repeat the steps below once for each of these usernames: "problem_user", "performance_glitch_user", "error_user", "visual_user" (each iteration starts logged out again).
  2. Fill textbox "Username" with the account under test, fill textbox "Password" with the shared password (SAUCE_PASSWORD), and click button "Login".
    - expect: The page navigates to https://www.saucedemo.com/inventory.html.
    - expect: The "Products" title is shown.

#### 1.4. Password field hides the typed characters

**File:** `apps/ui/tests/auth.spec.ts`

**Steps:**
  1. Starting state: logged out (no session cookie), at https://www.saucedemo.com/.
  2. Fill textbox "Password" with the shared password (SAUCE_PASSWORD).
    - expect: The Password input is a password field (its type attribute is "password"), so the characters are masked.

### 2. Locked out user

**Seed:** `apps/ui/tests/seed.spec.ts`

#### 2.1. locked_out_user is refused at login

**File:** `apps/ui/tests/auth.spec.ts`

**Steps:**
  1. Starting state: logged out (no session cookie), at https://www.saucedemo.com/.
    - expect: The "Login" form is shown with no error alert.
  2. Fill textbox "Username" with "locked_out_user", fill textbox "Password" with the shared password (SAUCE_PASSWORD), and click button "Login".
    - expect: The URL stays at https://www.saucedemo.com/ (no navigation to /inventory.html occurs).
    - expect: An alert is shown with the exact text "Epic sadface: Sorry, this user has been locked out."

### 3. Login validation

**Seed:** `apps/ui/tests/seed.spec.ts`

#### 3.1. Empty username shows "Username is required" regardless of the password field

**File:** `apps/ui/tests/auth.spec.ts`

**Steps:**
  1. Starting state: logged out (no session cookie), at https://www.saucedemo.com/. Data-driven: run the steps below twice — once leaving Password empty, once filling Password with the shared password (SAUCE_PASSWORD) — leaving Username empty in both cases.
  2. Leave textbox "Username" empty, set textbox "Password" per the variant above, and click button "Login".
    - expect: The URL stays at https://www.saucedemo.com/.
    - expect: An alert is shown with the exact text "Epic sadface: Username is required".

#### 3.2. Empty password shows "Password is required"

**File:** `apps/ui/tests/auth.spec.ts`

**Steps:**
  1. Starting state: logged out (no session cookie), at https://www.saucedemo.com/.
    - expect: The "Login" form is shown with no error alert.
  2. Fill textbox "Username" with "standard_user", leave textbox "Password" empty, and click button "Login".
    - expect: The URL stays at https://www.saucedemo.com/.
    - expect: An alert is shown with the exact text "Epic sadface: Password is required".

#### 3.3. Invalid credentials always show the same generic "do not match" error

**File:** `apps/ui/tests/auth.spec.ts`

**Steps:**
  1. Starting state: logged out (no session cookie), at https://www.saucedemo.com/. Data-driven: run the steps below once for each variant: (a) Username "standard_user" + Password "wrong_password" (a valid username, wrong password); (b) Username "unknown_user" + the shared password (SAUCE_PASSWORD) (an unknown username, correct shared password); (c) Username "Standard_User" (the valid username with its letter case altered) + the shared password (SAUCE_PASSWORD) — checks that the username is case-sensitive; (d) Username "standard_user" + the shared password (SAUCE_PASSWORD) typed with its letter case inverted from how it is shown on the login page — checks that the password is case-sensitive.
  2. Fill textbox "Username" and textbox "Password" per the variant above and click button "Login".
    - expect: For every variant: the URL stays at https://www.saucedemo.com/.
    - expect: An alert is shown with the exact text "Epic sadface: Username and password do not match any user in this service".

#### 3.4. Dismissing an error hides it

**File:** `apps/ui/tests/auth.spec.ts`

**Steps:**
  1. Starting state: logged out (no session cookie), at https://www.saucedemo.com/. Fill textbox "Username" with "standard_user", leave textbox "Password" empty, and click button "Login".
    - expect: An alert with text "Epic sadface: Password is required" is shown.
  2. Click the "Dismiss error" button inside the alert.
    - expect: The alert is no longer present on the page.

### 4. Logout

**Seed:** `apps/ui/tests/seed.spec.ts`

#### 4.1. Logout from the side menu returns the user to the login page

**File:** `apps/ui/tests/auth.spec.ts`

**Steps:**
  1. Starting state: logged in as standard_user (the seed's default state), at https://www.saucedemo.com/inventory.html. Click button "Open Menu".
    - expect: The side menu opens showing button "All Items", button "Dynamic Catalog", link "About", button "Logout" and button "Reset App State".
  2. Click button "Logout".
    - expect: The page navigates to https://www.saucedemo.com/.
    - expect: The "Login" form (textbox "Username", textbox "Password", button "Login") is shown, with no error alert.

#### 4.2. After logout, the inventory page can no longer be opened

**File:** `apps/ui/tests/auth.spec.ts`

**Steps:**
  1. Starting state: logged in as standard_user, at https://www.saucedemo.com/inventory.html. Open the side menu and click button "Logout".
    - expect: The page is at https://www.saucedemo.com/ showing the "Login" form.
  2. Navigate directly to https://www.saucedemo.com/inventory.html.
    - expect: The browser ends at https://www.saucedemo.com/ (redirected back, not showing the inventory page).
    - expect: An alert is shown with the exact text "Epic sadface: You can only access '/inventory.html' when you are logged in."

#### 4.3. Going back in history after logout does not restore the protected page

**File:** `apps/ui/tests/auth.spec.ts`

**Steps:**
  1. Starting state: logged in as standard_user, at https://www.saucedemo.com/inventory.html. Open the side menu and click button "Logout".
    - expect: The page is at https://www.saucedemo.com/ showing the "Login" form with no error alert.
  2. Trigger a browser back navigation (history back) to return to the previously visited /inventory.html entry.
    - expect: The browser ends at https://www.saucedemo.com/ (the protected inventory content is not shown).
    - expect: An alert is shown with the exact text "Epic sadface: You can only access '/inventory.html' when you are logged in."

### 5. Protected pages

**Seed:** `apps/ui/tests/seed.spec.ts`

#### 5.1. Opening a protected page while logged out redirects to login with a page-specific error

**File:** `apps/ui/tests/auth.spec.ts`

**Steps:**
  1. Starting state: logged out (no session cookie). Data-driven: run the steps below once for each URL / expected-message pair: /inventory.html -> "Epic sadface: You can only access '/inventory.html' when you are logged in."; /inventory-item.html?id=4 -> "Epic sadface: You can only access '/inventory-item.html' when you are logged in." (note the query string ?id=4 is dropped from the message — only the path is named); /cart.html -> "Epic sadface: You can only access '/cart.html' when you are logged in."; /checkout-step-one.html -> "Epic sadface: You can only access '/checkout-step-one.html' when you are logged in."; /checkout-step-two.html -> "Epic sadface: You can only access '/checkout-step-two.html' when you are logged in."; /checkout-complete.html -> "Epic sadface: You can only access '/checkout-complete.html' when you are logged in."
  2. Clear cookies and localStorage (ensuring a logged-out state) and navigate directly to the target URL for the current variant.
    - expect: The browser ends at https://www.saucedemo.com/ (root), never showing the requested page's content.
    - expect: An alert is shown containing exactly the expected message for that URL.

#### 5.2. An expired session sends the user to login on the next page load

**File:** `apps/ui/tests/auth.spec.ts`

**Steps:**
  1. Starting state: logged in as standard_user, at https://www.saucedemo.com/inventory.html. Remove the `session-username` cookie (e.g. via the browser context's cookie APIs), which is what happens when the 10-minute session expires.
  2. Reload the page.
    - expect: The browser is redirected to https://www.saucedemo.com/.
    - expect: An alert is shown with the exact text "Epic sadface: You can only access '/inventory.html' when you are logged in."

## Notes

Observations from exploring the app. They are not test scenarios.

- `performance_glitch_user` takes noticeably longer to log in than the other accounts (roughly 5-6 seconds versus about 1 second). The delay is inside the Login click, which stays within the configured 10-second action timeout, so no special timeout is needed.
- Both the Username and Password inputs get the red error state and an X-circle icon on every validation failure, even when only one field is the problem. This looks like a minor UI quirk. It is styling only (CSS classes and icons with no accessible name), so the tests don't assert on it.
- Direct-URL protected-page errors ignore the query string: opening /inventory-item.html?id=4 while logged out names only '/inventory-item.html'.
- The app does not watch the session cookie: removing `session-username` while a protected page is already shown does not redirect right away. Only the next navigation (a reload or any in-app link, all of which are full page loads) is blocked.
- Dismissing an error clears the message and the error styling on the inputs, but keeps whatever was typed into Username and Password. A failed login also keeps the typed values.
- Username and password are both case-sensitive. A case mismatch gets the same generic "do not match" message as a wrong credential.
- The same message, "Epic sadface: Username and password do not match any user in this service", is used for a wrong password, an unknown username and case mismatches, so the app never reveals which field was wrong.
- The session lives only in the `session-username` cookie. localStorage held only unrelated analytics/backtrace keys.
