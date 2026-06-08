# Email

Email code handles user-facing communication and provider boundaries. Read `CLAUDE FILES/typescript.md`, `CLAUDE FILES/security.md`, and `CLAUDE FILES/writing/pipeline.md` when changing real copy.

Keep provider adapters behind the shared email interface. Callers should not import Resend, SMTP, or nodemailer directly.

Templates must be deterministic, typed, and safe to render with untrusted user data. Escape or encode dynamic content through React Email patterns rather than string-building HTML.

Do not log message bodies when they may contain personal data, tokens, reset links, or billing details. Log template name, recipient hash or ID when appropriate, provider message ID, and failure class.

Test template selection, provider failure handling, and any branching around verification, password reset, billing, or subscription state.
