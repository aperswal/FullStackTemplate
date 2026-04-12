import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import {
  organizationJsonLd,
  webSiteJsonLd,
  webPageJsonLd,
  breadcrumbJsonLd,
  JsonLdScript,
} from './json-ld';

describe('organizationJsonLd', () => {
  it('returns object with @context and @type Organization', () => {
    const result = organizationJsonLd({ name: 'Acme' });
    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('Organization');
  });

  it('sets name and default url', () => {
    const result = organizationJsonLd({ name: 'Acme' });
    expect(result.name).toBe('Acme');
    expect(result.url).toBe('https://example.com');
  });

  it('includes logo when provided', () => {
    const result = organizationJsonLd({
      name: 'Acme',
      logo: 'https://example.com/logo.png',
    });
    expect(result.logo).toBe('https://example.com/logo.png');
  });

  it('does not include logo when not provided', () => {
    const result = organizationJsonLd({ name: 'Acme' });
    expect(result).not.toHaveProperty('logo');
  });
});

describe('webSiteJsonLd', () => {
  it('returns object with @context and @type WebSite', () => {
    const result = webSiteJsonLd({ name: 'My Site' });
    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('WebSite');
  });

  it('sets name and default url', () => {
    const result = webSiteJsonLd({ name: 'My Site' });
    expect(result.name).toBe('My Site');
    expect(result.url).toBe('https://example.com');
  });

  it('uses custom url when provided', () => {
    const result = webSiteJsonLd({
      name: 'My Site',
      url: 'https://custom.com',
    });
    expect(result.url).toBe('https://custom.com');
  });
});

describe('webPageJsonLd', () => {
  it('returns object with @context and @type WebPage', () => {
    const result = webPageJsonLd({
      name: 'About',
      description: 'About us',
      url: 'https://example.com/about',
    });
    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('WebPage');
  });

  it('sets name, description, and url', () => {
    const result = webPageJsonLd({
      name: 'About',
      description: 'About us',
      url: 'https://example.com/about',
    });
    expect(result.name).toBe('About');
    expect(result.description).toBe('About us');
    expect(result.url).toBe('https://example.com/about');
  });
});

describe('breadcrumbJsonLd', () => {
  it('returns object with @type BreadcrumbList', () => {
    const result = breadcrumbJsonLd([]);
    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('BreadcrumbList');
  });

  it('maps items to itemListElement with correct positions', () => {
    const result = breadcrumbJsonLd([
      { name: 'Home', url: '/' },
      { name: 'About', url: '/about' },
    ]);
    const elements = result.itemListElement as Array<Record<string, unknown>>;
    expect(elements).toHaveLength(2);
    expect(elements[0]['@type']).toBe('ListItem');
    expect(elements[0].position).toBe(1);
    expect(elements[0].name).toBe('Home');
    expect(elements[1].position).toBe(2);
    expect(elements[1].name).toBe('About');
  });

  it('handles single item', () => {
    const result = breadcrumbJsonLd([{ name: 'Home', url: '/' }]);
    const elements = result.itemListElement as Array<Record<string, unknown>>;
    expect(elements).toHaveLength(1);
    expect(elements[0].position).toBe(1);
  });

  it('handles empty array', () => {
    const result = breadcrumbJsonLd([]);
    const elements = result.itemListElement as Array<Record<string, unknown>>;
    expect(elements).toHaveLength(0);
  });
});

describe('JsonLdScript', () => {
  it('renders a script tag with type application/ld+json', () => {
    const data = { '@context': 'https://schema.org', '@type': 'WebSite' };
    const { container } = render(<JsonLdScript data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
  });

  it('contains JSON stringified data', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Acme',
    };
    const { container } = render(<JsonLdScript data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script?.textContent).toBe(JSON.stringify(data));
  });
});
