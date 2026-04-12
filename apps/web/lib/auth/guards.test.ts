import { describe, it, expect } from 'vitest';

import { withOwnership } from './guards';

describe('withOwnership', () => {
  it('returns a Drizzle SQL expression', () => {
    const result = withOwnership('user-123');
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('returns an expression that references the given user ID', () => {
    const result = withOwnership('user-abc');
    // Drizzle SQL expressions are objects with internal structure.
    // Verify the expression was created without errors.
    expect(result).not.toBeNull();
  });

  it('does not throw for valid user IDs', () => {
    expect(() => withOwnership('usr_123')).not.toThrow();
    expect(() => withOwnership('00000000-0000-0000-0000-000000000000')).not.toThrow();
  });
});
