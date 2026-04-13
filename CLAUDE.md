# CLAUDE.md — @forgesworn/range-proof

AI agent instructions for working in this repository.

## Build & Test

```bash
npm run build       # tsc — compiles to dist/
npm test            # vitest run
npm run typecheck   # tsc --noEmit
```

All three must pass before committing.

## Architecture

```
src/
  utils.ts        — Crypto primitives: secp256k1 point arithmetic, scalar ops,
                    constant-time comparison, generator points (G, H), hashToScalar
  range-proof.ts  — Main API: Pedersen commitments, CDS OR-composition bit proofs,
                    sum-binding / commitment-binding Schnorr proofs, range proof
                    creation and verification, age range helpers, serialisation
  errors.ts       — Error hierarchy: RangeProofError > ValidationError, CryptoError
  index.ts        — Public re-exports (types + functions)
```

Runtime dependencies: `@noble/curves`, `@noble/hashes` only. ESM-only (`"type": "module"`).

## Crypto Safety

- **Do not modify Fiat-Shamir domain separators** (`pedersen-bit-proof-v1`, `pedersen-sum-binding-v1`, `pedersen-commitment-binding-v1`). Changing these breaks all existing proofs and may introduce security vulnerabilities.
- **Do not expose blinding factors.** The `blinding` field in `PedersenCommitment` is the committer's secret. It must never appear in range proofs or be transmitted to verifiers.
- **Use @noble/curves for all EC operations.** Do not implement custom point arithmetic or scalar multiplication. The library's `safeMultiply` wrapper handles the zero-scalar edge case.
- **Generator H must remain nothing-up-my-sleeve.** The seed `'secp256k1-pedersen-H-v1'` and derivation method in `createGeneratorH()` must not change — anyone must be able to verify nobody knows `log_G(H)`.
- **Constant-time scalar comparison** via `scalarEqual()` — do not replace with `===` on bigints.
- **Deserialisation validates all inputs** — compressed point format, scalar hex length, array bounds. Do not weaken these checks.

## Conventions

- **British English** in comments, docs, and error messages (serialise, colour, behaviour).
- **ESM-only** — all imports use `.js` extensions.
- **Commit messages:** `type: description` format (e.g. `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`).
- **No `Co-Authored-By` lines** in commits.
- **Anvil auto-release on main** — every `feat:`/`fix:` push to main runs `forgesworn/anvil@v0` (`auto-release.yml` bumps the version and creates a GitHub Release; `release.yml` runs pre-publish gates and publishes to npm via OIDC). Work on branches; merge to main only when a logical chunk is complete.

## Testing

Tests use Vitest. Run with `npm test`. When adding new proof logic, include:
- Happy-path verification (proof creates and verifies)
- Rejection of out-of-range values
- Rejection of tampered proofs (mutated commitments, swapped fields)
- Context binding tests (proof with context X must not verify under context Y)
