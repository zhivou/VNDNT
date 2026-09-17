export type Buyer = {
  firstName: string;
  lastName: string;
  postalCode: string;
};

// The details checkout asks for before it shows the order overview
export const BUYER: Buyer = { firstName: 'Ada', lastName: 'Lovelace', postalCode: '10001' };
