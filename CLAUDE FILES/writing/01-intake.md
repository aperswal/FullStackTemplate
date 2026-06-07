# Stage 1: Intake

Turn the raw request into an audience profile. "Reader" below means whoever receives the piece: a Slack recipient, a room at a seminar, a prospect reading copy, a doc reviewer. Nothing gets written until this is clear. If you cannot state the audience's current belief and their needed belief, you do not understand the piece well enough to draft it.

## What to produce

A short profile with these fields. Keep each to a few lines.

| Field | What it captures |
|-------|------------------|
| Reader | Who reads this. Their role, and what they are measured on. If more than one audience, name the primary one. |
| Already knows | What the reader walks in knowing. This is what you will NOT explain. |
| Needs to know | The gap. What they must believe or be able to do by the end. |
| Start state | The reader's belief before reading. |
| End state | The belief or action the doc must produce. |
| The ask | If the doc requests a decision or sign-off, the question being asked, framed at the level the reader cares about. |
| Known limits | What you do not know, what the data cannot say. State these now so the draft does not paper over them. |

For a piece that has to move the audience to act (copy, a pitch, a cold email, a proposal that needs a yes), add three fields from `00-persuasion-principles.md`:

| Field | What it captures |
|-------|------------------|
| Demand | Does this audience already want the outcome (persuasion rule 5)? Name the existing pull: the pain they feel, the trend they ride, the question they are already asking. If there is no demand, the piece has to create it, which is far harder and worth knowing now. |
| Awareness | Where the audience's belief already sits (persuasion rule 3): unaware of the problem, problem-aware, solution-aware but undecided, or ready and just needing a reason now. The opening meets them there. |
| Single action | The one thing the audience should do next. Exactly one (persuasion rule 10). If you list two, the reader does neither. |

## How to do it

Pull from the request and any source material. Where the request is silent on a field, ask the user rather than guess. The reader profile is the contract for every later stage, so a wrong guess here propagates.

Frame "needs to know" as outcomes, not mechanisms. The reader cares whether forecast accuracy saves money, not which table the join used. Mechanism belongs in later sections, not in the gap statement.

Fix the end state as the destination, principle 5 in `00-craft-principles.md`. The end state is the last thing the reader should believe or do, and it is the compass every later stage points at. If you cannot state it, you cannot plan the path to it.

Name the audience's real knowledge honestly. Writing for SDEs and data scientists means you do not explain what wQL is or how subtraction works. Writing for a VP means you do not assume they know the schema. The "already knows" field decides what the draft is allowed to skip.

For a persuasive piece, check demand before anything else, persuasion rule 5. If the audience does not already want the outcome, the cleanest copy will still fail, and the honest move is to say so now rather than polish a piece aimed at no one. Awareness then sets where the opening starts: do not explain the problem to someone already solution-aware, and do not pitch the solution to someone who does not yet feel the problem.

## Adversarial pass

Spawn parallel critics, each on a different failure mode:

1. **Audience mismatch critic.** Does "already knows" match the named reader? If the reader is a data scientist and the profile plans to explain quantile loss, flag it. If the reader is an exec and the profile assumes schema knowledge, flag it.
2. **Vague-gap critic.** Is "needs to know" stated as an outcome the reader cares about, or as a vague area? "Understand the cost model" is vague. "Decide whether to fund regional forecasting" is an outcome. Flag vagueness.
3. **Hidden-assumption critic.** What is the profile assuming about the reader that the request never established? Surface every unstated assumption.
4. **Honesty critic.** Did the profile record what we do not know, or did it quietly assume completeness? Flag any limit the source material implies but the profile omits.
5. **Demand critic** (for a piece that must move the audience to act). Does the audience already want this outcome, and does the profile say so honestly? Flag a piece aimed at a crowd with no pull, and flag an awareness level that the planned opening will mismatch. A persuasive piece with no demand is the failure the meta-pattern in `00-persuasion-principles.md` names first.

A synthesizer merges the flags. If the profile fails, fix it here before Stage 2. A reader profile that survives these critics is the spec the template is built against.