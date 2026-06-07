# Core Principles (language-agnostic)

These rules apply to every project regardless of language or framework. The stack-specific files (`typescript.md`, `python.md`) name the concrete tools that implement these principles for each ecosystem; where a principle below names a mechanism generically (typed interfaces, env validation, a structured logger), the matching stack file specifies which library provides it.

This is a deduplicated synthesis of *The Pragmatic Programmer*, *Clean Code*, and *Code Complete* together with this project's own conventions. The three sources overlap heavily; each idea is stated once here, in the section where it belongs. When two ideas conflict, the more specific one wins.

## Professional Attitude

- **Take responsibility.** Own your work and your decisions. When something breaks, bring options and solutions instead of excuses, and don't fix the blame — fix the problem.
- **Fix broken windows immediately.** Bad code, bad designs, and bad decisions signal that rot is acceptable and compound until productivity trends toward zero. Repair them the moment you see them rather than betting on a future grand rewrite that rarely catches up to the system it replaces. Apply this at the team level too.
- **Leave it cleaner than you found it (Boy Scout Rule).** Every time you touch code, improve it a little. Watch the big picture: projects die from slow, unnoticed degradation, like a frog that doesn't notice the water boiling.
- **Keeping code clean is your professional responsibility.** Deadlines and managers are not a license to make a mess, because messes make you slower, not faster. Sign your work and take pride in it.
- **Negotiate quality as a requirement.** Know when "good enough" is genuinely good enough so you stop gold-plating, and gently exceed what users actually want rather than what they asked for.
- **Invest in knowledge deliberately,** like a portfolio: diversify, take some risks, review regularly. Critically analyze what you read and hear rather than accepting it on authority.
- **Admit what you don't know, own your mistakes, and understand a problem before acting on it.** Practice good techniques deliberately until they become automatic habits.
- **Communication is half the job.** Know your audience, plan what you say, and pay as much attention to how you say it as to what.

## Managing Complexity and Design

- **Break every problem into pieces small enough to hold in one person's head.** This is the central goal that most other rules serve.
- **Hide information behind clean interfaces.** For each module ask "what should this hide?" and expose abstract interfaces, not raw data. Give each class or module one consistent abstraction and reveal as little of its internals as you can get away with.
- **Isolate what is most likely to change** behind an interface now, before it changes. Identify those parts deliberately.
- **Program close to the problem domain.** Let the solution's vocabulary mirror the problem's, work at the highest level of abstraction you can, use layers, and reach for a domain-specific language when it expresses domain logic at the right level. Captured abstractions outlive the specific details.
- **Try several design approaches before committing,** working both top-down and bottom-up, and reach for a known design pattern when one genuinely fits.
- **Let architecture emerge incrementally** — you can't get it fully right up front — but resolve requirements and high-level architecture before construction, since defects get far more expensive the later you catch them. Confirm the architecture addresses data, error handling, security, performance, and likely changes.
- **Defer decisions to the last responsible moment,** when you know the most. Assume there are no final decisions: avoid one-way doors and design so choices can be reversed later.
- **Don't abstract until you have two concrete cases.** An abstraction shaped by one case is shaped by a guess; duplication you can see is less dangerous than a wrong abstraction that hides bad assumptions. When the second case appears, what the cases truly share becomes obvious.
- **Pursue simple design, in priority order:** it passes all the tests, contains no duplication, expresses intent clearly, and minimizes the number of classes and methods.
- **Find the real box** by separating true constraints from the false ones you imposed — don't merely "think outside" it.
- **Tools and methods are aids, not goals.** Don't be a slave to formal methods or diagramming tools; expensive tools don't produce better designs. Adopt standards and frameworks only when they add demonstrable value, and choose tools on their merits, not loyalty or fashion.
- **Never use code you don't understand,** including wizard- or tool-generated code. Don't program by coincidence — know *why* your code works instead of relying on luck.

## Modularity, Coupling, and Boundaries

