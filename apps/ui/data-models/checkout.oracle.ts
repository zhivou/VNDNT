import { BUYER, type Buyer } from '@ui/data-models/checkout.model';

// The oracle for checkout: what its pages are meant to show. Like every oracle, it holds what the store is meant to
// show, never a value copied from the site without checking it (see product-catalog.oracle.ts). The order's products
// come from the catalog oracle, and its totals from cart.oracle.ts.

// Every order is paid and shipped the same way
export const ORDER_DETAILS = {
  paymentInformation: 'SauceCard #31337',
  shippingInformation: 'Free Pony Express Delivery!',
};

export const CONFIRMATION = {
  header: 'Thank you for your order!',
  text: 'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
  imageAlt: 'Pony Express',
};

// swag-labs-order-<date>_<time>.pdf. The time is when the receipt was made, so only its shape is known.
export const RECEIPT_FILE_NAME = /^swag-labs-order-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.pdf$/;

const INFORMATION_ERRORS = {
  firstName: 'Error: First Name is required',
  lastName: 'Error: Last Name is required',
  postalCode: 'Error: Postal Code is required',
};

type IncompleteInformation = {
  description: string;
  buyer: Buyer;
  error: string;
};

// Information the first checkout step refuses, and the error each one shows: the first missing field, top to bottom.
export const MISSING_INFORMATION: IncompleteInformation[] = [
  {
    description: 'an empty form',
    buyer: { firstName: '', lastName: '', postalCode: '' },
    error: INFORMATION_ERRORS.firstName,
  },
  { description: 'a missing first name', buyer: { ...BUYER, firstName: '' }, error: INFORMATION_ERRORS.firstName },
  { description: 'a missing last name', buyer: { ...BUYER, lastName: '' }, error: INFORMATION_ERRORS.lastName },
  { description: 'a missing postal code', buyer: { ...BUYER, postalCode: '' }, error: INFORMATION_ERRORS.postalCode },
];

// A field of only spaces is as empty as a field left blank, so it's refused the same way
export const BLANK_INFORMATION: IncompleteInformation[] = [
  {
    description: 'a first name of only spaces',
    buyer: { ...BUYER, firstName: '   ' },
    error: INFORMATION_ERRORS.firstName,
  },
  {
    description: 'a last name of only spaces',
    buyer: { ...BUYER, lastName: '   ' },
    error: INFORMATION_ERRORS.lastName,
  },
  {
    description: 'a postal code of only spaces',
    buyer: { ...BUYER, postalCode: '   ' },
    error: INFORMATION_ERRORS.postalCode,
  },
];
