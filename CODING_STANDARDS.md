# Coding Standards

Rules the reviewer enforces during code review. Mechanical violations should be caught here, not during implementation.

## Zod schemas validate only what is used

A Zod schema at an external boundary (API response, database row, etc.) should validate only the properties that are actually consumed downstream in the application.

**Do not validate "just in case"**. If a field is not used in the shaping layer, business logic, or UI, it should not be in the schema. YAGNI.

**Rationale**:
- Validating unused fields wastes CPU/memory parsing data we discard
- The schema becomes harder to understand when it includes fields we don't care about
- We couple to upstream structure for properties we don't need, increasing brittleness

**During review**: trace each field in the schema through the codebase. If it's not referenced in the shaping layer, types, or UI, remove it. If there's a specific reason to keep it (e.g., type safety for a future feature with a concrete timeline), document that reason in a comment on the schema field.
