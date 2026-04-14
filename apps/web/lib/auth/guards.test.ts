import { describe, it, expect } from 'vitest';
import { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';

import { withOwnership } from './guards';

const dialect = new PgDialect();

function toQuery(userId: string) {
  return dialect.sqlToQuery(withOwnership(userId).getSQL());
}

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
    const a = toQuery('user-1');
    const b = toQuery('user-2');

    expect(a.sql).toBe('"user"."id" = $1');
    expect(b.sql).toBe('"user"."id" = $1');
    expect(a.params).toEqual(['user-1']);
    expect(b.params).toEqual(['user-2']);
  });

  it('parameterizes valid user IDs without interpolating them into SQL', () => {
    const simple = toQuery('usr_123');
    const uuid = toQuery('00000000-0000-0000-0000-000000000000');

    expect(simple.sql).toBe('"user"."id" = $1');
    expect(simple.params).toEqual(['usr_123']);
    expect(uuid.sql).toBe('"user"."id" = $1');
    expect(uuid.params).toEqual(['00000000-0000-0000-0000-000000000000']);
  });

  it('handles empty string as a bound parameter', () => {
    const result = toQuery('');
    expect(result.sql).toBe('"user"."id" = $1');
    expect(result.params).toEqual(['']);
  });

  it('keeps special characters in parameters instead of interpolating them into SQL', () => {
    const injectionAttempt = toQuery("'; DROP TABLE user; --");
    const html = toQuery('<script>alert("xss")</script>');
    const spaced = toQuery('user with spaces');

    expect(injectionAttempt.sql).toBe('"user"."id" = $1');
    expect(injectionAttempt.params).toEqual(["'; DROP TABLE user; --"]);
    expect(html.params).toEqual(['<script>alert("xss")</script>']);
    expect(spaced.params).toEqual(['user with spaces']);
  });

  it('handles very long user IDs as a bound parameter', () => {
    const longId = 'a'.repeat(1000);
    const result = toQuery(longId);
    expect(result.sql).toBe('"user"."id" = $1');
    expect(result.params).toEqual([longId]);
  });
});
