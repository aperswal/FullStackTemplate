# UI Primitives

This directory is the local shadcn/ui primitive layer. Treat it as shared design-system code.

Install new primitives through the shadcn CLI whenever possible, then adapt them minimally to this app's tokens, accessibility needs, and Tailwind conventions.

Do not put product-specific copy, routing, data fetching, auth checks, or provider logic in this folder. Primitives should expose typed props and predictable variants, then let higher-level components compose them.

Keep variants small and intentional. If a variant exists only for one screen, prefer styling the composed component outside this folder.

When changing a primitive, scan all call sites because the blast radius is app-wide.
