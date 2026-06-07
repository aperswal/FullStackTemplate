# Voice Reference

Shared across the Fill and Review stages. The drafting stage writes to this; the review stage checks against it.

## The one test

Every sentence either lowers the reader's uncertainty about the world or it gets cut. A sentence that exists to sound smart, sound thorough, or restate what the structure already showed carries no information. Before keeping a sentence, ask three things. Did this lower the reader's uncertainty? Could the reader have predicted it before reading? Is this here for the reader or for me? Fails all three, cut it. Fails two, rewrite it. Fails one, weigh whether the one job is worth the space.

## Voice

Write how people talk. Contractions are default. "Devs" not "developers." "Docs" not "documentation." When a formal word and a casual word mean the same thing, the casual word wins because it is closer to how the reader already thinks. A softener like "though" at the end of a sentence is tone, and tone is information.

Do not perform. Test every word against one question: is it here because it changes what the reader understands, or because it makes the writer sound a certain way. "Kill" performs decisiveness. "Meaningfully" performs precision. "Leverage" performs strategy. Replace each with the plainest word that carries the meaning, or cut it.

Trust the reader. Do not explain why a cycle repeats. Do not list five hypothetical scenarios when "we don't know" is honest. Do not tell the reader how to feel about what they just read. Do not use bold or formatting to organize attention that sentence structure should organize.

Be honest about uncertainty and power. If you are asking for something, say you are asking. If something has no name, do not name it. If you do not know, say so. If the data has limits, state them.

A document is a transformation from a start state (reader doesn't understand) to an end state (reader can act). Every sentence moves the reader toward the end state or gets cut.

## Punctuation and characters

No em dashes anywhere. No colons inside sentences; colons only introduce something after, like a label before content or a header before a list. No dashes as mid-sentence punctuation. No horizontal rules between sections. No code blocks for non-code content; structured information goes in tables.

## Prose style

Conversational prose. Future tense where natural: "they will get finalized," not "they get finalized." No meta narration. Do not write about the document from inside the document. Never open a sentence with "this section defines" or "these are" to describe the doc's own structure.

## Banned words and phrases

Filler: basically, literally, you know, I mean, just, actually, honestly, obviously, clearly, right.

Hedges: kind of, sort of, a little bit, maybe, I think, I feel like, I guess, perhaps, somewhat, slightly.

Apologetic preambles: sorry but, this might be wrong but, I'm no expert but, I'm not sure if this is right but.

Empty intensifiers: very, really, extremely, incredibly, absolutely, totally, completely, truly, highly, utterly.

Redundant pairs: absolutely essential, completely finished, very unique, end result, free gift, past history, future plans, each and every, first and foremost.

Inflated vocabulary, use the plain version:

| Inflated | Plain |
|----------|-------|
| utilize | use |
| facilitate | help |
| ascertain | find out |
| optimize | improve or best |
| leverage | use |
| endeavor | try |
| commence | start |
| terminate | end |
| regarding | about |
| subsequent | next |
| prior to | before |
| in the event that | if |
| in the near future | soon |
| with the exception of | except |
| due to the fact that | because |
| in spite of the fact that | although |
| for the purpose of | to |
| has the ability to | can |
| make a decision | decide |
| conduct an investigation | investigate |
| take into consideration | consider |
| reach a conclusion | conclude |
| provide assistance | help |
| make a recommendation | recommend |

Wordy phrases: "in order to" becomes "to"; "the reason being is" becomes "because"; delete "it should be noted that," "it is worth mentioning that," "needless to say," "as a matter of fact," "at the end of the day," "the bottom line is."

Credibility killers: does that make sense?, if that makes sense, right?, yeah?

Weasel attribution: some people say, studies show, experts agree, research suggests (with no specific citation).

Over-self-attribution: I believe that, in my opinion, personally I think, from my perspective.

Weak closers: so yeah, anyway, and stuff like that, and whatnot, etc etc, you get the idea.

Adverbs: flag any "-ly" word except only, early, likely, family, apply, reply, July, supply, daily, weekly, monthly.

## Structural patterns to flag

Passive voice: any form of "to be" followed by a past participle. Not always wrong, but surface every one.

Throat-clearing openers: "it's important to note that," "the fact of the matter is," "it goes without saying," "let me start by saying."

Weak existence starters: sentence-initial "there is," "there are," "there was," "there will be."

Front-loaded negatives: sentence-initial "I'm not sure," "I don't know if," "I can't say for certain."

Comma-but: any sentence with a comma followed by "but." Surface for review.

## Counts and measurements

| Measure | Flag when |
|---------|-----------|
| Sentence length | over 30 words |
| Commas per sentence | more than 2 |
| Reading grade (Flesch-Kincaid) | above 6th grade |
| Average words per sentence | above 22 across the piece |
| Sentence-length standard deviation | below 4 words (monotone) |
| Consecutive same-length sentences | 3 or more within 3 words of each other |
| Paragraph length | over 5 sentences or 100 words |
| Wall of text | 200+ words with no break |
| Adverb density | above 3 "-ly" per 100 words |
| Passive voice | above 15-20% of sentences |
| Sentence-initial repetition | 3+ sentences starting with the same word |

## Good examples, and why each works

"For our team today, ASBI shows 80% adoption, the real number is higher though." States a precise floor and admits the gap in four casual words. The reader learns we know something but not everything.

"We don't know what they're using the tools for. We don't know what's getting in their way. And we don't know why some pick one tool over another." Three unknowns as three sentences, each a different dimension. The repetition pulls the reader forward.

"Without this data, any recommendation we make will be a guess." Gives the stakes in one sentence. "Guess" does the emotional work without performing.

"We expect this number to fluctuate. As devs replace tasks with AI, move to harder work, and replace tasks again, it will rise and fall." First sentence names the concept, second explains the mechanism. The extra words make the abstract concrete, so they earn their place.

"Our north star is developer hours saved per week." Names the target, no buildup. The reader now has a frame for everything that follows.

"The GenAI Adoption Insights tool tracks AI tool adoption. It refreshes daily and covers Q, Kiro, Cline, and a few other agents." Two sentences build a working mental model. Each adds something the last did not.

## Bad examples, and why each fails

"We're not starting from scratch." Tells the reader how to feel about information they have not seen. Redundant if the next paragraph proves it, a bandaid if it does not.

"In today's rapidly evolving business landscape, AI tools have become increasingly important." Every word was predictable before reading. Zero bits. It warms up the writer, not the reader.

"If something doesn't get adopted, we kill it and try the next thing." "Kill" performs decisiveness, and the line floats with no connection to what surrounds it. Posture, not information.

"This gives us our first real picture of where AI helps." "First real picture" performs significance. Tie it to the next action instead: "this tells us which tools to shortlist."

"We recommend a 15% increase based on competitive analysis, margin needs, and willingness-to-pay research." Three concepts at once, none established. A conclusion disguised as an explanation.

"The exact metrics deserve their own discussion since they get into questions that don't belong in this doc." Defends an exclusion the reader never questioned. If it is not here, it is not here.

"Customer satisfaction has declined in several key areas." "Several key areas" signals that information exists without transmitting it. Name the areas or drop the sentence.

"Adoption is strong across the board. Every sub-org exceeds 92%." The first sentence is a judgment, the second is the evidence. The judgment is redundant when the evidence is right there.