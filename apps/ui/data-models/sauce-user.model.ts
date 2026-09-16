// The accounts SauceDemo ships with. They all share one password (SAUCE_PASSWORD).
export const SAUCE_USERS = {
  standard: 'standard_user',
  lockedOut: 'locked_out_user',
  problem: 'problem_user',
  performanceGlitch: 'performance_glitch_user',
  error: 'error_user',
  visual: 'visual_user',
} as const;

export type SauceUser = (typeof SAUCE_USERS)[keyof typeof SAUCE_USERS];

// Users that get a saved session. SauceDemo refuses locked_out_user at the login form, so it has none.
export const SESSION_USERS = Object.values(SAUCE_USERS).filter((user) => user !== SAUCE_USERS.lockedOut);
