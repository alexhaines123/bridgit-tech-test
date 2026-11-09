# Planetary Stress Index deferred; the Briefing is one chart summary

Three tickets made up the AI phase: the Planetary Stress Index (#18), the Briefing (#20) and the AI-chosen Measurement (#21). #20 was blocked by #18 for one reason only — it was going to carry the AI's factor ratings into #18's formula. We decided to park the Stress Index and reduce the Briefing to a single plain-English paragraph that reads the chart's Measurement, so the AI phase becomes two tickets over one call: #20 writes the summary, #21 adds the choice of Measurement with its caption and reason.

ADR 0003 still governs: the AI judges and explains, the server computes every number. Only its Stress Index paragraphs are dormant — no factor rubrics, no combining formula, no rule-based baseline, no 0-100 score, no gauge.

## Considered options

- **Build #18 first as planned.** Keeps the design intact, but it is the largest of the three tickets (rubrics, weights, formula, baseline, gauge UI, tests) and it would have absorbed the remaining budget before a single AI call existed.
- **Cut the Stress Index permanently.** Simplest, and the app would still be complete. Rejected because the factors, the formula and the gauge are already designed and the score is the part of the brief reviewers ask about; parking it keeps the work resumable instead of thrown away.
- **Merge #20 and #21 into one ticket.** One call, one review — but one large ticket with two different failure surfaces, against the working agreement of one reviewable phase at a time.
- **Reduce #20 to a chart summary and park #18 behind it** (chosen). Unblocks the AI phase immediately, keeps one call, and keeps both remaining tickets small enough to review.

## Consequences

- #18 is parked behind #20 rather than sitting unblocked: its AI factor ratings become extra fields on the call #20 builds, so it can only resume once that call exists. Its body now owns those ratings instead of pointing at #20.
- The Briefing loses its headline, its three key points and its Notable Events. **Notable Event** stays in `GLOSSARY.md` marked deferred, because no current ticket delivers it.
- The summary is written from all five Measurements' server-computed data rather than a trimmed Event list. That is what lets #21 add the choice to the same call with no payload change: the AI can only pick a Measurement it has numbers for.
- The payload carries no Event titles or descriptions, so the prompt-injection surface shrinks to EONET Category and Region names. Text from the payload is still treated as data, not instructions.
- The Briefing card in the sidebar keeps its place; the gauge beside it does not ship. `docs/design/design-direction.md` and the `psi.*` rows in `theme-tokens.md` are annotated as deferred, and the mockup images are left untouched as the frozen record of what was approved.
- When #18 resumes, nothing in ADR 0003 needs rewriting: the rubrics, the weights, the baseline fallback and the "illustrative, not a forecast" framing all come back as designed.
