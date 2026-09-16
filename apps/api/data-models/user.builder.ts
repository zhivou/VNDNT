import type { NewUser } from '@api/data-models/user.model';

// A valid new user. Every value is synthetic: reserved example.test domains and a 555-01xx phone number.
export const buildNewUser = (overrides: Partial<NewUser> = {}): NewUser => {
  const id = crypto.randomUUID().slice(0, 8);
  return {
    name: `Test User ${id}`,
    username: `test_user_${id}`,
    email: `user-${id}@example.test`,
    address: {
      street: 'Test Lane',
      suite: 'Apt. 1',
      city: 'Testville',
      zipcode: '00000',
      geo: { lat: '0.0000', lng: '0.0000' },
    },
    phone: '555-0100',
    website: 'example.test',
    company: {
      name: 'Test Company',
      catchPhrase: 'Synthetic data for API tests',
      bs: 'test automation',
    },
    ...overrides,
  };
};
