---
applyTo: "**"
---
# Pull Request Title and Description Generation Guidelines

## PR Title Guidelines

- Keep titles concise (under 72 characters) but descriptive
- Start with a verb in the present tense (e.g., "Add", "Fix", "Update", "Remove")
- Include the component or area affected (e.g., "Add codebase pagination to frontend", "Fix authentication flow in server")
- For bug fixes, include "fix:" prefix
- For features, include "feat:" prefix
- For documentation changes, include "docs:" prefix
- For refactoring, include "refactor:" prefix
- For performance improvements, include "perf:" prefix
- For tests, include "test:" prefix
- For chores, include "chore:" prefix

## PR Description Guidelines

### Structure

- Begin with a clear summary of the changes
- Use markdown formatting for better readability
- Include the following sections defined in [PR Template](../PULL_REQUEST_TEMPLATE.md)

### Language and Style

- Use clear, concise language
- Avoid technical jargon when possible
- Write in the present tense
- Use bullet points for lists
- Use code blocks for code snippets with language specification for syntax highlighting
- Link to relevant documentation when necessary

### PR Size Guidelines

- Focus on a single logical change
- Suggest breaking down PRs with more than 500 lines of changes
- Consider separating refactoring commits from functional changes

### KRCI Portal Specific Guidelines

- Mention if changes affect frontend, backend, or shared packages
- Include browser testing information for frontend changes
- Mention Kubernetes version compatibility for deployment changes
- Reference KubeRocketCI integration impacts when applicable

### Example PR Description Format

```markdown
This PR introduces a new feature that allows users to paginate through codebases in the KRCI Portal frontend.

Fixes #(333)

## Type of change

Please delete options that are not relevant.

- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] This change requires a documentation update

## How Has This Been Tested?

Unit tests were added to cover the new pagination feature. Manual testing was performed in Chrome and Firefox.

- [x] Unit tests
- [x] Integration tests
- [x] Manual testing

**Test Configuration**:
* Node.js version: 18.17.0
* pnpm version: 8.6.0
* Browser: Chrome 120.0.6099.109
* Kubernetes version: 1.28

## Checklist:

- [x] My code follows the style guidelines of this project
- [x] I have performed a self-review of my own code
- [x] I have commented my code, particularly in hard-to-understand areas
- [x] I have made corresponding changes to the documentation
- [x] My changes generate no new warnings
- [x] I have added tests that prove my fix is effective or that my feature works
- [x] New and existing unit tests pass locally with my changes
- [x] Any dependent changes have been merged and published in downstream modules
- [x] I have squashed my commits
- [x] I have run `pnpm lint` and fixed any issues
- [x] I have run `pnpm format:check` and code is properly formatted
- [x] I have run `pnpm test:coverage` and maintained adequate test coverage
```
