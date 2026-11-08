# Pull Request Conventions

## Commit Structure

Structure PRs with multiple logical commits that follow the code flow, not one large commit.

## PR Description Language

Write PR descriptions using:

**1. ASD-STE100 Simplified Technical English**
- Use short, simple sentences
- Use common words (avoid jargon when possible)
- One idea per sentence
- Use active voice
- Avoid ambiguous words ("may", "might", "could")
- Example: ❌ "The implementation potentially leverages optimized algorithms" → ✅ "The code uses fast algorithms"

**2. Ubiquitous Language from GLOSSARY.md**
- Use the exact terms defined in `GLOSSARY.md`
- This repo has one glossary: `GLOSSARY.md` (root)
- Never use synonyms or alternative terms for domain concepts
- Example: Use "Event" not "incident" or "alert" (see GLOSSARY.md)
- Example: Use "Window" not "range" or "period"
- Example: Use "Category" not "type" or "kind"

### Good PR Description Example

```
## What This Does

Adds live Events from NASA's EONET API to the home page.

Users can:
- See a list of recent Events with Category, dates, and Magnitude
- Change the Window (7, 30, or 90 days) to see different Events
- Retry if the data source is temporarily unavailable

## Technical Changes

- EONET client fetches Events with 10s timeout and 2 retries
- Zod schemas validate the response at the boundary
- Shaping layer trims Event history to 10 most recent locations
- Window filter shows Events with recent activity (not first-seen date)
- UI displays Events in a list with Window selector
```

### Bad PR Description Example

```
## What This Does

This implementation leverages sophisticated error handling mechanisms to ensure robust data ingestion from external APIs. The system employs advanced validation techniques and utilizes a novel approach to temporal filtering that may improve user experience through enhanced data curation capabilities.

(Too complex, vague, uses jargon, doesn't use ubiquitous language)
```

### Commit Order

Commits should build on each other following the architecture from bottom (data) to top (presentation):

1. **Foundation** - Types, schemas, error definitions
2. **Data layer** - Clients, fetching, transformation
3. **API layer** - Endpoints, procedures, validation
4. **UI layer** - Components, pages, integration
5. **Documentation** - Architecture notes, usage guides

### Example

For a feature adding a new data source:

```
1. Add schema and domain types
2. Add error taxonomy for failures
3. Add data client with timeout/retry
4. Add transformation/shaping layer
5. Wire up API endpoint
6. Add UI components
7. Integrate into page
8. Add documentation
```

### Benefits

- **Reviewable**: Reviewers can understand each layer independently
- **Bisectable**: Easier to find bugs when commits are granular
- **Testable**: Each commit can be verified in isolation
- **Readable**: Git history tells a story of how the feature was built

### Anti-patterns

❌ **One mega-commit** with all changes
❌ **Random file order** that jumps between layers
❌ **Mixed concerns** in a single commit (e.g., UI + API + types)

### Tools

Use `git reset --soft HEAD~1` to uncommit, then recommit in logical chunks.

Use `git push --force-with-lease` to update PRs after restructuring commits.