- **Minimize coupling and keep components orthogonal,** so a change in one doesn't ripple into unrelated others. If removing or replacing one module forces changes across unrelated parts of the codebase, the boundaries are wrong.
- **Write shy code that obeys the Law of Demeter:** talk only to your immediate collaborators, never reach through chains of objects (train wrecks), and avoid transitive navigation across the object graph.
- **Give every class and module one reason to change** (Single Responsibility), and keep it cohesive — few instance variables that most methods use. Preserving cohesion produces many small classes, which is good. Split god classes and delete classes that carry no behavior.
- **Depend on abstractions, not concretions** (dependency inversion), and compose small focused pieces rather than building large units that know about everything. Add features by extension rather than by editing existing code (open/closed).
- **Use composition by default;** use inheritance only for true "is-a" relationships, keep hierarchies shallow, and make subclasses fully substitutable for their base.
- **Separate constructing the system from using it** — push object construction to main, factories, or dependency injection.
- **Respect the data/object anti-symmetry:** objects hide data and expose behavior, data structures expose data and have none. Don't build hybrids that get the worst of both, and use pure data transfer objects at the edges where you talk to databases and APIs.
- **Wrap third-party code behind your own interface** so you control it and contain the blast radius of changes. Learn external libraries with small "learning tests" that also catch breaking changes on upgrade. When a dependency doesn't exist yet, define your own interface and adapt to it later.
- **Separate models from views and communicate through events** (MVC) to keep components decoupled. Handle cross-cutting concerns — persistence, security, logging — as aspects rather than scattering them everywhere. Coordinate independent agents through a shared workspace (blackboard) rather than tight coupling.
- **Make logical dependencies physical and explicit** rather than assumed; keep configurable data at high levels and pass it down. Eliminate feature envy: a method should care about its own class's data, not another's.
- **Define an exported, typed interface for every data shape that crosses a boundary** — between modules, between client and server, or between your code and an external API. These contracts let the type checker break every dependent site loudly when one side changes instead of failing silently.

## Project Structure

- **Use a feature-based directory structure** that colocates a unit of behavior with its validation schema, types, and tests, rather than separating by file type. Keep a separate shared directory for truly reusable utilities, primitives, and configuration. Follow consistent naming conventions across the project, and never invent a new organizational pattern midway through the build.

## Functions and Routines

- **Keep functions small, then smaller,** and let length follow from doing one thing rather than from a line limit. Blocks inside control statements should be about one line — usually a call.
- **A function should do one thing, do it well, and do only that,** at a single level of abstraction, descending exactly one level below its own name.
- **Make code read top-to-bottom like a narrative** (the Stepdown Rule), each function followed by the next level down.
- **Name a function after its return value and a procedure with a strong verb plus object,** covering everything it does — including any side effects. If you must read the body to know what it does, rename it.
- **Use as few arguments as possible** — zero is ideal, three needs strong justification. Order them input → modify → output, use every parameter, never reuse a parameter as a scratch variable, and wrap related arguments into objects.
- **Never pass flag or selector arguments;** a boolean that switches behavior means the function does more than one thing. Split it into separate functions.
- **Separate commands from queries:** a function should either do something or answer something, never both. Avoid hidden side effects and output arguments.
- **Prefer polymorphism to repeated if/else or switch/case,** and bury unavoidable switches in low-level factories.
- **Write a routine to reduce complexity, not merely to remove duplication.** You won't write clean functions on the first try — write them messy and refactor relentlessly until they're clean.

## Naming

