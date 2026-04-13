import { env } from '@/lib/env';

const BASE_URL = env.NEXT_PUBLIC_APP_URL ?? 'https://example.com';

interface OrganizationLdInput {
  name: string;
  url?: string;
  logo?: string;
}

export function organizationJsonLd({
  name,
  url = BASE_URL,
  logo,
}: OrganizationLdInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    ...(logo !== undefined && logo !== '' ? { logo } : {}),
  };
}

interface WebSiteLdInput {
  name: string;
  url?: string;
}

export function webSiteJsonLd({ name, url = BASE_URL }: WebSiteLdInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
  };
}

interface WebPageLdInput {
  name: string;
  description: string;
  url: string;
}

export function webPageJsonLd({ name, description, url }: WebPageLdInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url,
  };
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

interface JsonLdScriptProps {
  data: Record<string, unknown>;
}

/**
 * Render a JSON-LD script tag for structured data.
 * Use inside a server component's return JSX.
 */
export function JsonLdScript({ data }: JsonLdScriptProps): React.JSX.Element {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
