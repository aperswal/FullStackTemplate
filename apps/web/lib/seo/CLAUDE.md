# SEO

This folder owns metadata, JSON-LD, canonical URLs, and discoverability helpers for public pages.

Use typed helpers rather than hand-assembling metadata in each route. Keep titles, descriptions, Open Graph data, canonical URLs, and structured data consistent with route intent.

Marketing pages must be crawlable, semantic, and accessible. Do not add client-only wrappers or auth-dependent metadata to public SEO surfaces.

Dynamic values in JSON-LD must be validated and escaped through React or typed serializers. Keep tests for generated metadata and structured data whenever fields or URL rules change.
