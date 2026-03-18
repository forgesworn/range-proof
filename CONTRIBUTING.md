# Contributing

## Setup

```bash
git clone https://github.com/forgesworn/secp256k1-range-proof.git
cd secp256k1-range-proof
npm install
npm test
```

## Development Commands

```bash
npm run build       # Compile TypeScript to dist/
npm test            # Run tests (vitest)
npm run typecheck   # Type-check without emitting (tsc --noEmit)
```

All three must pass before opening a pull request.

## Branch Strategy

This repository uses **semantic-release on main** — every `feat:` or `fix:` commit pushed to main automatically publishes a new npm version.

- **Always work on a branch**, never commit directly to main.
- Merge or squash to main only when a logical chunk of work is complete.
- This produces one clean release instead of many incremental versions.

## Commit Conventions

Commit messages follow the `type: description` format:

- `feat:` — new feature (triggers a minor version bump)
- `fix:` — bug fix (triggers a patch version bump)
- `chore:` — maintenance, CI, tooling (no release)
- `refactor:` — code restructuring with no behaviour change (no release)
- `docs:` — documentation only (no release)
- `test:` — test additions or changes (no release)

Use British English in commit messages and code comments.

## Crypto Review

Pull requests that touch proof logic (`range-proof.ts`, `utils.ts`) require careful review:

- **Fiat-Shamir domain separators** must not change — this would break all existing proofs.
- **Generator point derivation** (`createGeneratorH`) must not change — the nothing-up-my-sleeve property is critical for security.
- **Constant-time operations** — scalar comparisons must use `scalarEqual()`, not direct bigint equality.
- **Blinding factor exposure** — ensure blinding factors never leak into proof objects or logs.
- **Deserialisation validation** — all hex inputs must be validated for length and format before parsing.

If your PR modifies any cryptographic logic, please describe the security implications in the PR description.

## Code Style

- ESM-only — use `.js` extensions in all imports.
- British English in comments and error messages.
- All EC operations go through `@noble/curves` — no custom point arithmetic.
