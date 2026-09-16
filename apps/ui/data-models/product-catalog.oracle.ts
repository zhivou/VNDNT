// The oracle for the product catalog: the store listing the tests expect, written as synthetic data. Treat it as if the
// test automation had seeded the store itself. Every value here is what the store is meant to show, never a copy of
// what the site renders. SauceDemo plants mistakes on purpose, so when the site differs from this file the test must
// fail and the difference is a finding. Never make a failing test pass by copying the site's value into this file.

export type Product = {
  // The id in the details page URL: /inventory-item.html?id=<id>
  id: number;
  name: string;
  description: string;
  price: number;
  // The image file name without the hash the site's build adds to it (sauce-backpack-1200x1500-<hash>.jpg)
  image: string;
};

export const CATALOG = {
  backpack: {
    id: 4,
    name: 'Sauce Labs Backpack',
    description:
      'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
    price: 29.99,
    image: 'sauce-backpack-1200x1500',
  },
  bikeLight: {
    id: 0,
    name: 'Sauce Labs Bike Light',
    description:
      "A red light isn't the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes, 1 AAA battery included.",
    price: 9.99,
    image: 'bike-light-1200x1500',
  },
  boltTShirt: {
    id: 1,
    name: 'Sauce Labs Bolt T-Shirt',
    description:
      'Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton, heather gray with red bolt.',
    price: 15.99,
    image: 'bolt-shirt-1200x1500',
  },
  fleeceJacket: {
    id: 5,
    name: 'Sauce Labs Fleece Jacket',
    description:
      "It's not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office.",
    price: 49.99,
    image: 'sauce-pullover-1200x1500',
  },
  onesie: {
    id: 2,
    name: 'Sauce Labs Onesie',
    description:
      "Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure, two-needle hemmed sleeves and bottom won't unravel.",
    price: 7.99,
    image: 'red-onesie-1200x1500',
  },
  redTShirt: {
    id: 3,
    name: 'Test.allTheThings() T-Shirt (Red)',
    description:
      'This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests. Super-soft and comfy ringspun combed cotton.',
    price: 15.99,
    image: 'red-tatt-1200x1500',
  },
} satisfies Record<string, Product>;

// How the store shows a price: $29.99
export const formatPrice = (price: number): string => `$${price.toFixed(2)}`;

// Matches the image's src with any build hash, or none: /assets/sauce-backpack-1200x1500-<hash>.jpg
export const imageSrc = (product: Product): RegExp => new RegExp(`/${product.image}[-.]`);

const byName = (a: Product, b: Product): number => a.name.localeCompare(b.name);
const byPrice = (a: Product, b: Product): number => a.price - b.price;

// Every product, in the order the store lists them by default: by name, A to Z
export const PRODUCTS: Product[] = Object.values(CATALOG).sort(byName);

const sorted = (compare: (a: Product, b: Product) => number) => {
  const products = [...PRODUCTS].sort(compare);
  return { names: products.map(({ name }) => name), prices: products.map(({ price }) => formatPrice(price)) };
};

type SortOption = {
  description: string;
  // The option's text in the sort dropdown
  label: string;
  // The product names and prices from top to bottom once the option is chosen
  names: string[];
  prices: string[];
};

// The sort dropdown's options, in the order it lists them. Products with the same price keep their name order (A to Z),
// whichever way the prices go.
export const SORT_OPTIONS: SortOption[] = [
  { description: 'name from A to Z', label: 'Name (A to Z)', ...sorted(byName) },
  { description: 'name from Z to A', label: 'Name (Z to A)', ...sorted((a, b) => byName(b, a)) },
  {
    description: 'price from low to high',
    label: 'Price (low to high)',
    ...sorted((a, b) => byPrice(a, b) || byName(a, b)),
  },
  {
    description: 'price from high to low',
    label: 'Price (high to low)',
    ...sorted((a, b) => byPrice(b, a) || byName(a, b)),
  },
];

// The option the dropdown shows before the user picks one
export const DEFAULT_SORT = 'Name (A to Z)';
