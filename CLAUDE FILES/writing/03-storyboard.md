# Stage 3: Storyboard

Turn the skeleton into a per-section plan. Each section gets one job and the evidence it carries. Still no prose. This is where you decide what each section will say before you worry about how it reads.

Needs the reader profile (Stage 1) and the skeleton (Stage 2). Owns principles 3, 4, 6, and 7 in `00-craft-principles.md`: causality over sequence, the emotional or conviction arc, movable cards, and planting that pays off.

## What to produce

For each section in the skeleton:

| Field | What it captures |
|-------|------------------|
| Belief in | What the reader believes when they reach this section. |
| Belief out | What they believe when they leave it. The section's whole job is to move them from one to the other. |
| Evidence | The specific facts, numbers, or links the section uses to make that move. Real values, not placeholders. |
| Carries forward | Anything a later section will depend on, named here so it is introduced in the right place. |

## How to do it

State each section as a belief transition. If you cannot say what the reader believes coming in and going out, the section has no job and should fold into another.

List real evidence, not categories. "Show the cost numbers" is a placeholder. "Agile P50 4.843, Nemo P50 4.995, difference 0.152" is evidence. If you do not have the number yet, the storyboard's job is to flag that you need it before drafting.

Tie evidence to the next action it enables. Data sources earn their place by feeding a step. A number earns its place by supporting the belief-out. If a fact supports no transition, it does not go in the storyboard.

Link the sections with "therefore" or "but," not "and then," principle 3. Each section's belief-in should follow from the section before it because of what that section established, not just after it in order. If the only link is sequence, the reader asks "and then?" instead of "why?", and the structure is weaker for it.

Sketch the arc, principle 4. Walk the sections and mark where the reader's tension or conviction rises and falls. A flat run of sections at one level is dead weight to cut or charge. Put the low point before the turn, and land the end somewhere different from the start.

Use the "carries forward" field to plant and pay off, principle 7. Every conspicuous detail names where it pays off later; every later payoff names where it was planted here. A plant with no payoff gets cut or paid; a payoff with no plant gets seeded in an earlier section now, while the storyboard can still move things.

Treat the storyboard as movable cards, principle 6. If a section is hard to plan in place, plan the one you can see and let the gap reveal what the unplanned section is for.

Give each section a want and name its obstacle, screen principles 2 and 3 in `00-screen-principles.md`. The want is the belief-out: what this section is trying to get the reader to believe. The obstacle is the reader's resistance to believing it: their doubt, their prior, the objection they bring. A section with a want and no obstacle is a section everyone already agrees with, so it carries no tension and can compress. Name the resistance each section overcomes.

Ask "why now" of every section, screen principle 5. A section needs a reason to sit where it does, not just a reason to exist. If it could move anywhere without loss, its placement is arbitrary, which is the same drift the causality check catches from the other side.

For a persuasive piece, two more from `00-persuasion-principles.md`. State each section's payoff as a benefit, not a feature, persuasion rule 4: not what the thing is, but what it gets the reader, and the benefit behind that benefit. The storyboard records the benefit so the draft does not stop at the spec. And name the proof for every claim, persuasion rule 9: each belief-out lists the specific evidence that earns it, and a claim whose proof cannot back it gets softened to what the proof supports, because a claim that outruns its proof reads as a lie.

State the limits and open questions as their own beliefs to land, not as things to smooth over. If the reader should leave knowing the absolute numbers depend on an unconfirmed assumption, that is a belief-out, and the section plans for it.

Decide the simplest correct form now. If a result can be shown two equivalent ways, pick the one the reader can recompute from what is already on the page. The storyboard records which form, so the Fill stage does not reintroduce complexity.

## Adversarial pass

Spawn parallel critics, each on a different failure mode:

1. **No-job critic.** For each section, are belief-in and belief-out actually different? If they are the same, the section does nothing. Flag it.
2. **Placeholder-evidence critic.** Is the evidence real and specific, or a category standing in for facts? Flag every "show the data" that should be a number.
3. **Orphan-evidence critic.** Does every piece of evidence support a belief transition? Flag any fact that supports no move; it is decoration.
4. **Continuity critic.** Does any section's belief-in assume something no earlier section established? Walk the chain and flag the break.
5. **Causality critic.** Link each section to the one before with "therefore" or "but." Flag every join where only "and then" fits, since sequence is a weaker bind than cause.
6. **Arc critic.** Trace the rise and fall of tension or conviction across the sections. Flag a flat run that holds one level too long, and flag an ending that lands at the same height it started unless flatness is the point.
7. **Plant-and-payoff critic.** Check that every plant in "carries forward" has a payoff downstream and every payoff has a plant upstream. Flag the dangling plant and the unplanted payoff.
8. **Want-and-obstacle critic.** For each section, name what it wants the reader to believe and the resistance it overcomes. Flag a section whose point the reader already grants, since it has no obstacle and can compress or merge.
9. **Honesty critic.** Are the known limits from the profile landing somewhere as a belief-out, or did they vanish between Stage 1 and here? Flag the omission.

A synthesizer merges the flags. Fix the storyboard here. A storyboard that survives these critics is a sentence-by-sentence spec the Fill stage executes.