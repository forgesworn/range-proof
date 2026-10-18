# AGENTS.md: @forgesworn/range-proof

Instructions for AI coding agents working in this repository.

## What This Library Does

Pedersen commitment range proofs on secp256k1. Proves a secret value lies within a public range `[min, max]` without revealing the value. Built on CDS OR-composition bit proofs with Fiat-Shamir domain separation. Pure TypeScript, ESM-only, browser-compatible.

Runtime dependencies: `@noble/curves`, `@noble/hashes` only. Both declare `engines: node >= 20.19.0`, so that is the Node floor (also set in `package.json` `engines`). The whole API is synchronous: no function returns a Promise.

## Build & Test

```bash
npm install
npm run build       # tsc, compiles to dist/
npm test            # vitest run
npm run typecheck   # tsc --noEmit
```

All three must pass before committing. CI (`.github/workflows/ci.yml`) runs `npm ci`, `npm run typecheck`, `npm test` on pushes and pull requests.

## Architecture

```
src/
  index.ts        : public re-exports (types + functions)
  range-proof.ts  : main API, Pedersen commitments, CDS OR-composition bit proofs,
                    sum-binding / commitment-binding Schnorr proofs, range proof
                    creation and verification, age range helpers, serialisation
  utils.ts        : crypto primitives, secp256k1 point arithmetic, scalar ops,
                    constant-time comparison, generator points (G, H), hashToScalar
  errors.ts       : error hierarchy, RangeProofError > ValidationError, CryptoError
tests/
  range-proof.test.ts : test suite (Vitest)
dist/             : compiled output (not committed)
```

## Public API

- `createRangeProof(value, min, max, bindingContext?): RangeProof`: prove value is in [min, max]. `max - min` must be at most 2^32 - 1 (else `CryptoError`); value, min and max themselves only need to be non-negative safe integers
- `verifyRangeProof(proof, expectedMin, expectedMax, expectedBindingContext?): boolean`: verify; never throws
- `createAgeRangeProof(age, ageRange, subjectPubkey?): RangeProof`: convenience for age policies; `subjectPubkey` is the binding context
- `verifyAgeRangeProof(proof, expectedAgeRange, expectedSubjectPubkey?): boolean`: verify age proof; never throws
- `commit(value, blinding?): PedersenCommitment`: create a Pedersen commitment; optional `blinding` is a `bigint` in [1, N-1], the returned `blinding` is 64-character hex
- `verifyCommitment(commitment, value, blinding): boolean`: open and verify; `blinding` is the hex string, not a bigint
- `serializeRangeProof(proof): string` / `deserializeRangeProof(json): RangeProof`: JSON round-trip

Age range grammar: `'min-max'` (e.g. `'8-12'`, `'13-17'`) is the inclusive range [min, max]; `'min+'` (e.g. `'18+'`) is [min, 150], the upper bound being fixed at 150. Digits only, no spaces or signs. A malformed string makes `createAgeRangeProof` throw `ValidationError` and `verifyAgeRangeProof` return `false`; inverted bounds (`'12-8'`, `'151+'`) behave the same way.

**Verifier caveat:** `verifyRangeProof` takes the commitment from the proof itself and does not attest whose commitment it is. Callers must anchor `proof.commitment` to externally known state (e.g. a commitment the prover previously published or one bound to their identity) and take the expected range and binding context from their own policy. Do not document or write examples that treat a `true` result alone as proof of who holds the value.

## Crypto Safety Rules

- **Do not modify Fiat-Shamir domain separators** (`pedersen-bit-proof-v1`, `pedersen-sum-binding-v1`, `pedersen-commitment-binding-v1`). Changing these breaks all existing proofs and may introduce security vulnerabilities.
- **Do not expose blinding factors.** The `blinding` field in `PedersenCommitment` is the committer's secret. It must never appear in range proofs or be transmitted to verifiers.
- **Use @noble/curves for all EC operations.** Do not implement custom point arithmetic or scalar multiplication. The library's `safeMultiply` wrapper handles the zero-scalar edge case; do not call raw multiplication directly.
- **Generator H must remain nothing-up-my-sleeve.** The seed `'secp256k1-pedersen-H-v1'` and derivation method in `createGeneratorH()` must not change, so anyone can verify nobody knows `log_G(H)`.
- **Constant-time scalar comparison** via `scalarEqual()`, not `===` on bigints: timing side-channels matter in zero-knowledge code.
- **Deserialisation validates all inputs**: compressed point format, scalar hex length, array bounds. Do not weaken these checks.
- **CDS OR-composition**: bit proofs use Cramer-Damgard-Schoenmakers OR composition, so each bit is proven to be 0 or 1 without revealing which. The range proof decomposes the value into bits and combines them.
- **Binding context**: a range proof can be bound to an external context (e.g. a subject's public key). A proof created with context X will not verify under context Y. Cover this in tests when adding proof logic.

## Conventions

- **British English** in comments, docs, and error messages (serialise, colour, behaviour).
- **ESM-only**, all imports use `.js` extensions.
- **Amounts** as integers (no floats in crypto contexts).
- **Commit messages:** `type: description` format (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`).
- **No `Co-Authored-By` lines** in commits.
- **Anvil auto-release on main**: every `feat:`/`fix:` push to main runs `forgesworn/anvil@v0` (`auto-release.yml` bumps the version and creates a GitHub Release; `release.yml` runs pre-publish gates and publishes to npm via OIDC). Work on branches; merge to main only when a logical chunk is complete.

## Testing

Tests use Vitest, in `tests/range-proof.test.ts`. Run with `npm test`. When adding new proof logic, include:

- Happy-path verification (proof creates and verifies)
- Rejection of out-of-range values
- Rejection of tampered proofs (mutated commitments, swapped fields)
- Context binding tests (proof with context X must not verify under context Y)

## Verifying a Change

Run `npm run typecheck`, `npm test` and `npm run build` before committing; all three gate CI and the anvil release. For changes touching `range-proof.ts` or `utils.ts`, check the Crypto Safety Rules above before merging.