- **Use intention-revealing names;** if a name needs a comment to explain it, the name has failed.
- **Avoid disinformation and make meaningful distinctions.** Don't call something a "list" if it isn't, don't use names that differ only subtly, and don't pad with noise words or number series (a1, a2).
- **Use pronounceable, searchable names** — you have to discuss code aloud and grep for it. Use longer names for longer scopes and name things fully; never abbreviate to save keystrokes.
- **Don't encode type or scope into names** (Hungarian notation, member prefixes); tools made these obsolete and they add mental load. Don't force readers to mentally map names onto the concepts they mean.
- **Name classes with nouns and methods with verbs,** use one word per concept consistently, and don't be cute or pun. Prefer solution-domain (technical) names where they fit and problem-domain names where they don't; use standard nomenclature where it exists.
- **Name booleans positively** (done, found, success), replace magic numbers with named constants, and use enums rather than bare integer codes. Apply naming conventions consistently across the whole codebase. Code is read far more often than written — optimize every name for the reader.

## Don't Repeat Yourself

- **Every piece of knowledge should have one single, authoritative representation.** Duplication is the root of most maintenance evil; remove all of it. If you find yourself copying logic, extract it into a shared function and call it from both places.
- **Make reuse the path of least resistance** so it becomes the natural choice.
- **Write code that writes code** to kill drudgery and keep parallel representations in sync, and learn a scripting/text-manipulation language to automate routine transformations.

## Comments and Self-Documentation

- **Make code self-documenting through structure and names** so you need fewer comments; improve the code before reaching for a comment to explain it. Never use comments to compensate for bad code.
- **Comment the why, not the what,** and update comments whenever you change the code. The only comments worth keeping are the ones you couldn't replace with code: legal notices, statements of intent, warnings of consequences, TODOs, amplification, and public-API docs.
- **Treat most comments as suspects to delete:** redundant, misleading, mandated, journal, noise, position markers, and closing-brace tags. Never leave commented-out code — version control already remembers it — and never put information in comments that belongs in version control or an issue tracker.
- **Build documentation in rather than bolting it on,** and treat prose as just another language you write carefully.

## Formatting and Layout

- **Lay out a file like a newspaper:** high-level concepts at the top, details below, blank lines separating concepts, and related lines kept close.
- **Declare variables near their first use** and keep dependent functions and references vertically close.
- **Keep lines short enough to need no horizontal scrolling,** and use indentation to reveal scope and logical structure.
- **Agree on one team layout style and apply it consistently** — consistency beats personal preference, and a formatter should own it (see the stack files). Minimize the number of languages in a single source file.

## Variables, Data, and State

