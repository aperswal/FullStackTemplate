# Product Discovery and UX Design

Read together with `core.md`. These rules cover how to discover what to build and how to design user-facing interfaces. Apply them whenever a task involves users, product decisions, or interface design — not just visual styling, but the upstream questions of whether you're building the right thing at all. They are domain rules; the stack files (`typescript.md`, `python.md`) name the tools you build the result with.

This is a deduplicated synthesis of usability and product-design sources (Norman, Krug, *The Mom Test*, continuous discovery, and product-strategy practice) together with this project's conventions. Where a principle is already stated in `core.md` (prototype to learn, dig for requirements, visual design fundamentals), this file adds only the UX-specific depth and points back rather than restating it.

## Talking to Users (The Mom Test)

- **Ask about their actual life and problems, never pitch your idea.** Opinions about your idea are worthless data; what they already do and struggle with is real data.
- **Ask what happened in the past, not what they'd do in the future.** Hypothetical future behavior is fiction. Anchor every question in concrete, already-occurred events.
- **Discard compliments, "I would / I always" fluff, and feature requests.** Dig past them to the real problem and what the person does about it today.
- **Talk less and listen more.** The conversation is about them, not you.
- **Trust commitment over enthusiasm.** "Cool" is free; real interest is giving up time, reputation, or money. Watch what users do and commit to, not what they say.

## Research Methods and Synthesis

- **Match the method to the question:** interviews and contextual inquiry to *discover*, usability tests to *evaluate*, surveys and analytics to *measure*. Don't use a measuring tool to answer a discovery question.
- **Plan each study around one clear question,** recruit the right people, and guard hard against leading questions and confirmation bias.
- **Synthesize raw notes into insights** through affinity mapping, and share them so they actually move decisions rather than sitting in a doc.
- **Validate at scale what qualitative work first surfaced,** using analytics and A/B tests to confirm patterns small studies suggested.

## Product Strategy and Outcomes

- **Aim at outcomes, not output** — the behavior or result you want, not the count of features shipped.
- **Run an opportunity assessment before committing:** who it's for, what problem it solves, how you'll measure success, and why now.
- **De-risk the four questions early — value, usability, feasibility, and viability —** before engineering invests. Start from real human desirability, then test feasibility and viability against it rather than the reverse.
- **Empower cross-functional teams with problems to solve, not feature lists to execute,** and set a compelling product vision and strategy that aligns every decision.
- **Treat constraints as creative fuel,** balancing desirability, feasibility, and viability, and bring T-shaped, multidisciplinary people together with explicit brainstorming rules.
- **Tell the story of your design to win buy-in** and spread the idea through the organization — the best solution still has to be adopted.

## Discovery Process

- **Diverge then converge twice:** once to find the right problem, again to find the right solution.
- **Work in tight loops:** observe, ideate, prototype, test, repeat.
- **Keep discovery continuous alongside delivery,** not a one-time phase that ends when build begins.

## Prototyping

`core.md` already establishes that prototypes are throwaway tools to burn down risk. For UX work, add:

- **Use the cheapest prototype that can answer the question** — sketches before wireframes before mockups before code. Fidelity costs time; spend only what the question needs.
- **Test value and usability on prototypes with real users before engineering invests,** so the expensive build starts from validated direction.

## Usability Fundamentals

- **Make the right action obvious through affordances and signifiers,** so people see what's possible without being told.
- **Give immediate, visible feedback for every action,** and keep the system's current state perceivable at all times.
- **Map controls to their effects naturally** — put the control near, or shaped like, the thing it changes.
- **Push knowledge into the world, not into the user's memory,** so the interface lets people form a correct mental model on their own.
- **Design for how people actually behave:** they scan rather than read, satisfice rather than optimize, and muddle through rather than figure things out.
- **Eliminate question marks.** Every screen should be self-evident enough that the user never stops to think about how it works.
- **Cut choices and steps.** Fewer options decide faster, and bigger, closer targets are faster to hit.
- **Prevent errors with constraints and forcing functions,** and when errors happen make recovery easy instead of blaming the user.

## Conventions, Hierarchy, and Navigation

- **Reuse established interaction patterns and conventions** rather than inventing new ones — users bring expectations from everywhere else. Don't be original where originality only adds confusion.
- **Build a clear visual hierarchy** where size, weight, color, and grouping show what matters and what relates to what, using alignment, contrast, whitespace, and Gestalt grouping so structure is visible at a glance. (See `core.md` → *Application and Operational Concerns* for the visual-design fundamentals this builds on.)
- **Make navigation answer three questions** — where am I, where can I go, and where have I been — with persistent navigation and breadcrumbs.
- **Make the entry point instantly communicate what this is and what to do next.**

## States, Forms, and Copy

- **Design the full UI stack for each screen:** ideal, empty, error, partial, and loading states — not just the happy path.
- **Turn empty states into onboarding moments** rather than dead ends.
- **Design forms for least effort:** sensible defaults, forgiving input formats, inline help, and clear labels.
- **Treat interface copy as part of the design** — clear, human microcopy that guides and reassures.
- **Add delight, personality, and motion only after the core experience works,** never as a substitute for it.

## Persuasion and Ethics

- **Learn the persuasion levers** so you can both apply them and detect them being used on your users.
- **Persuade by making the desired behavior easy and rewarding,** removing friction toward it, and build conversion funnels by matching motivation to each step.
- **Draw the line between persuasion and deception.** Persuasion helps users reach their own goals; coercion serves you at their expense. Refuse dark patterns, never trick people through a funnel, and earn a reservoir of goodwill by being honest and respecting users' time and effort.

## Usability Testing

- **Run small usability tests early and regularly** — testing one user beats testing none, and a scrappy DIY test beats a perfect one you never run.
- **Watch what users do, not what they say,** and fix the most serious problems first.
