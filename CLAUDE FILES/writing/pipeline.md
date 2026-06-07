# Writing Pipeline

Five stages turn a request into a tight piece of communication. The piece can be a high-level design doc, a methodology writeup, a Slack message, marketing copy, a teaching seminar, a knowledge-transfer session, an email, a proposal. The principles are the same across all of them; the format changes the size and the words, not the rules. Each stage ends with parallel adversarial critics that try to break its output before it moves on. Run them in order. A later stage assumes the earlier one passed its critics.

| Stage | File | Turns this into that |
|-------|------|----------------------|
| 1. Intake | `01-intake.md` | A raw request into an audience profile: who receives this, what they know, what they need, the start and end state. |
| 2. Template | `02-template.md` | The audience profile into a skeleton fit to the format. |
| 3. Storyboard | `03-storyboard.md` | The skeleton into a per-part plan: the one job each part does and the evidence it carries. |
| 4. Fill | `04-fill.md` | The storyboard into a draft, following the voice rules. |
| 5. Review | `05-review.md` | The draft into a final, by running every check and cutting what fails. |

`00-voice-reference.md` holds the voice, the banned words, the counts, and the example bank. Stages 4 and 5 both read it.

`00-craft-principles.md` holds ten rules for planning and structure. Each stage names the principles it owns and checks against them.

`00-comedy-principles.md` holds ten rules for humor, a specialist opt-in lens. Pull it in only when levity is part of the job: a talk that wants to land lighter, copy with personality, a keynote, a lightly humorous post. Most pieces should not touch it; a methodology doc, an HLD, a postmortem, or a Slack ask lose trust when they reach for jokes. When humor does belong, it rides on top of the other rules and never at the cost of clarity. Drafting (Stage 4) is the only stage that uses it.

`00-persuasion-principles.md` holds ten rules from direct-response copywriting, the persuasion-to-action lens. It applies when the piece has to hook an audience and move them to do one thing: marketing copy, a landing page, a cold email, a pitch, a Slack ask, a proposal that needs a yes. It applies least to reference material and to a captive audience who will read regardless. Its one structural contribution is a layer before the writing, handled in Stage 1: whether the audience already wants the outcome and where their belief already sits. Its header maps which rules add to the other sets and which restate them. When the piece only needs to inform, skip this set; when it needs a yes, pull it in.

`00-line-principles.md` holds ten rules for the sentence and the word, the line-edit lens. Stages 4 and 5 read it. Much of it the voice reference already enforces; its added value is the "when it flips" clause on each rule, which says when the rule yields, and the rule above the rules: when any rule fights clarity, clarity wins. A critic that flags a deliberate, clarity-serving rule-break is wrong.

`00-screen-principles.md` holds ten rules from screenwriting, the narrative and persuasion lens. They apply most to a piece the reader experiences in order and should feel the shape of: a talk, a narrative six-pager, a PR/FAQ, a launch story, a retrospective. They apply least to a reference doc someone greps for one fact. Its header maps which rules add something the planning set does not, so the stages do not check the same thing twice. When the piece is reference material, lean on the planning set and the voice reference; when it is meant to move a reader, pull in the screen set too.

## Reading the stages for your format

The stage files say "document," "section," "reader," and "page" because that is the common case. Read those words for your format. The rules do not change; the vocabulary does.

| Stage word | Slack or email | Seminar or KT session | Copy or marketing | Design or methodology doc |
|------------|----------------|------------------------|-------------------|---------------------------|
| reader | the recipient | the room | the prospect | the reviewer |
| section | a paragraph or a line | a segment of the talk | a line or a panel | a section |
| page | the message | the session | the asset | the doc |
| read in order | skim in a feed | sit through live | glance at | read top to bottom |

A few format truths the stages assume but do not always say. A live audience can interrupt and ask, so a seminar or KT session plans for branches and questions, not just a fixed order. Copy is glanced at, so the "make me care" and "enter late" rules bite hardest there. A Slack message is read in two seconds, so its whole structure is often one sentence that states the ask and one that gives the reason.

## Before Stage 1: architect or gardener

Read principle 1 in `00-craft-principles.md` and ask which mode fits this piece and this writer. An architect runs the stages strictly in order, locking each before the next. A gardener may draft the hot section first and backfill the structure, then still run the stages to check it. Most work is hybrid: architect the load-bearing parts (the ending, the argument's logic) and garden the rest. State the mode before starting, since it changes how strictly the order binds.

## How to run

Default: run all five in order, each with its critics, passing the artifact forward. Tell the user the stage you are on and what its critics flagged before moving on.

When the user wants one stage only (for example "just review this draft"), jump to that stage. It will tell you which earlier artifacts it needs.

## The adversarial pass

Every stage spawns 2 to 4 parallel critic agents on its own output, each attacking from a different angle the stage names. A synthesizer merges their findings. If the critics agree the output fails, the stage re-runs with their notes before moving on. The point is to catch a weak reader-analysis in Stage 1 rather than at the end, when it is expensive to fix.

Critics judge against the stage's own checklist and `00-voice-reference.md`. They do not rewrite; they find what is wrong and say why, citing the specific sentence or gap.
