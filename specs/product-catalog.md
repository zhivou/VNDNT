# Product Catalog Test Plan

## Application Overview

SauceDemo (https://www.saucedemo.com) product catalog: the inventory page (`/inventory.html`) lists 6 products with a sort dropdown, and each product has a details page (`/inventory-item.html?id=N`) that opens from either the product's image or its name. Opening a product is a client-side navigation: the URL changes before the details page renders, and the list and the details page use the same `data-test` names for a product's name, description, price and cart button.

All scenarios run **logged in as standard_user**, start with an **empty cart**, and start on `/inventory.html` unless a scenario says otherwise. Adding products to the cart and removing them is planned in `specs/cart.md`.

**Synthetic data.** The catalog is treated as data the test automation seeded, so the expected values below are what the store is **meant** to show, not whatever the site renders. SauceDemo plants mistakes on purpose, so no observed value is copied into an expected result without checking it. When the site differs, the test fails and the difference is a finding (see Notes). A test that found a real bug is marked `test.fixme()` until the application is fixed. The tests read these values from the oracle, `apps/ui/data-models/product-catalog.oracle.ts`.

**Products (intended data), in the default order, Name (A to Z):**

| id | Name | Price | Image file (without the build hash) |
|---|---|---|---|
| 4 | Sauce Labs Backpack | $29.99 | sauce-backpack-1200x1500 |
| 0 | Sauce Labs Bike Light | $9.99 | bike-light-1200x1500 |
| 1 | Sauce Labs Bolt T-Shirt | $15.99 | bolt-shirt-1200x1500 |
| 5 | Sauce Labs Fleece Jacket | $49.99 | sauce-pullover-1200x1500 |
| 2 | Sauce Labs Onesie | $7.99 | red-onesie-1200x1500 |
| 3 | Test.allTheThings() T-Shirt (Red) | $15.99 | red-tatt-1200x1500 |

Every image's alt text is the product name.

**Descriptions (intended data):**

- Sauce Labs Backpack: "carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection."
- Sauce Labs Bike Light: "A red light isn't the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes, 1 AAA battery included."
- Sauce Labs Bolt T-Shirt: "Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton, heather gray with red bolt."
- Sauce Labs Fleece Jacket: "It's not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office."
- Sauce Labs Onesie: "Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure, two-needle hemmed sleeves and bottom won't unravel."
- Test.allTheThings() T-Shirt (Red): "This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests. Super-soft and comfy ringspun combed cotton."

## Test Scenarios

### 1. Product list

**Seed:** `apps/ui/tests/seed.spec.ts`

#### 1.1. Every product shows its intended details

**File:** `apps/ui/tests/product-catalog.spec.ts`

**Steps:**
  1. Open `/inventory.html`.
    - expect: The page title reads "Products".
    - expect: Exactly 6 products are listed.
  2. Data-driven: for each card from top to bottom, compare it with the product at the same position in the table above.
    - expect: The name, description and price match the intended data.
    - expect: The image's alt text is the product name, and its file name matches the intended image.
    - expect: The card shows an "Add to cart" button.

### 2. Sorting

**Seed:** `apps/ui/tests/seed.spec.ts`

#### 2.1. The sort dropdown offers every option with Name (A to Z) selected

**File:** `apps/ui/tests/product-catalog.spec.ts`

**Steps:**
  1. Open `/inventory.html`.
    - expect: The combobox "Sort products" lists exactly "Name (A to Z)", "Name (Z to A)", "Price (low to high)", "Price (high to low)", in that order.
    - expect: The label next to it reads "Name (A to Z)".

#### 2.2. Each sort option orders the products by its rule

**File:** `apps/ui/tests/product-catalog.spec.ts`

**Steps:**
  1. Open `/inventory.html`. Data-driven: select each option in the combobox "Sort products".
    - expect: The label next to the combobox reads the selected option.
    - expect: The names and prices, top to bottom, follow the option's rule. Products with the same price keep their name order (A to Z), whichever way the prices go:

| Option | Names, top to bottom |
|---|---|
| Name (A to Z) | Backpack, Bike Light, Bolt T-Shirt, Fleece Jacket, Onesie, Test.allTheThings() T-Shirt (Red) |
| Name (Z to A) | Test.allTheThings() T-Shirt (Red), Onesie, Fleece Jacket, Bolt T-Shirt, Bike Light, Backpack |
| Price (low to high) | Onesie $7.99, Bike Light $9.99, Bolt T-Shirt $15.99, Test.allTheThings() T-Shirt (Red) $15.99, Backpack $29.99, Fleece Jacket $49.99 |
| Price (high to low) | Fleece Jacket $49.99, Backpack $29.99, Bolt T-Shirt $15.99, Test.allTheThings() T-Shirt (Red) $15.99, Bike Light $9.99, Onesie $7.99 |

### 3. Product details

**Seed:** `apps/ui/tests/seed.spec.ts`

#### 3.1. Each product's name link opens its intended details

**File:** `apps/ui/tests/product-catalog.spec.ts`

**Steps:**
  1. Data-driven, one test per product: open `/inventory.html` and click the product's name link.
    - expect: The URL is `/inventory-item.html?id=<id>` with the product's id.
    - expect: The details page shows the intended name, description and price, an image with the product name as alt text and the intended file name, and an "Add to cart" button.

#### 3.2. Each product's image link opens the same details page

**File:** `apps/ui/tests/product-catalog.spec.ts`

**Steps:**
  1. Data-driven, one test per product: open `/inventory.html` and click the product's image link.
    - expect: The URL is `/inventory-item.html?id=<id>` with the product's id.
    - expect: The details page shows the product's name.

#### 3.3. Back to products returns to the product list

**File:** `apps/ui/tests/product-catalog.spec.ts`

**Steps:**
  1. Open `/inventory-item.html?id=2` (Sauce Labs Onesie) and click button "Back to products".
    - expect: The URL is `/inventory.html` and all 6 products are listed.

## Notes

Observations from exploring the app. They are not test scenarios.

- **Finding, standard_user:** Sauce Labs Onesie's description reads "two-needle hemmed **sleeved** and bottom won't unravel" on both the list and the details page. The intended text is "sleeves", so 1.1 and the Sauce Labs Onesie case of 3.1 are marked `test.fixme()`.
- `/inventory-item.html?id=999` shows a joke "ITEM NOT FOUND" product with the price "$√-1" and a working "Add to cart" button. There's no agreed behavior for an unknown product, so it has no scenario, but offering a product that doesn't exist for sale looks like a bug.
- The header cart link's accessible name reads "Cart, 1 items" (not "1 item"). Scenarios check the visible badge instead.
- The chosen sort goes back to Name (A to Z) after a reload, or after opening a product and clicking "Back to products". Nothing says whether the sort should persist, so there's no scenario for either behavior.
- Deviations on other accounts (the scenarios run as standard_user only):
  - **problem_user:** every list image is the "item not found" placeholder (`sl-404`), though the alt text still names the product; details page images are correct. The sort dropdown doesn't work: every option leaves the list in Name (A to Z) order.
  - **error_user:** "Add to cart" on Sauce Labs Bolt T-Shirt does nothing (the console logs "Failed to add item to the cart."). Changing the sort shows the alert "Sorting is broken! This error has been reported to Backtrace." instead of sorting.
  - **visual_user:** list prices don't match the catalog (for example Sauce Labs Backpack $89.94) and Sauce Labs Backpack's list image is the placeholder.
  - **performance_glitch_user:** the catalog matches; only responses are slower.
