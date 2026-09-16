# Checkout Test Plan

## Application Overview

SauceDemo (https://www.saucedemo.com) checkout runs across three pages, starting from "Checkout" on the cart page (`specs/cart.md` 4.3):

- `/checkout-step-one.html`, "Checkout: Your Information": First Name, Last Name and Zip/Postal Code, with "Cancel" and "Continue". A missing field shows an alert with a "Dismiss error" button.
- `/checkout-step-two.html`, "Checkout: Overview": one row per product (quantity, name, description and price, with no "Remove" button), "Payment Information: SauceCard #31337", "Shipping Information: Free Pony Express Delivery!" and the totals, with "Cancel" and "Finish".
- `/checkout-complete.html`, "Checkout: Complete!": the "Pony Express" image, the heading "Thank you for your order!", the text "Your order has been dispatched, and will arrive just as fast as the pony can get there!", "Back Home" and "Generate PDF order".

Moving between the pages is a client-side navigation, so the URL changes before the new page renders.

All scenarios run **logged in as standard_user**. Logged-out visitors are sent to the login page from every checkout page, which `specs/auth.md` section 5 covers.

**Synthetic data.** The store is treated as data the test automation seeded, so expected results describe what checkout is **meant** to do, not whatever the site does. Products and prices come from the catalog oracle, `apps/ui/data-models/product-catalog.oracle.ts`, and the checkout texts, errors and incomplete-information cases from the checkout oracle, `apps/ui/data-models/checkout.oracle.ts`. When the site differs, the test fails and the difference is a finding (see Notes).

**Starting state.** The cart lives only in localStorage (see `specs/cart.md`), so scenarios start with it filled by the `fillCart` fixture. With products in the cart, a scenario may open `/checkout-step-one.html` directly, because that's where checkout starts. The buyer is Ada Lovelace, postal code 10001.

**Totals.** The overview's item total, tax and total are checked for carts of every size in `specs/cart.md` 6.1, so they aren't repeated here.

## Test Scenarios

### 1. Completing checkout

**Seed:** `apps/ui/tests/seed.spec.ts`

#### 1.1. The buyer places an order from the cart

**File:** `apps/ui/tests/checkout.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack, Sauce Labs Bike Light. Open `/cart.html` and click "Checkout".
    - expect: The URL is `/checkout-step-one.html` and the title reads "Checkout: Your Information".
  2. Fill First Name, Last Name and Zip/Postal Code, then click "Continue".
    - expect: The URL is `/checkout-step-two.html` and the title reads "Checkout: Overview".
  3. Click "Finish".
    - expect: The URL is `/checkout-complete.html` and the title reads "Checkout: Complete!".

#### 1.2. The confirmation page confirms the order

**File:** `apps/ui/tests/checkout.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack. Submit the information on `/checkout-step-one.html` and click "Finish".
    - expect: The heading reads "Thank you for your order!".
    - expect: The text, the image's alt text and the "Back Home" button match the overview above.

#### 1.3. Placing the order empties the cart

**File:** `apps/ui/tests/checkout.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack, Sauce Labs Bike Light. Submit the information.
    - expect: The cart badge shows "2".
  2. Click "Finish".
    - expect: The confirmation shows and the cart badge is gone.
  3. Open `/cart.html`.
    - expect: The title reads "Your Cart" and no rows are shown.

#### 1.4. Back Home returns to the product list

**File:** `apps/ui/tests/checkout.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack. Place the order, then click "Back Home".
    - expect: The URL is `/inventory.html` and all 6 products are listed.
    - expect: No product shows "Remove".

#### 1.5. Generate PDF order downloads a receipt

**File:** `apps/ui/tests/checkout.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack. Place the order, then click "Generate PDF order".
    - expect: A file downloads named `swag-labs-order-<YYYY-MM-DD>_<HH-MM-SS>.pdf`.

### 2. Overview

**Seed:** `apps/ui/tests/seed.spec.ts`

#### 2.1. The overview lists every product in cart order with its intended details

**File:** `apps/ui/tests/checkout.spec.ts`

**Steps:**
  1. Starting cart: all 6 products, in the reverse of the catalog's default order, so rows that followed the catalog instead of the cart would fail. Submit the information.
    - expect: Exactly 6 rows are shown.
  2. Data-driven: compare each row, top to bottom, with the product at the same position in the cart.
    - expect: Quantity "1", and the name, description and price from the oracle.

#### 2.2. The overview shows the payment and shipping information

**File:** `apps/ui/tests/checkout.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack. Submit the information.
    - expect: Payment Information reads "SauceCard #31337".
    - expect: Shipping Information reads "Free Pony Express Delivery!".

#### 2.3. Cancel on the overview returns to the product list and keeps the cart

**File:** `apps/ui/tests/checkout.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack, Sauce Labs Bike Light. Submit the information, then click "Cancel".
    - expect: The URL is `/inventory.html`.
    - expect: Two cards show "Remove" and the cart badge shows "2".

### 3. Your information

**Seed:** `apps/ui/tests/seed.spec.ts`

#### 3.1. Incomplete information is rejected

**File:** `apps/ui/tests/checkout.spec.ts`

**Steps:**
  1. Data-driven, one test per row. Starting cart: Sauce Labs Backpack. Open `/checkout-step-one.html`, fill the form as the row says (other fields filled in) and click "Continue".
    - expect: The alert shows the row's error: the first field that's missing, top to bottom.
    - expect: The buyer stays on `/checkout-step-one.html`.

| Information | Error |
|---|---|
| Every field empty | Error: First Name is required |
| First Name empty | Error: First Name is required |
| Last Name empty | Error: Last Name is required |
| Zip/Postal Code empty | Error: Postal Code is required |
| First Name of only spaces | Error: First Name is required |
| Last Name of only spaces | Error: Last Name is required |
| Zip/Postal Code of only spaces | Error: Postal Code is required |

A field of only spaces is as empty as a field left blank.

#### 3.2. Dismissing the error hides it

**File:** `apps/ui/tests/checkout.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack. Open `/checkout-step-one.html` and click "Continue" with the form empty.
    - expect: The alert is shown.
  2. Click "Dismiss error".
    - expect: The alert is gone.

#### 3.3. The buyer continues once the missing information is filled in

**File:** `apps/ui/tests/checkout.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack. Open `/checkout-step-one.html`, fill First Name and Last Name only, and click "Continue".
    - expect: The alert is shown.
  2. Fill Zip/Postal Code and click "Continue".
    - expect: The URL is `/checkout-step-two.html` and the title reads "Checkout: Overview".

#### 3.4. Cancel on step one returns to the cart and keeps its products

**File:** `apps/ui/tests/checkout.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack, Sauce Labs Bike Light. Open `/checkout-step-one.html` and click "Cancel".
    - expect: The URL is `/cart.html` and the rows are Sauce Labs Backpack, then Sauce Labs Bike Light.

### 4. Opening a checkout page by its URL

**Seed:** `apps/ui/tests/seed.spec.ts`

Typing a checkout page's URL into the address bar must not skip a step: the security and edge cases of checkout. A checkout page opens only once the steps before it are done. Otherwise the store sends the buyer to the first step that isn't: the cart while it's empty, then Your Information until it's submitted, then the overview until the order is finished.

#### 4.1. Your Information with an empty cart sends the buyer to the cart

**File:** `apps/ui/tests/checkout.spec.ts`

**Steps:**
  1. Empty cart. Open `/checkout-step-one.html` by its URL.
    - expect: The URL is `/cart.html` and the title reads "Your Cart".

#### 4.2. The overview with an empty cart sends the buyer to the cart

**File:** `apps/ui/tests/checkout.spec.ts`

**Steps:**
  1. Empty cart. Open `/checkout-step-two.html` by its URL.
    - expect: The URL is `/cart.html` and the title reads "Your Cart".

#### 4.3. The confirmation with an empty cart sends the buyer to the cart

**File:** `apps/ui/tests/checkout.spec.ts`

**Steps:**
  1. Empty cart. Open `/checkout-complete.html` by its URL.
    - expect: The URL is `/cart.html` and the title reads "Your Cart".

#### 4.4. The overview opens only after the information is submitted

**File:** `apps/ui/tests/checkout.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack, no information submitted. Open `/checkout-step-two.html` by its URL.
    - expect: The URL is `/checkout-step-one.html` and the title reads "Checkout: Your Information".

#### 4.5. The confirmation opens only after the information is submitted

**File:** `apps/ui/tests/checkout.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack, no information submitted. Open `/checkout-complete.html` by its URL.
    - expect: The URL is `/checkout-step-one.html` and the title reads "Checkout: Your Information".

#### 4.6. The confirmation opens only after the order is finished

**File:** `apps/ui/tests/checkout.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack. Submit the information.
    - expect: The title reads "Checkout: Overview".
  2. Open `/checkout-complete.html` by its URL without clicking "Finish".
    - expect: The URL is `/checkout-step-two.html` and the cart badge still shows "1".

## Notes

Observations from exploring the app. They are not test scenarios.

- **Finding:** Sauce Labs Onesie's description reads "hemmed **sleeved**" instead of "sleeves" on the overview too, so 2.1 fails on it.
- **Finding:** First Name, Last Name and Zip/Postal Code each accept a value of only spaces and continue to the overview, so the three "only spaces" rows of 3.1 fail.
- **Finding:** every checkout page opens by its URL, whatever state the cart and checkout are in, so 4.1 to 4.6 all fail:
  - Your Information opens with an empty cart and lets the buyer continue.
  - The overview opens with an empty cart ("Item total: $0", without cents, next to "Tax: $0.00" and "Total: $0.00"), and "Finish" then confirms an order of nothing.
  - The overview opens with a filled cart, skipping the information step (also noted in `specs/cart.md`).
  - The confirmation shows "Thank you for your order!" for an order that was never placed, with the products still in the cart.
- Pressing Back on the confirmation page returns to an empty overview whose "Finish" still works. Section 4 covers the same gap.
- "Generate PDF order" appears only when the order was finished in the same page session. The confirmation opened by its URL has only "Back Home".
- The receipt, checked by hand for a Backpack and Bike Light order, shows the buyer's name and postal code, both products with their prices, and "Item total $39.98", "Tax $3.20", "Total $43.18", all correct. 1.5 checks only the file name: react-pdf compresses the text and stores it as hex glyph codes, so reading it needs a PDF parser, which the repo doesn't have.
- Checkout errors start with "Error:", while the login page's start with "Epic sadface:". The postal code error says "Postal Code" although the field reads "Zip/Postal Code". Neither is clearly a mistake, so no scenario checks the wording beyond the error texts in 3.1.
- Cancel on the overview goes to the product list, not back to the cart or Your Information. 2.3 treats that as intended.
- During validation, 1.4 failed once in about 350 runs: "Back Home" was clicked but the URL stayed on `/checkout-complete.html`. No cause was found. The confirmation's image loads after the page renders and pushes the buttons down 72px, but a delayed image and a layout shift forced mid-click both passed, and 200 more runs of 1.4 passed. The test has no extra wait. If it fails again, keep the trace.
- Deviations on other accounts (the scenarios run as standard_user only):
  - **problem_user:** typing into Last Name changes First Name instead, so Last Name stays empty, "Error: Last Name is required" shows and the order can't be placed.
  - **error_user:** Last Name stays empty after filling it, yet "Continue" opens the overview without an error. "Finish" then logs a TypeError and does nothing, so the buyer stays on the overview with the cart kept.
  - **visual_user** and **performance_glitch_user:** placed an order with the correct totals in the checks made.
