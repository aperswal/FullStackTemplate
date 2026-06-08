# Analytics

Analytics must stay behind the local abstraction. Do not import PostHog or any provider directly outside this folder and its provider component.

Track meaningful product events tied to outcomes, not every click. Event names and properties are contracts; keep them stable, typed, and sparse.

Respect consent before firing client analytics. Do not collect secrets, raw email addresses, tokens, full URLs with sensitive query params, payment details, or private message content.

When adding an event, update tests around consent behavior and provider mapping. Prefer one generic internal event API over provider-specific calls in product code.
