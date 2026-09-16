import type { ExpectMatcherState, MatcherReturnType } from '@playwright/test';
import type { ZodType } from 'zod';

export const schemaMatchers = {
  toMatchSchema(this: ExpectMatcherState, received: unknown, schema: ZodType): MatcherReturnType {
    const result = schema.safeParse(received);
    if (result.success) {
      return {
        name: 'toMatchSchema',
        pass: true,
        message: () => 'Expected the value not to match the schema, but it did',
      };
    }

    const issues = result.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    return {
      name: 'toMatchSchema',
      pass: false,
      message: () => `Expected the value to match the schema:\n${issues}\n\nReceived: ${this.utils.printReceived(received)}`,
    };
  },
};
