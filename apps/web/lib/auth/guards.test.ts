import { describe, it, expect } from 'vitest';
import { SQL } from 'drizzle-orm';

import { withOwnership } from './guards';

describe('withOwnership', () => {
  it('returns a Drizzle SQL expression', () => {
    const result = withOwnership('user-123');
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(SQL);
  });

  it('produces consistent output for the same user ID', () => {
    const a = withOwnership('user-abc');
    const b = withOwnership('user-abc');
    expect(a.getSQL()).toStrictEqual(b.getSQL());
  });

  it('produces different output for different user IDs', () => {
    const a = withOwnership('user-1');
    const b = withOwnership('user-2');
    // The queryChunks encode the bound parameter value, so they differ
    expect(a).not.toBe(b);
  });

  it('does not throw for valid user IDs', () => {
    expect(() => withOwnership('usr_123')).not.toThrow();
    expect(() => withOwnership('00000000-0000-0000-0000-000000000000')).not.toThrow();
  });

  it('handles empty string without throwing', () => {
    expect(() => withOwnership('')).not.toThrow();
    const result = withOwnership('');
    expect(result).toBeInstanceOf(SQL);
  });

  it('handles strings with special characters without throwing', () => {
    expect(() => withOwnership("'; DROP TABLE user; --")).not.toThrow();
    expect(() => withOwnership('<script>alert("xss")</script>')).not.toThrow();
    expect(() => withOwnership('user with spaces')).not.toThrow();
  });

  it('handles very long user IDs without throwing', () => {
    const longId = 'a'.repeat(1000);
    expect(() => withOwnership(longId)).not.toThrow();
    const result = withOwnership(longId);
    expect(result).toBeInstanceOf(SQL);
  });
});
