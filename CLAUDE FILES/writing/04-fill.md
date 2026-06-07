# Stage 4: Fill

Turn the storyboard into a written draft. Each section executes its belief transition using its evidence. Write in the voice from `00-voice-reference.md`.

Needs the storyboard (Stage 3), `00-voice-reference.md`, `00-craft-principles.md`, and `00-line-principles.md`. Owns craft principles 8, 9, 10 (leave the known parts underwater, cut what readers skip, raise the stakes when a section goes slack) and the line principles for how each sentence reads.

## How to do it

Write each section to move the reader from its belief-in to its belief-out, using only the evidence the storyboard listed. The storyboard already decided what each section says; your job is to say it well.

Open each section with the sentence that bridges belief-in to belief-out. If you cannot write that first sentence, you do not yet understand the section's job; go back to the storyboard.

When you explain something complex, name the concept, then explain the mechanism, then give the concrete case. Three sentences, each increasing the output of the one before. "We expect this to fluctuate" then "as devs move to harder work and replace tasks again, it rises and falls." Abstract, then concrete.

Use more words only when they raise the output of the sentences around them. A sentence that makes an abstract claim concrete earns its length. A sentence that restates what the structure already showed is waste at any length. Brevity is not the goal; information per sentence is.

Vary sentence length on purpose. A run of same-length sentences reads like a machine. Short declarative sentences carry weight; let them.

Put structured information in tables, not prose. A list of sources, a set of filters, a results comparison: table. Reserve code blocks for code.

When you hit a fact the reader can recompute, show it to the precision where it reconciles. If the savings is a subtraction of two costs shown in a table, show enough decimals that the subtraction works on the page.

Link sources rather than narrate them. "Confirmed in [this thread]" beats a paragraph retelling the thread.

Leave the known parts underwater, principle 8. You built more in the storyboard than the reader needs on the page. State the call and the one fact behind it; let the supporting work stay submerged. This only works when you actually know what you left out. Omitting what you never worked out leaves a hole, not depth.

Enter late and leave early, principle 9. Open each section on its first real claim, not the run-up to it. End on the point, not a paragraph mulling it. The connective "and so we did the setup" bridges are what readers skim, so cut them to the next thing that matters.

When a section goes slack, raise the stakes, principle 10. Ask what would sharpen it for the reader right now: a number instead of a vague size, the consequence of ignoring it, the deadline it races. If a jolt would genuinely help, the real problem is the section has no goal, so fix that rather than padding it. Do not add a stake with no payoff later; that breaks principle 7.

Show, do not tell, screen principle 6 in `00-screen-principles.md`. Give the reader the evidence and let them reach the conclusion. Show the two numbers and let the reader see the gap; do not show them and then state "this is a big gap." When the specifics already carry the point, stating the point on top is the on-the-nose line that kills it. This is the partner of the concrete-claim rule: that one says back every claim with evidence, this one says once the evidence is there, cut the claim that merely repeats it.

Write the first line as a promise, line principle 9 in `00-line-principles.md`. The opening pulls the reader in and signals what is coming, then the piece delivers on it. No "in today's world" wind-up, no background dump before the point. A quiet, specific opening promises as well as a punchy one, as long as it is true to what follows.

For a persuasive piece, spend on the headline and sell the sizzle, persuasion rules 1 and 4 in `00-persuasion-principles.md`. The headline or subject line or opening ask carries most of the weight, so draft several and pick the one that promises, intrigues, or names the exact reader, never clever at the cost of clear. Through the body, write the benefit the storyboard recorded, not the bare feature; the reader buys what the thing does for them.

Only if the piece is one where levity belongs (a talk, a keynote, copy with personality), reach for `00-comedy-principles.md`. Humor rides on top of the draft, never at the cost of clarity, and a joke that costs the point gets cut. Most pieces skip this entirely.

Reach for the exact word, line principle 3. When a near-cousin word almost fits, find the one that says the precise degree and connotation. This is the one place the plain-and-short preference yields: precision can need the longer or rarer word. Match sentence length to content as you go, principle 10, so the rhythm is not a uniform drone; read the draft aloud in your head to hear the stumbles.

## What not to write

Do not narrate the document. No "this section covers," no "these are."

Do not explain what the reader profile said they already know.

Do not add a framing sentence before a table that the table makes obvious.

Do not solve problems that have not happened, defend exclusions the reader did not question, or tell the reader how to feel.

Do not name a person, a host, or a path the reader cannot use. Write so any reader on their own setup can follow it.

Keep the banned words out as you write; do not rely on the review stage to catch them all.

## Adversarial pass

Spawn parallel critics, each on a different failure mode:

1. **Predictability critic.** For each sentence, could the reader have predicted it before reading? Flag every sentence that carries no new information.
2. **Performance critic.** Which words are here to make the writer sound a certain way rather than to inform? Flag "kill," "leverage," "meaningfully," and every judgment the adjacent evidence already proves.
3. **Continuity critic.** Read the draft cold. Does any sentence need a fact that has not appeared yet? Flag the reread it forces.
4. **Concrete-claim critic.** Does every claim get its evidence, and does every abstract statement get made concrete? Flag the bare judgment and the abstraction with no example.
5. **Skip critic.** Which paragraphs would the reader skim if a stranger wrote them? Flag late entries, run-ups before the real claim, and post-point dawdling. Flag the opposite too: a cut so deep the reader cannot follow how one section reached the next.
6. **Iceberg critic.** Is anything on the page that the structure already conveys or that the reader does not need? Flag it for submerging. And flag the reverse: a gap that reads as a hole because the draft omitted something it never actually worked out.
7. **Show-don't-tell critic.** Find every place the draft states a conclusion the adjacent evidence already delivers, and every feeling or judgment named instead of shown. Flag the on-the-nose line for cutting, leaving the evidence to do the work.

A synthesizer merges the flags. Fix the draft, then it goes to Stage 5. The Fill critics catch problems of substance and flow; Stage 5 catches the mechanical ones.