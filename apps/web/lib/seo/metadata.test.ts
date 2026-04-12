import { describe, it, expect } from 'vitest';

import { createMetadata } from './metadata';

describe('createMetadata', () => {
  it('sets title and description', () => {
    const result = createMetadata({
      title: 'My Page',
      description: 'A description',
    });
    expect(result.title).toBe('My Page');
    expect(result.description).toBe('A description');
  });

  it('constructs canonical URL from base URL and path', () => {
    const result = createMetadata({
      title: 'About',
      description: 'About us',
      path: '/about',
    });
    expect(result.alternates?.canonical).toBe('https://example.com/about');
  });

  it('uses empty path by default', () => {
    const result = createMetadata({
      title: 'Home',
      description: 'Home page',
    });
    expect(result.alternates?.canonical).toBe('https://example.com');
  });

  it('generates OG image URL with encoded title when ogImage not provided', () => {
    const result = createMetadata({
      title: 'Hello World',
      description: 'Test',
    });
    const images = (result.openGraph as Record<string, unknown>)?.images as Array<{ url: string }>;
    expect(images[0].url).toBe(
      `https://example.com/api/og?title=${encodeURIComponent('Hello World')}`,
    );
  });

  it('uses provided ogImage when given', () => {
    const result = createMetadata({
      title: 'Test',
      description: 'Test',
      ogImage: 'https://example.com/custom.png',
    });
    const images = (result.openGraph as Record<string, unknown>)?.images as Array<{ url: string }>;
    expect(images[0].url).toBe('https://example.com/custom.png');
  });

  it('sets openGraph metadata with correct shape', () => {
    const result = createMetadata({
      title: 'Test',
      description: 'A description',
      path: '/test',
    });
    const og = result.openGraph as Record<string, unknown>;
    expect(og.title).toBe('Test');
    expect(og.description).toBe('A description');
    expect(og.url).toBe('https://example.com/test');
    expect(og.siteName).toBe('FullStack Template');
    expect(og.locale).toBe('en_US');
    expect(og.type).toBe('website');
  });

  it('sets twitter card to summary_large_image', () => {
    const result = createMetadata({
      title: 'Test',
      description: 'Test',
    });
    const twitter = result.twitter as Record<string, unknown>;
    expect(twitter.card).toBe('summary_large_image');
  });

  it('does not include robots when noIndex is false', () => {
    const result = createMetadata({
      title: 'Test',
      description: 'Test',
    });
    expect(result.robots).toBeUndefined();
  });

  it('sets robots noindex and nofollow when noIndex is true', () => {
    const result = createMetadata({
      title: 'Test',
      description: 'Test',
      noIndex: true,
    });
    expect(result.robots).toEqual({ index: false, follow: false });
  });
});
