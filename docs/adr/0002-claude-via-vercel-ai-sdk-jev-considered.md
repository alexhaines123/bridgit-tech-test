# Claude through the Vercel AI SDK; Jev considered and not used

All AI calls go to Claude, the model supplied for the exercise, through the Vercel AI SDK with Zod-validated structured output. The model ID comes from an environment variable so a faster or larger model can be swapped in without code changes.

## Considered options

**Jev (TypeSafe AI), a "decision model"** that returns typed probabilities instead of text. It would suit two of our jobs well: choosing which Measurement is most interesting (a Choice question) and rating overall stress (a Score question). We did not use it because:

- the brief asks for the provided model, and reviewers would need their own TypeSafe key to run the app;
- Jev cannot write text, so Claude would still be needed for the Briefing, giving two providers and two failure modes inside a 3-4 hour build;
- its accuracy figures are self-reported and it is not fully deterministic.

Because calls sit behind one AI service module, a Jev (or any other provider) adapter for the decision steps is the first thing to try with more time. The AI SDK's provider abstraction keeps that change small.
