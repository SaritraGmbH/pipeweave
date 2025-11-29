# Contributing to PipeWeave

Thank you for your interest in contributing to PipeWeave! This guide will help you understand our development workflow and release process.

## Development Setup

### Prerequisites

- Node.js >= 18
- pnpm >= 8.0.0
- PostgreSQL 15+ (for testing)
- Git

### Getting Started

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/pipeweave.git
cd pipeweave
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Build all packages**

```bash
pnpm run build:packages
```

4. **Run tests**

```bash
pnpm test
```

## Project Structure

PipeWeave is a monorepo with the following packages:

```
pipeweave/
├── packages/
│   ├── shared/          # Shared types and utilities
│   ├── orchestrator/    # Task execution engine
│   ├── cli/            # Command line interface
│   └── ui/             # Web monitoring dashboard
├── sdks/
│   └── nodejs/         # Node.js SDK for workers
└── examples/           # Example implementations
```

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/my-new-feature
# or
git checkout -b fix/bug-description
```

### 2. Make Your Changes

- Write code following our style guide
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass: `pnpm test`
- Ensure type checking passes: `pnpm typecheck`
- Lint your code: `pnpm lint:fix`

### 3. Create a Changeset

**This is important!** We use [Changesets](https://github.com/changesets/changesets) to manage versions and changelogs.

After making your changes, run:

```bash
pnpm changeset
```

You'll be prompted with:

**Which packages changed?**
- Use spacebar to select affected packages
- Example: If you modified the CLI, select `@pipeweave/cli`

**What type of change?**
- `patch` (0.1.0 → 0.1.1) - Bug fixes, documentation, minor updates
- `minor` (0.1.0 → 0.2.0) - New features, backward compatible changes
- `major` (0.1.0 → 1.0.0) - Breaking changes

**Summary**
- Describe what changed (this goes into the CHANGELOG)
- Be descriptive but concise
- Example: "Add support for custom retry strategies"

This creates a file in `.changeset/` like `.changeset/green-dogs-smile.md`:

```md
---
"@pipeweave/cli": patch
---

Updated README with installation instructions
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add custom retry strategies"
git push origin feature/my-new-feature
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

Examples:
```
feat: add timeout support to task execution
fix: resolve memory leak in worker registration
docs: update README with deployment examples
refactor: simplify orchestrator initialization
```

### 5. Create a Pull Request

- Go to GitHub and create a pull request from your fork
- Fill out the PR template with relevant information
- Link any related issues
- Wait for review and address feedback

## Release Process

### How Releases Work

PipeWeave uses an automated release workflow powered by Changesets and GitHub Actions:

1. **Developer creates changeset** when making changes
2. **GitHub Action detects changeset** on push to `main`
3. **Action creates/updates "Version Packages" PR**
4. **Maintainer reviews and merges PR**
5. **Packages automatically publish to npm** ✨

### The Workflow in Detail

#### Step 1: Changesets Accumulate

As PRs with changesets get merged to `main`, they accumulate in the `.changeset/` directory.

#### Step 2: Version Packages PR

The GitHub Action (`.github/workflows/release.yml`) automatically:
- Detects changesets
- Calculates new version numbers based on change types
- Creates/updates a PR titled **"chore: version packages"**

This PR contains:
- Updated `package.json` versions
- Updated `CHANGELOG.md` files
- Removed changeset files

#### Step 3: Review & Merge

A maintainer reviews the "Version Packages" PR to ensure:
- Version bumps are appropriate
- Changelog entries are accurate
- All linked packages are in sync

When satisfied, they merge the PR.

#### Step 4: Automatic Publication

Once the PR is merged:
- GitHub Action detects the version change
- Builds all packages (`pnpm run build:packages`)
- Publishes to npm (`changeset publish`)
- npm packages are now live!

### Linked Packages

PipeWeave uses linked versioning, meaning all core packages share the same version:

```json
{
  "linked": [
    ["@pipeweave/shared", "@pipeweave/sdk", "@pipeweave/orchestrator", "@pipeweave/cli"]
  ]
}
```

**What this means:**
- Bumping any package bumps all of them
- Keeps the ecosystem in sync
- Simplifies dependency management

### Version Bump Guidelines

**Patch (0.1.0 → 0.1.1)**
- Bug fixes
- Documentation updates
- Internal refactoring
- Performance improvements (non-breaking)

**Minor (0.1.0 → 0.2.0)**
- New features
- New API methods (backward compatible)
- Deprecations (with warnings)
- Dependency updates (non-breaking)

**Major (0.1.0 → 1.0.0)**
- Breaking API changes
- Removed deprecated features
- Changed behavior of existing features
- Major architectural changes

### Examples

#### Example 1: Documentation Update

```bash
# 1. Update README
vim packages/cli/README.md

# 2. Create changeset
pnpm changeset
# Select: @pipeweave/cli
# Type: patch
# Summary: "Improve installation documentation"

# 3. Commit and push
git add .
git commit -m "docs: improve CLI installation guide"
git push

# 4. Create PR, get it merged
# 5. Maintainer merges "Version Packages" PR
# 6. Auto-publish to npm!
```

#### Example 2: New Feature

```bash
# 1. Add feature
vim sdks/nodejs/src/worker.ts
vim sdks/nodejs/src/worker.test.ts

# 2. Create changeset
pnpm changeset
# Select: @pipeweave/sdk
# Type: minor
# Summary: "Add support for custom task timeouts"

# 3. Commit and push
git add .
git commit -m "feat: add custom task timeout support"
git push

# 4. PR → merge → version PR → publish
```

#### Example 3: Breaking Change

```bash
# 1. Make breaking change
vim packages/shared/src/types.ts

# 2. Create changeset
pnpm changeset
# Select: @pipeweave/shared
# Type: major
# Summary: "BREAKING: Rename TaskContext to ExecutionContext"

# 3. Include migration guide in changeset
# Edit .changeset/[generated-name].md to add details

# 4. Commit, PR, review carefully
# This will bump to 1.0.0!
```

## Development Guidelines

### Code Style

- We use **Prettier** for formatting
- We use **ESLint** for linting
- Run `pnpm format` before committing
- Run `pnpm lint:fix` to auto-fix issues

### Testing

- Write tests for new features
- Maintain or improve test coverage
- Run `pnpm test` before submitting PR
- Run `pnpm test:coverage` to check coverage

### TypeScript

- Use TypeScript for all code
- Avoid `any` types when possible
- Export types from `@pipeweave/shared` when shared across packages
- Run `pnpm typecheck` to verify types

### Documentation

- Update relevant documentation when adding features
- Add JSDoc comments to public APIs
- Include examples in documentation
- Update README files as needed

## Getting Help

- **Questions?** Open a [GitHub Discussion](https://github.com/SaritraGmbH/pipeweave/discussions)
- **Bug reports?** Open a [GitHub Issue](https://github.com/SaritraGmbH/pipeweave/issues)
- **Security issues?** Email security@saritra.com

## Quick Reference

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build:packages

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint
pnpm lint:fix

# Format code
pnpm format

# Create a changeset
pnpm changeset

# Preview version bumps (local only)
pnpm version-packages
```

## License

By contributing to PipeWeave, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to PipeWeave! 🎉
