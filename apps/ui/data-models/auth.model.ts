import { SAUCE_USERS } from '@ui/data-models/sauce-user.model';
import { env } from '@ui/utils/env';

// The errors the login page shows, word for word.
export const LOGIN_ERRORS = {
  usernameRequired: 'Epic sadface: Username is required',
  passwordRequired: 'Epic sadface: Password is required',
  noMatch: 'Epic sadface: Username and password do not match any user in this service',
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
  loginRequired: (path: string): string => `Epic sadface: You can only access '${path}' when you are logged in.`,
};

type RejectedLogin = {
  description: string;
  username: string;
  password: string;
  error: string;
};

// Logins the form refuses, and the error each one shows.
export const REJECTED_LOGINS: RejectedLogin[] = [
  {
    description: 'locked_out_user',
    username: SAUCE_USERS.lockedOut,
    password: env.SAUCE_PASSWORD,
    error: LOGIN_ERRORS.lockedOut,
  },
  { description: 'an empty form', username: '', password: '', error: LOGIN_ERRORS.usernameRequired },
  {
    description: 'an empty username',
    username: '',
    password: env.SAUCE_PASSWORD,
    error: LOGIN_ERRORS.usernameRequired,
  },
  {
    description: 'an empty password',
    username: SAUCE_USERS.standard,
    password: '',
    error: LOGIN_ERRORS.passwordRequired,
  },
  {
    description: 'a wrong password',
    username: SAUCE_USERS.standard,
    password: 'wrong_password',
    error: LOGIN_ERRORS.noMatch,
  },
  {
    description: 'an unknown username',
    username: 'unknown_user',
    password: env.SAUCE_PASSWORD,
    error: LOGIN_ERRORS.noMatch,
  },
  {
    description: 'a username in the wrong case',
    username: 'Standard_User',
    password: env.SAUCE_PASSWORD,
    error: LOGIN_ERRORS.noMatch,
  },
  {
    description: 'a password in the wrong case',
    username: SAUCE_USERS.standard,
    password: env.SAUCE_PASSWORD.toUpperCase(),
    error: LOGIN_ERRORS.noMatch,
  },
];

// Pages that need a session. The login error names the page by its path, without the query string.
export const PROTECTED_PAGES = [
  { url: '/inventory.html', path: '/inventory.html' },
  { url: '/inventory-item.html?id=4', path: '/inventory-item.html' },
  { url: '/cart.html', path: '/cart.html' },
  { url: '/checkout-step-one.html', path: '/checkout-step-one.html' },
  { url: '/checkout-step-two.html', path: '/checkout-step-two.html' },
  { url: '/checkout-complete.html', path: '/checkout-complete.html' },
];
