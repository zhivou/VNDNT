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
