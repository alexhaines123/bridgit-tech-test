# Pull Request Conventions

## Commit Structure

Structure PRs with multiple logical commits that follow the code flow, not one large commit.

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
