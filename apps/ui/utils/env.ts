// .env is loaded by the global playwright.config.ts. This app reads only its own variables.
const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env or set it in CI.`);
  }
  return value;
};

export const env = {
  UI_BASE_URL: required('UI_BASE_URL'),
  SAUCE_PASSWORD: required('SAUCE_PASSWORD'),
};
