# Components

This folder contains reusable React components for the web app. Read `CLAUDE FILES/typescript.md` and `CLAUDE FILES/ux.md` before changing UI behavior.

Keep components presentational unless the component's purpose is explicitly to connect a feature to an integration, such as checkout or cookie consent. Feature-specific behavior belongs under `features/`.

Use semantic HTML, visible focus states, keyboard support, and accessible names. Do not communicate meaning by color alone.

Use Tailwind utilities for styling and keep class order readable: layout, spacing, typography, color, states. Do not introduce custom CSS unless Tailwind cannot express the behavior.

Client components must be small and justified. Keep server data fetching out of generic components; pass typed props in from route or feature code.
