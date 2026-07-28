```markdown
# Hooklabs Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development practices and conventions used in the Hooklabs TypeScript codebase. You'll learn about file naming, import/export styles, commit patterns, and how to write and organize tests. While no explicit frameworks or automated workflows were detected, this guide will help you contribute code that matches the project's established style.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `userProfile.ts`, `dataFetcher.test.ts`

### Import Style
- Use **relative imports** for referencing modules within the project.
  - Example:
    ```typescript
    import { fetchData } from './dataFetcher';
    ```

### Export Style
- Use **named exports** rather than default exports.
  - Example:
    ```typescript
    // In userProfile.ts
    export function getUserProfile(id: string) { ... }

    // In another file
    import { getUserProfile } from './userProfile';
    ```

### Commit Patterns
- Commit messages are **freeform** and do not follow a strict prefix convention.
- Average commit message length: **63 characters**.

## Workflows

### Adding a New Module
**Trigger:** When you need to add new functionality to the codebase.
**Command:** `/add-module`

1. Create a new file using camelCase naming (e.g., `newFeature.ts`).
2. Write your TypeScript code, using named exports.
3. Use relative imports to include dependencies from other modules.
4. Add corresponding test files as `newFeature.test.ts`.
5. Commit your changes with a clear, descriptive message.

### Writing and Running Tests
**Trigger:** When you need to verify the correctness of your code.
**Command:** `/run-tests`

1. Create test files with the pattern `*.test.ts` (e.g., `dataFetcher.test.ts`).
2. Write your tests using the project's preferred (but unspecified) testing framework.
3. Run the tests using the project's test runner (framework not specified; check project documentation or `package.json` for details).
4. Ensure all tests pass before committing.

## Testing Patterns

- Test files follow the `*.test.ts` naming convention and are located alongside the modules they test.
- The specific testing framework is **unknown**; refer to project documentation or `package.json` for more information.
- Example test file:
  ```typescript
  // dataFetcher.test.ts
  import { fetchData } from './dataFetcher';

  describe('fetchData', () => {
    it('should return expected data', () => {
      // test implementation
    });
  });
  ```

## Commands
| Command        | Purpose                                      |
|----------------|----------------------------------------------|
| /add-module    | Scaffold and add a new TypeScript module     |
| /run-tests     | Run all test files in the project            |
```
