# Shopping Cart Test Plan

## Application Overview

SauceDemo (https://www.saucedemo.com) shopping cart: products go into the cart from the product list (`/inventory.html`) or a product's details page (`/inventory-item.html?id=N`), the header shows a badge with the number of products in the cart, and the cart page (`/cart.html`) lists them. Opening the cart, a product or checkout is a client-side navigation, so the URL changes before the new page renders.

All scenarios run **logged in as standard_user** and start with an **empty cart** unless a scenario says otherwise.

**Synthetic data.** The store is treated as data the test automation seeded, so expected results describe what the cart is **meant** to do, not whatever the site does. Products and prices come from the catalog oracle, `apps/ui/data-models/product-catalog.oracle.ts` (see `specs/product-catalog.md`). When the site differs, the test fails and the difference is a finding (see Notes).

**Cart state.** The cart lives only in localStorage: `cart-contents` is a JSON array of product ids in the order they were added, for example `[4,0,2]`. Scenarios that need products in the cart start with it filled this way (the `fillCart` fixture) instead of clicking "Add to cart", unless adding or removing is what the scenario checks.

**Cart page.** Title "Your Cart", column labels "QTY" and "Description", one row per product with quantity "1", the name as a link to the details page, the description, the price and a "Remove" button, then "Continue Shopping" and "Checkout". The page shows no total.

**Totals.** The cart is first added up on the checkout overview (`/checkout-step-two.html`), after the buyer submits their name and postal code on `/checkout-step-one.html`. The store charges 8% tax on the item total, rounded to the nearest cent: "Item total: $X", "Tax: $Y", "Total: $X+Y". The expected totals come from the cart oracle, `apps/ui/data-models/cart.oracle.ts`, which works in whole cents.

## Test Scenarios

### 1. Adding and removing

**Seed:** `apps/ui/tests/seed.spec.ts`

#### 1.1. Add to cart on the list marks the product as added

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Open `/inventory.html` and click "Add to cart" on the Sauce Labs Backpack card.
    - expect: That card's button changes to "Remove".
    - expect: The cart badge shows "1".

#### 1.2. Remove on the list takes the product out of the cart

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Bike Light. Open `/inventory.html` and click "Remove" on its card.
    - expect: The button changes back to "Add to cart".
    - expect: The cart badge is gone.

#### 1.3. Add to cart on the details page marks the product as added

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Open `/inventory-item.html?id=1` (Sauce Labs Bolt T-Shirt) and click "Add to cart".
    - expect: The button changes to "Remove".
    - expect: The cart badge shows "1".

#### 1.4. Remove on the details page takes the product out of the cart

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Bolt T-Shirt. Open `/inventory-item.html?id=1` and click "Remove".
    - expect: The button changes back to "Add to cart".
    - expect: The cart badge is gone.

#### 1.5. A product added on the list shows as added on its details page

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Open `/inventory.html`, add Sauce Labs Onesie, then open it from its name link.
    - expect: The details page's button reads "Remove".
    - expect: The cart badge shows "1".

#### 1.6. A product removed on its details page shows as not added on the list

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Onesie. Open `/inventory-item.html?id=2`, click "Remove", then "Back to products".
    - expect: The Sauce Labs Onesie card's button reads "Add to cart".
    - expect: The cart badge is gone.

#### 1.7. The badge counts every product added

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Open `/inventory.html`. Add each of the 6 products in the default order, checking after each one.
    - expect: The added product's button reads "Remove", and only the products added so far show "Remove".
    - expect: The cart badge shows how many products have been added.

#### 1.8. The badge disappears only once the last product is removed

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Bike Light, Sauce Labs Onesie. Open `/inventory.html`.
    - expect: The cart badge shows "2".
  2. Remove Sauce Labs Bike Light.
    - expect: The cart badge shows "1".
  3. Remove Sauce Labs Onesie.
    - expect: The cart badge is gone.

#### 1.9. The cart survives a reload

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Open `/inventory.html`, add Sauce Labs Fleece Jacket, then reload the page.
    - expect: The Sauce Labs Fleece Jacket card still reads "Remove".
    - expect: The cart badge still shows "1".

### 2. Cart page

**Seed:** `apps/ui/tests/seed.spec.ts`

#### 2.1. The cart link in the header opens the cart page

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Open `/inventory.html` and click the cart link in the header.
    - expect: The URL is `/cart.html` and the title reads "Your Cart".

#### 2.2. Every product in the cart shows its intended details

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Starting cart: all 6 products, in the catalog's default order. Open `/cart.html`.
    - expect: Exactly 6 rows are shown.
  2. Data-driven: compare each row, top to bottom, with the product at the same position.
    - expect: Quantity "1", and the name, description and price from the oracle.
    - expect: The row shows a "Remove" button.

#### 2.3. The cart lists only the products added, in the order they were added

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Open `/inventory.html` and add Sauce Labs Onesie, Sauce Labs Backpack and Sauce Labs Fleece Jacket, in that order. Open the cart from the header link.
    - expect: The rows are exactly Sauce Labs Onesie, Sauce Labs Backpack, Sauce Labs Fleece Jacket, in that order.

#### 2.4. An empty cart shows no products

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Open `/cart.html` with an empty cart.
    - expect: The title reads "Your Cart", no rows are shown and there's no cart badge.

### 3. Removing from the cart page

**Seed:** `apps/ui/tests/seed.spec.ts`

#### 3.1. Remove takes the product out and keeps the rest in order

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack, Sauce Labs Bike Light, Sauce Labs Onesie. Open `/cart.html` and click "Remove" on the Sauce Labs Bike Light row.
    - expect: The rows are Sauce Labs Backpack, then Sauce Labs Onesie.
    - expect: The cart badge shows "2".

#### 3.2. A product removed on the cart page shows as not added on the list

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack. Open `/cart.html`, click "Remove" on its row, then "Continue Shopping".
    - expect: The Sauce Labs Backpack card's button reads "Add to cart".
    - expect: The cart badge is gone.

### 4. Navigation

**Seed:** `apps/ui/tests/seed.spec.ts`

#### 4.1. A row's product name opens its details page

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack. Open `/cart.html` and click the product name.
    - expect: The URL is `/inventory-item.html?id=4` and the details page shows "Sauce Labs Backpack".

#### 4.2. Continue Shopping returns to the product list

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Open `/cart.html` and click "Continue Shopping".
    - expect: The URL is `/inventory.html` and all 6 products are listed.

#### 4.3. Checkout opens the first checkout step

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack. Open `/cart.html` and click "Checkout".
    - expect: The URL is `/checkout-step-one.html` and the title reads "Checkout: Your Information".

#### 4.4. Checkout is disabled while the cart is empty

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Open `/cart.html` with an empty cart.
    - expect: The "Checkout" button is disabled, because there's nothing to buy.

### 5. Reset App State

**Seed:** `apps/ui/tests/seed.spec.ts`

#### 5.1. Reset App State empties the cart on the product list

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack, Sauce Labs Bike Light. Open `/inventory.html`.
    - expect: Two cards show "Remove".
  2. Open the side menu and click "Reset App State".
    - expect: The cart badge is gone and no card shows "Remove", without a reload.

#### 5.2. Reset App State empties the cart page

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Starting cart: Sauce Labs Backpack, Sauce Labs Bike Light. Open `/cart.html`.
    - expect: Two rows are shown.
  2. Open the side menu and click "Reset App State".
    - expect: The cart badge is gone and no rows are shown, without a reload.

### 6. Totals

**Seed:** `apps/ui/tests/seed.spec.ts`

#### 6.1. Checkout totals the cart correctly

**File:** `apps/ui/tests/cart.spec.ts`

**Steps:**
  1. Data-driven, one test per cart: carts of 1 to 6 products, each adding the next product in the catalog's default order (Backpack, Bike Light, Bolt T-Shirt, Fleece Jacket, Onesie, Test.allTheThings() T-Shirt (Red)). Open `/cart.html`, click "Checkout", fill First Name, Last Name and Zip/Postal Code, and click "Continue".
    - expect: "Item total" is the sum of the products' prices.
    - expect: "Tax" is 8% of the item total, rounded to the nearest cent.
    - expect: "Total" is the item total plus the tax.

| Cart | Item total | Tax | Total |
|---|---|---|---|
| 1 product | $29.99 | $2.40 | $32.39 |
| 2 products | $39.98 | $3.20 | $43.18 |
| 3 products | $55.97 | $4.48 | $60.45 |
| 4 products | $105.96 | $8.48 | $114.44 |
| 5 products | $113.95 | $9.12 | $123.07 |
| 6 products | $129.94 | $10.40 | $140.34 |

## Notes

Observations from exploring the app. They are not test scenarios.

- **Finding:** Sauce Labs Onesie's description reads "hemmed **sleeved**" instead of "sleeves" on the cart page too, so 2.2 fails on it.
- **Finding:** "Checkout" is enabled with an empty cart and opens `/checkout-step-one.html`, so 4.4 fails.
- **Finding:** the item total isn't rounded to cents for some carts, so floating-point noise shows up. The 4-product cart shows "Item total: $105.96000000000001" (6.1 fails). Checking all 63 possible carts found 6 like this: Bike Light + Fleece Jacket ($59.980000000000004), Fleece Jacket + Onesie ($57.980000000000004), and four carts of 4 or 5 products. Tax and Total were right in all 63.
- The checkout overview opens directly at `/checkout-step-two.html` with a filled cart, skipping the name and postal code step. Checkout isn't covered yet, so the totals scenarios go through that step instead of relying on the shortcut.
- **Finding:** "Reset App State" clears the cart data and the badge right away, but the "Remove" buttons on the list and the rows on the cart page stay until the page reloads, so 5.1 and 5.2 fail.
- The cart survives logging out and back in, because it lives in the browser's localStorage and not with the user. Whether a cart should outlive a logout (or carry over to another user in the same browser) isn't defined, so there's no scenario.
- A `cart-contents` id with no product (for example `[99]`) counts in the badge but shows no row, and a repeated id (`[4,4]`) shows two rows of the same product. Neither can happen through the UI, so neither has a scenario.
- The header cart link's accessible name reads "Cart, 1 items" (not "1 item"). Scenarios check the visible badge instead.
- Deviations on other accounts (the scenarios run as standard_user only):
  - **problem_user:** adding, removing and the cart page behaved like standard_user in the checks made, but the checkout overview doubles the item total (Sauce Labs Backpack alone shows "Item total: $59.98", "Tax: $4.80", "Total: $64.78").
  - **error_user:** "Add to cart" does nothing for Sauce Labs Bolt T-Shirt and Sauce Labs Fleece Jacket, and "Remove" failed for every product tried. Both log errors to the console.
  - **visual_user:** list prices are wrong, but the cart page shows the correct price once the product is added.
