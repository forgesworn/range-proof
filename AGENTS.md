# AGENTS.md — @forgesworn/range-proof

Instructions for AI coding agents working in this repository.

## What This Library Does

Pedersen commitment range proofs on secp256k1. Proves a secret value lies within a public range `[min, max]` without revealing the value. Built on CDS OR-composition bit proofs with Fiat-Shamir domain separation. Pure TypeScript, ESM-only, browser-compatible.

Runtime dependencies: `@noble/curves`, `@noble/hashes` only.

## Build & Test

```bash
npm install
npm run build       # tsc — compiles to dist/
npm test            # vitest run (55 tests, ~10s)
npm run typecheck   # tsc --noEmit
```

All three must pass before committing.

## Architecture

```
src/
  index.ts        — Public re-exports (types + functions)
  range-proof.ts  — Main API: Pedersen commitments, CDS OR-composition bit proofs,
                    sum-binding / commitment-binding Schnorr proofs, range proof
                    creation and verification, age range helpers, serialisation
  utils.ts        — Crypto primitives: secp256k1 point arithmetic, scalar ops,
                    constant-time comparison, generator points (G, H), hashToScalar
  errors.ts       — Error hierarchy: RangeProofError > ValidationError, CryptoError
```

## Public API

- `createRangeProof(value, min, max, bindingContext?)` — prove value is in [min, max]
- `verifyRangeProof(proof, expectedMin, expectedMax, expectedBindingContext?)` — verify
- `createAgeRangeProof(age, ageRange, subjectPubkey?)` — convenience for age policies ("18+", "8-12")
- `verifyAgeRangeProof(proof, expectedAgeRange, expectedSubjectPubkey?)` — verify age proof
- `commit(value, blinding?)` — create a Pedersen commitment
- `verifyCommitment(commitment, value, blinding)` — open and verify
- `serializeRangeProof(proof)` / `deserializeRangeProof(json)` — JSON round-trip

## Crypto Safety Rules

- **Do not modify Fiat-Shamir domain separators** (`pedersen-bit-proof-v1`, `pedersen-sum-binding-v1`, `pedersen-commitment-binding-v1`). Changing these breaks all existing proofs.
- **Do not expose blinding factors.** The `blinding` field in `PedersenCommitment` must never appear in range proofs or be transmitted to verifiers.
- **Use @noble/curves for all EC operations.** Do not implement custom point arithmetic.
- **Generator H must remain nothing-up-my-sleeve.** The seed `'secp256k1-pedersen-H-v1'` and derivation in `createGeneratorH()` must not change.
- **Constant-time scalar comparison** via `scalarEqual()` — do not replace with `===` on bigints.
- **Deserialisation validates all inputs** — compressed point format, scalar hex length, array bounds. Do not weaken these checks.

## Conventions

- **British English** in comments, docs, and error messages.
- **ESM-only** — all imports use `.js` extensions.
- **Commit messages:** `type: description` format (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`).
- **Semantic-release on main** — work on branches, merge to main only when complete.
