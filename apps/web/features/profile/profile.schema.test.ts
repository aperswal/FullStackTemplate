import { describe, it, expect } from 'vitest';

import { updateProfileSchema } from './profile.schema';

describe('updateProfileSchema', () => {
  it('accepts valid profile data', () => {
    const result = updateProfileSchema.safeParse({
      name: 'John Doe',
    });
    expect(result.success).toBe(true);
  });

  it('accepts profile with image URL', () => {
    const result = updateProfileSchema.safeParse({
      name: 'John Doe',
      image: 'https://example.com/avatar.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty string for image', () => {
    const result = updateProfileSchema.safeParse({
      name: 'John Doe',
      image: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = updateProfileSchema.safeParse({
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects name over 100 characters', () => {
    const result = updateProfileSchema.safeParse({
      name: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid image URL', () => {
    const result = updateProfileSchema.safeParse({
      name: 'John',
      image: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});
