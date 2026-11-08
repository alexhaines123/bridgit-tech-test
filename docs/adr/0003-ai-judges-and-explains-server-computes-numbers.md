# The AI judges and explains; the server computes every number

The AI never produces a figure that is charted or scored. The server computes all statistics from real EONET data using a fixed list of Measurements. For the Planetary Stress Index, Claude rates a small set of factors (such as Event volume, new-Event momentum and Category severity) on fixed, ordered rubric scales, and the server combines those ratings into the 0-100 score with a documented formula. A rule-based baseline rates the same factors, so a score still exists when the AI is unavailable. The AI also picks which Measurement is most interesting, names Notable Events, and writes the narrative. Its output is checked against a schema and against the real data (for example, every Notable Event ID must exist and every rating must be a defined level) before it is used.

A model asked to produce chart values or a "world-ending probability" will return confident, plausible numbers with no basis. Those numbers cannot be explained or reproduced when asked "why 42?", and would fail the requirement to validate AI output before using it. Constraining the AI to bounded ratings keeps its judgement in the result while the number stays bounded and explainable.

## Considered options

- **Formula only, AI explains.** Most defensible and available without the AI, but the score involves no AI judgement. This was the first decision and was revisited.
- **AI returns the score directly.** Most AI-driven but unreproducible, unexplainable and unavailable when the AI fails.
- **Formula score plus an independent AI score.** Interesting to discuss, but more UI and code.

## Consequences

- The "prediction" is framed as an illustrative score, never a forecast, and the UI says so.
- Adding a new chart means adding a Measurement to the list, not changing a prompt.
- The displayed score has a source (AI ratings or baseline) that the UI shows.
