# GEMINI.md -- @forgesworn/range-proof

Pedersen commitment range proofs on secp256k1 -- prove a secret value lies in `[min, max]` without revealing it.

## Commands

- `npm run build` -- compile TypeScript to `dist/` via `tsc`
- `npm test` -- run 55 Vitest tests (~10s)
- `npm run typecheck` -- type-check without emitting

All three must pass before committing.

## Dependencies

Runtime only:

- `@noble/curves` -- secp256k1 point arithmetic, scalar multiplication, projective coordinates
- `@noble/hashes` -- SHA-256 used in Fiat-Shamir hash and generator H derivation

No other runtime dependencies. ESM-only (`"type": "module"`). Browser-compatible.

## Structure

```
src/
  index.ts        -- Public re-exports (types + functions)
  range-proof.ts  -- Main API: Pedersen commitments, CDS OR-composition bit proofs,
                     sum-binding / commitment-binding Schnorr proofs, range proof
                     creation and verification, age range helpers, serialisation
  utils.ts        -- Crypto primitives: secp256k1 point arithmetic, scalar ops,
                     constant-time comparison, generator points (G, H), hashToScalar
  errors.ts       -- Error hierarchy: RangeProofError > ValidationError, CryptoError
tests/
  range-proof.test.ts  -- All 55 tests
dist/             -- Compiled output (not committed)
```

## Public API

- `createRangeProof(value, min, max, bindingContext?)` -- prove value is in `[min, max]`
- `verifyRangeProof(proof, expectedMin, expectedMax, expectedBindingContext?)` -- verify
- `createAgeRangeProof(age, ageRange, subjectPubkey?)` -- convenience for age policies (`"18+"`, `"8-12"`)
- `verifyAgeRangeProof(proof, expectedAgeRange, expectedSubjectPubkey?)` -- verify age proof
- `commit(value, blinding?)` -- create a Pedersen commitment
- `verifyCommitment(commitment, value, blinding)` -- open and verify
- `serializeRangeProof(proof)` / `deserializeRangeProof(json)` -- JSON round-trip

## Conventions

- **British English** in all comments, docs, and error messages -- serialise, colour, behaviour.
- **ESM-only** -- all imports use `.js` extensions, even in TypeScript source.
- **Commit messages:** `type: description` format (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`).
- **No `Co-Authored-By` lines** in commits.
- **Amounts** as integers (no floats in crypto contexts).

## Key Patterns and Gotchas

**Generator H derivation** -- `createGeneratorH()` in `utils.ts` derives the second Pedersen generator by hashing the seed `'secp256k1-pedersen-H-v1'` and iterating until a valid curve point is found. This is nothing-up-my-sleeve: nobody knows `log_G(H)`. Do not change the seed or derivation method -- it would silently break all existing commitments.

**Fiat-Shamir domain separators** -- the strings `pedersen-bit-proof-v1`, `pedersen-sum-binding-v1`, and `pedersen-commitment-binding-v1` are baked into challenge hashes. Changing any of them invalidates all existing proofs and may introduce vulnerabilities.

**Blinding factors** -- `PedersenCommitment.blinding` is the committer's secret. It must never appear in a serialised range proof or be sent to a verifier. The library enforces this via the serialisation layer; do not bypass it.

**Constant-time comparison** -- `scalarEqual()` in `utils.ts` must be used for all scalar comparisons. Do not replace with `===` on bigints -- timing side-channels matter in zero-knowledge code.

**Binding context** -- a range proof can be bound to an external context (e.g. a subject's public key). A proof created with context X will not verify under context Y. Tests must cover this: proofs must reject under a different context.

**CDS OR-composition** -- bit proofs use Cramer-Damgard-Schoenmakers OR composition. Each bit is proven to be 0 or 1 without revealing which. The range proof decomposes the value into bits and combines them.

**`safeMultiply` wrapper** -- all scalar multiplications go through `@noble/curves`' safe wrapper to handle the zero-scalar edge case. Do not call raw multiplication directly.

**Deserialisation is strict** -- compressed point format (33 bytes / 66 hex chars), 32-byte scalar hex, and array bounds are all validated. Do not loosen these checks.

## Testing

55 tests in `tests/range-proof.test.ts` using Vitest. When adding new proof logic, cover:

- Happy-path: proof creates and verifies correctly
- Out-of-range rejection: values outside `[min, max]` must fail
- Tampered proof rejection: mutated commitments and swapped fields must fail
- Context binding: proof with context X must not verify under context Y

Run: `npm test`

## Release

Semantic-release runs on push to `main` and auto-publishes to npm under `@forgesworn/range-proof`. Every `feat:` commit bumps minor; every `fix:` bumps patch. Work on a branch and merge to main only when a logical chunk is complete. Publishing uses OIDC -- no `NPM_TOKEN` required.
