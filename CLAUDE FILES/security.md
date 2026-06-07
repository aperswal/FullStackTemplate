# Security

Read together with `core.md`. These rules cover writing and designing secure systems — threat modeling, authorization, untrusted input, injection, authentication, cryptography, secrets, and operations. Apply them whenever a task touches authentication, authorization, untrusted input, API routes, cryptography, secret handling, file uploads, or any trust boundary. This is the standing guidance for *writing* secure code; the `/security-review` command reviews a specific diff after the fact.

This is a deduplicated synthesis of threat-modeling and secure-design practice (STRIDE, attack trees, defense in depth, fail-closed design, applied cryptography). It is also mirrored as the on-demand `security` skill; `engineering-principles` defers all security depth here.

## Threat Model First (Design Time)

- **Start every system by answering four questions:** what are you building, what can go wrong, what will you do about it, and did you do a good job. Threat modeling before code is the cheapest place to find a flaw.
- **Find threats systematically, not by imagination alone.** Use a structured framework like STRIDE — spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege — and build attack trees to reason about how an attacker reaches a goal through combinations of smaller steps.
- **Name your actual adversary and what they want.** Defenses only make sense relative to a specific opponent's capabilities and motives.
- **Write explicit security and privacy requirements up front,** because you can't build or test for a property you never specified. Review the design for security before any code is written.
- **Make trade-offs and residual risk explicit.** Every mitigation has costs and limits; document what risk you're accepting and why, and verify that the threats you identified are actually mitigated rather than assuming a control works because it exists.

## Core Rules

- **Never trust client-side controls.** Enforce every security decision on the server, where the attacker can't tamper with it. Validate and sanitize all input on the server regardless of what the client already checked.
- **Check authorization on the server for every request.** Enforce access control at the data layer for each route and action, not by hiding the forbidden option in the interface — hiding a button is not access control. Assume the attacker calls your endpoints directly.
- **Treat anything from outside as hostile until proven otherwise.** Validate, sanitize, and encode all untrusted input at every trust boundary; validate at the boundary, then trust it internally so bad data can't spread.
- **Give every component, process, and person only the access they need and nothing more** (least privilege).
- **Build defense in depth** with multiple independent boundaries, so a single failure doesn't compromise everything. Assume parts will be compromised and design for containment, resilience, and recovery to a known-good state.
- **Make systems fail closed and fail safe** — default to denying access when something goes wrong.
- **Make the secure path the easy path.** Users and developers route around security that fights them, so usability is itself a security property.

## Injection and Output Encoding

- **Prevent injection by separating code from data.** Use parameterized queries and safe APIs instead of building commands or queries from string concatenation. This applies to SQL, shell, LDAP, and template injection alike.
- **Defend against cross-site scripting by contextually encoding all output** to the context where it lands — HTML body, attribute, JavaScript, or URL.
- **Understand the browser security model before relying on it** — same-origin policy, origin inheritance, and content isolation — since its edge cases are where web attacks live. Set a content security policy, CSRF protection, and strict transport security.

## Authentication and Sessions

- **Use a proven authentication library** rather than building sessions, token handling, or password hashing from scratch.
- **Defend authentication against guessing, credential stuffing, and bypass** with rate limiting, lockout, and multi-factor support.
- **Protect session tokens from prediction, fixation, and theft.** Rotate tokens on login and privilege change, and set cookies `Secure`, `HttpOnly`, and `SameSite`.

## Cryptography and Secrets

- **Don't invent your own cryptography.** Use well-vetted algorithms and libraries in their intended modes.
- **Use authenticated encryption** so data is protected for both confidentiality and integrity, never plain encryption alone.
- **Treat randomness as security-critical.** Use a cryptographically secure generator with proper entropy for keys, nonces, and tokens; never use an ordinary or unseeded pseudo-random source for anything security-bearing.
- **Generate, store, rotate, and destroy keys deliberately,** because the secrecy of the key is often the only thing standing between you and the attacker. Keep secrets server-side only — never in code, logs, or the repository.
- **Prefer modern, well-parameterized primitives** (RSA, Diffie–Hellman, elliptic curves done right), and start planning post-quantum migration where data needs long-term secrecy.

## Operations and Resilience

- **Plan for denial of service explicitly,** with rate limits, graceful degradation, and capacity to absorb load.
- **Log and monitor security-relevant events** so you can detect, investigate, and reconstruct what happened during an incident — without logging secrets.
- **Minimize information disclosure and side channels.** Return generic error messages, use constant-time comparison for secrets, and strip revealing metadata; error messages, timing, and metadata leak more than you think.
- **Plan for incidents before they happen,** with clear roles, runbooks, and communication paths so response isn't improvised under pressure. After an incident, recover to a known-good state and run a blameless post-mortem that fixes root causes rather than symptoms.
- **Design for a changing landscape.** Assume requirements, threats, and dependencies will shift, and build in the ability to update and rotate.

## Privacy

- **Treat privacy as a first-class goal.** Minimize the data you collect and protect what you keep, rather than bolting privacy on later.

## Memory Safety (When It Applies)

- **For native or unsafe code,** understand how buffer overflows, integer errors, and unsafe C constructs actually work, and prefer memory-safe languages and bounds-checked APIs to avoid them. Mostly not applicable to TypeScript or Python stacks, but relevant for native extensions and FFI boundaries.
