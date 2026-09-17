import { PRODUCTS, formatPrice, type Product } from '@ui/data-models/product-catalog.oracle';

// The oracle for cart totals, shown on the checkout overview. Like every oracle, it holds what the store is meant to
// charge, never a value copied from the site (see product-catalog.oracle.ts).

// The store charges 8% tax on the item total, rounded to the nearest cent
const TAX_PERCENT = 8;

const toCents = (price: number): number => Math.round(price * 100);

// Works in whole cents, so the oracle can't pick up floating-point noise itself
export const cartTotals = (products: Product[]) => {
  const itemTotal = products.reduce((sum, { price }) => sum + toCents(price), 0);
  const tax = Math.round((itemTotal * TAX_PERCENT) / 100);
  return {
    itemTotal: `Item total: ${formatPrice(itemTotal / 100)}`,
    tax: `Tax: ${formatPrice(tax / 100)}`,
    total: `Total: ${formatPrice((itemTotal + tax) / 100)}`,
  };
};

// Carts of 1 to 6 products. Each one adds the next product in the catalog's default order.
export const CARTS = PRODUCTS.map((_, index) => {
  const products = PRODUCTS.slice(0, index + 1);
  return { description: `a cart of ${products.length} of ${PRODUCTS.length} products`, products };
});