- **Give every variable exactly one purpose** and never repurpose it. Declare and initialize each variable right before its first use and keep all references to it close together.
- **Avoid global data;** when you can't, wrap it in access routines. Make each piece of state have a single owner: one part of the system writes it, others only read it. Two writers produce race conditions, stale data, and order-dependent bugs.
- **Replace magic numbers with named constants** and bare integer codes with enums. Never compare floating-point numbers for equality, and avoid adding values of very different magnitudes.
- **Isolate pointer operations,** check pointers before use, and null them after freeing.
- **Use the simplest state location that fits each piece of data.** Put state that should survive a refresh or be shareable into URL/route params; put state only one component needs into that component's local state; reach for shared state management only when two unrelated components genuinely need the same data and neither URL state nor lifting to a common parent solves it cleanly. Never centralize state for convenience — every level you hoist multiplies rerenders and obscures dependencies.
- **Build frontends stateless.** The frontend is a rendering layer over server-owned data: it must be able to reload at any moment and reconstruct everything from the server and from URL state, never from data it alone remembers. Keep only ephemeral view concerns (a menu's open state, unsubmitted input) in the client and derive everything else from server state through the caching layer. Never store the canonical version of anything in client memory, and never make a security or correctness decision based on state the client could have invented.

## Control Flow

- **Write the common-case path first, then the exceptions,** and handle every branch including the "impossible" else.
- **Pull complex boolean tests into well-named functions or a decision table.** Write boolean expressions positively, parenthesize for clarity, use DeMorgan's laws to simplify negations, and avoid negative conditionals.
- **Keep loops single-purpose** with one entry point, and check the endpoints for off-by-one errors. Encapsulate boundary and off-by-one logic in one place, and test every boundary condition — intuition fails at edges.
- **Keep nesting to about three levels;** extract routines or use guard clauses when it gets deeper. Use early returns, guard clauses, and recursion sparingly — recursion only when it's clearly simplest and provably terminates — and avoid goto.
- **Replace tangled conditionals with a lookup table** when the table is clearer.
- **Make hidden temporal couplings explicit** by forcing call order through the API.
- **Implement the behavior a reader would obviously expect** (Principle of Least Surprise), and structure code for a reason rather than arbitrarily.

## Defensive Programming, Contracts, and Errors

- **Design by contract:** state each module's preconditions, postconditions, and invariants explicitly.
- **Validate all external input at the boundary, then trust it internally** so bad data can't spread. Fail early and explicitly rather than letting bad data travel deep before something breaks. Decide up front whether each component favors correctness or robustness, and code accordingly.
- **Use assertions for things that can't happen and error handling for things that can.** Crash early — a program that dies cleanly does far less damage than one that limps along corrupting state. Don't drown the code in trivial defensive checks; keep the ones that matter and never disable safeties like compiler warnings or failing tests.
- **Throw exceptions rather than returning error codes,** and reserve them for genuinely exceptional cases, never ordinary control flow. Write the try-catch-finally first to define the transaction's scope, prefer unchecked exceptions (checked ones break encapsulation and open/closed), give every exception enough context to find the source and intent, and define exception classes around how callers will use them.
- **Define a normal flow with the Special Case pattern** so callers don't handle exceptional behavior everywhere. Don't return null and don't pass null — return empty collections or special-case objects instead.
- **Whoever allocates a resource frees it,** in the same scope. Finish what you start.
- **Handle errors with blame attribution.** Classify every failure by its source — client, server, network, or third party — map it to the right status code, and surface a human-readable explanation of what went wrong, who is responsible, and what the user can do. Never swallow errors silently or show generic fallbacks, and isolate failures to the smallest possible blast radius so a fault in one component shows a local fallback rather than taking down the whole surface.

## Testing and Test-Driven Development

- **Design for testability from the start;** test your software yourself, or your users will do it for you. Let tests drive the design — writing the test first forces clean, decoupled interfaces seen from the caller's point of view. Combine several defect-finding techniques rather than relying on testing alone, and run blame-free reviews focused on finding defects.
- **Follow the red-green-refactor rhythm.** Write a small failing test first, run it and watch it fail so you know it tests something and isn't passing by accident, make it pass as fast as possible — even by hard-coding a constant — then remove the duplication between test and code. Never refactor while a test is red. The three laws of TDD bound the loop: no production code without a failing test, only enough test to fail, only enough code to pass.
- **Keep a running list of every test you want to write and pull from it one at a time,** so you never hold the whole problem in your head. Begin with a small starter test you're sure you can pass quickly and that teaches you something about the problem, write the test for the case you most want to handle, then work backward to make it real.
- **Vary your step size deliberately:** type the implementation directly when it's obvious and you're confident, but drop back to tiny steps the instant a failure surprises you. When you're stuck or taking giant leaps, throw the code away and restart smaller, and take a break when tired — stepping away often dissolves the problem. Use the discipline to manage fear: when anxiety about a change rises, write a test and let it turn uncertainty into concrete, manageable steps.
- **Let duplication drive design.** Removing the duplication between test and code is what actually reveals the structure, so treat every instance as a sign that design is missing. Generalize only when two or more concrete examples force it (see *Managing Complexity*), refactor only on a green bar in small reversible moves with the tests run after each, and aim refactorings toward known patterns (value object, null object, template method, pluggable object) rather than deciding them up front.
- **Treat test code as a first-class citizen.** Dirty tests are worse than none because they rot and get abandoned; tests are what let you change code without fear, so keep them clean, and clean means readable above all. Judge a suite by whether it lets you change code fearlessly and catches the mistakes you actually make.
- **Make tests Fast, Independent, Repeatable, Self-validating, and Timely (F.I.R.S.T.),** with one assert and a single concept per test. Keep tests isolated so run order and shared state never affect one another: set up fresh data before each test and tear it down after, so every test runs against a clean, known state. Write the assertion first, then work out the minimum setup that makes it meaningful, and choose test values that make the relationship you're checking obvious rather than arbitrary.
- **Isolate what you can't exercise directly behind a fake, mock, or stub you control,** and probe unfamiliar third-party libraries with small learning tests before building on them (see *Modularity* for wrapping third-party code behind your own interface).
- **Cover everything that could break** and use a coverage tool to find the gaps, but decide deliberately what *not* to test: skip code you didn't write and trivial code with no logic, and concentrate tests where mistakes are likely. Don't skip a trivial test that documents intent, and treat an ignored test as an open question about an ambiguous requirement.
- **Test boundary conditions, and test exhaustively around any bug you find,** since defects cluster. When a bug slips through, first write a test that reproduces it, then fix it, so it can never return silently. Use saboteurs to test your tests, aim for state coverage over code coverage, and read patterns of failure and coverage for diagnostic clues.
- **Keep the suite fast and run it constantly,** since slow tests get skipped and skipped tests rot. Build the whole system and run all its tests with a single command each. Commit only when all tests pass, never with a broken test, so the shared codebase always works — though leaving one deliberately failing test at the end of a session marks exactly where to pick up next time.

## Concurrency

- **Design for concurrency by analyzing workflow** so you don't silently bake in assumptions about order and timing. Concurrency decouples what gets done from when, but it's genuinely hard: it doesn't guarantee speed, its bugs aren't repeatable, and it forces design changes.
- **Keep concurrency code separate from other code** (Single Responsibility), limit and protect shared data, prefer copies, and make threads as independent as possible.
- **Know your platform's thread-safe collections and concurrency utilities,** and understand the classic models (producer-consumer, readers-writers, dining philosophers).
- **Keep synchronized sections small and few, and plan clean shutdown early,** because terminating concurrent systems cleanly is hard.
- **Test threaded code by treating spurious failures as real bugs,** getting the nonthreaded logic working first, and making the threading pluggable and tunable so you can run it many ways.

## Refactoring and Continuous Improvement

- **Refactor early and often — continuous gardening, not a rare emergency** — but not right before a release. Make changes one at a time, in small steps, keeping all tests green after each.
- **Make it work, then make it right** (then, only if measurement demands, make it fast). Clean code is the product of relentless successive refinement; even good, published code can be improved.
- **Treat awkwardness, smells, and defect clusters as signals to stop and look for a deeper problem.** Never let code degrade past the point of easy cleanup.
- **Delete dead code the moment it becomes unused** — functions, variables, files, schema columns, stale migrations, outdated tests. Dead code lies to the next reader that it matters. When a feature is removed, trace and remove everything that existed only to support it. Never delete a passing-blocking test just to make a feature pass — investigate whether it caught a real problem first — and never comment code out "in case." Run the linter and type checker after every cleanup pass.

## Debugging

- **Fix the problem, not the blame.** Don't panic, and don't assume — prove it.
- **Reproduce and shrink the error, then form and test hypotheses** until you find the root cause. Don't guess-and-tweak, and actually understand the algorithm rather than tweaking until tests pass.
- **Find and fix the actual cause, not the symptom,** then scan for similar defects elsewhere, since bugs cluster.

## Performance

- **Get code correct and clear before optimizing anything.**
- **Profile to find the real hot spots before tuning, and measure again afterward** to confirm the change actually helped.
- **Estimate the order (Big-O) of your algorithms and test those estimates against reality.**
- **Try design, data-structure, and algorithm changes before low-level code tuning,** and keep and comment the untuned version, since tuned code reads worse.

## Requirements, Planning, and Delivery

- **Don't just gather requirements — dig for them.** Work alongside users, learn to think like a user, and capture true requirements as the system's metadata and configuration: configure, don't integrate, pushing details out of hardcoded logic.
- **Use tracer bullets:** build a thin, real, working end-to-end skeleton through the whole stack first, then flesh it out with fast feedback. A real top-to-bottom slice exposes integration problems on day 1 instead of day 12; never perfect one layer against mock data before the layers connect.
- **Prototype to learn.** Throwaway prototypes exist to answer questions and burn down risk, not to become the product.
- **Estimate to avoid surprises,** refine estimates as you learn, track actuals against them, and iterate the schedule alongside the code. Scale process formality and upstream effort to the size of the project, and grow the system incrementally.
- **Listen to your nagging doubts and start when you're genuinely ready,** without letting readiness become an excuse to procrastinate. Accept that some things are better done than described — don't over-specify yourself into paralysis.

## Tooling and Automation

- **Keep knowledge in plain text** — it outlives formats and works with every tool.
- **Master the command shell** (it composes where GUIs constrain), learn one editor extremely well and use it for everything, and use version control for everything, including requirements, design, and solo work.
- **Automate everything you can and eliminate manual, error-prone procedures.** Integrate incrementally with daily builds and smoke tests so the system always works.
- **Invest time in learning your tools** — editor, version control, diff/merge, debugger, analyzers, build system.

## Application and Operational Concerns

These are this project's conventions for the running application; the stack files name the concrete libraries.

- **Validate environment configuration at startup in one dedicated module.** Parse and validate every variable and secret once, fail loudly at boot if anything is missing or malformed, derive config types from that module, and never read environment variables directly anywhere else.
- **Use a structured JSON logger** with timestamps, severity levels, and contextual fields, created once in a shared location and imported everywhere. Use leveled methods; never use raw print statements in production code.
- **Keep API responses consistent.** Every endpoint returns the same response shape with one casing convention, returns proper status codes that reflect what actually happened (never a success code with an error field in the body), and includes blame-attributed error messages. Define shared response types so the contract is explicit and type-checked.
- **Use a proven authentication library** rather than building sessions, tokens, or password hashing yourself. Protect sensitive routes with middleware that runs before any route logic, store secrets server-side only, enforce role-based access control at the data layer (not just the UI), validate and sanitize all input on the server regardless of client checks, and set secure transport and response headers (CSP, CSRF protection, HSTS).
- **Design the database with integrity constraints from the start** — uniqueness, foreign keys, required fields, valid ranges — so bad data can't exist regardless of code path. Keep the schema simple and migration-friendly; don't over-normalize or add indexes upfront, since both are downstream of access patterns you don't yet know. Select only the fields you need, paginate all list queries, use transactions when operations must succeed or fail together, and make every schema change a reversible migration.
- **Build accessible, semantic interfaces.** Use the correct semantic element for its purpose, maintain logical heading hierarchy, keep visible focus indicators and full keyboard navigation, and never communicate meaning with color alone. Every flow must be completable without a mouse.
- **Make public pages discoverable.** Provide descriptive meta titles, descriptions, Open Graph tags, and canonical URLs; give every image descriptive alt text; use human-readable slugs rather than IDs; and generate a sitemap and robots configuration.
- **Use a mobile-first, fluid layout** that works across screen sizes without horizontal scrolling or overlap; never hardcode widths or heights when relative values work.
- **Apply intentional visual design.** Use consistent spacing, a clear hierarchy where the most important thing is the most prominent, proximity and whitespace over borders to group elements, a small type scale, and a tight palette with one primary action color and semantic success/warning/error states. Give interactive elements comfortably tappable size, and remove any element that doesn't communicate information or aid navigation.
- **Track analytics through an abstracted event layer.** Expose generic methods for page views, actions, and conversions from one utility so providers can be swapped, track meaningful actions tied to business outcomes rather than every click, and respect consent before firing anything.
