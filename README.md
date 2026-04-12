# @forgesworn/range-proof

**Nostr:** [`npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2`](https://njump.me/npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2)

[![npm](https://img.shields.io/npm/v/@forgesworn/range-proof)](https://www.npmjs.com/package/@forgesworn/range-proof)
[![CI](https://github.com/forgesworn/range-proof/actions/workflows/ci.yml/badge.svg)](https://github.com/forgesworn/range-proof/actions/workflows/ci.yml)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/TheCryptoDonkey?logo=githubsponsors&color=ea4aaa&label=Sponsor)](https://github.com/sponsors/TheCryptoDonkey)

Pedersen commitment range proofs on secp256k1.

**Prove a value is within a range without revealing it.**

## Use cases

- **Age-gating** — prove a user is 18+ or between 13 and 17 without revealing their birth date
- **Income brackets** — prove income is above a threshold for a loan without revealing the amount
- **Credit scoring** — prove a credit score is above a threshold without revealing the score
- **Salary bands** — prove a salary falls within a negotiating band without disclosing it

## Install

```bash
npm install @forgesworn/range-proof
```

## Usage

### Range proofs

```typescript
import { createRangeProof, verifyRangeProof } from '@forgesworn/range-proof';

// Prove that `value` is in [min, max] without revealing `value`
const proof = createRangeProof(value, min, max);

// Verifiers must supply the public range they expect
const valid = verifyRangeProof(proof, min, max); // true
```

### Age range proofs

```typescript
import { createAgeRangeProof, verifyAgeRangeProof } from '@forgesworn/range-proof';

// Prove age is between 8 and 12 (e.g. child category)
const proof = createAgeRangeProof(10, '8-12');
const valid = verifyAgeRangeProof(proof, '8-12'); // true

// Prove age is 18 or over
const adultProof = createAgeRangeProof(25, '18+');
const adultValid = verifyAgeRangeProof(adultProof, '18+'); // true
```

### Binding context

Pass an optional context string to bind the proof to a specific credential or identity. A proof created with one context will not verify under a different context, preventing transplant attacks:

```typescript
const proof = createRangeProof(value, min, max, 'subject-pubkey-hex');
const valid = verifyRangeProof(proof, min, max, 'subject-pubkey-hex');
```

### Pedersen commitments

```typescript
import { commit, verifyCommitment } from '@forgesworn/range-proof';

const c = commit(42);
// c.commitment — the public commitment point (compressed hex)
// c.blinding   — the secret blinding factor
// c.value      — the committed value (kept secret)

// Open the commitment to verify
const valid = verifyCommitment(c.commitment, 42, c.blinding); // true
```

### Serialisation

```typescript
import { serializeRangeProof, deserializeRangeProof } from '@forgesworn/range-proof';

const json = serializeRangeProof(proof);
const proof2 = deserializeRangeProof(json);
```

## Error Handling

Three error classes, all importable from the package:

```typescript
import {
  RangeProofError,   // base class
  ValidationError,   // malformed inputs, out-of-range values, bad JSON
  CryptoError,       // range too large, cryptographic failures
} from '@forgesworn/range-proof';
```

### Which functions throw what

**`createRangeProof`** throws on invalid inputs:

```typescript
try {
  const proof = createRangeProof(value, min, max, bindingContext);
} catch (err) {
  if (err instanceof ValidationError) {
    // 'Range proof values must be safe integers'
    // 'Minimum must be non-negative'
    // 'Maximum must be >= minimum'
    // 'Value is not within the specified range'
    // 'Binding context exceeds maximum length (1024 bytes)'
  }
  if (err instanceof CryptoError) {
    // 'Range too large for range proof (max 2^32)'
  }
}
```

**`verifyRangeProof`** never throws — it returns `false` for any invalid or tampered
proof. This is a deliberate design choice: verification is a boolean question.

```typescript
const valid = verifyRangeProof(proof, min, max);
// valid is true or false — no exceptions
```

**`deserializeRangeProof`** throws `ValidationError` for malformed JSON, missing fields,
or invalid hex values. This is where you should handle errors when loading proofs from
untrusted sources:

```typescript
import {
  deserializeRangeProof,
  verifyRangeProof,
  ValidationError,
} from '@forgesworn/range-proof';

// Full verification pipeline with error handling
function verifyProofFromJson(
  json: string,
  expectedMin: number,
  expectedMax: number,
  expectedContext?: string,
): boolean {
  try {
    const proof = deserializeRangeProof(json);
    return verifyRangeProof(proof, expectedMin, expectedMax, expectedContext);
  } catch (err) {
    if (err instanceof ValidationError) {
      // Malformed proof data — reject
      console.error('Invalid proof format:', err.message);
      return false;
    }
    throw err; // unexpected error — re-throw
  }
}
```

## Cryptography

- **Pedersen commitments**: `C = v*G + r*H` where `H` is a nothing-up-my-sleeve second generator derived by hashing `'secp256k1-pedersen-H-v1'` to a curve point.
- **Bit-decomposition range proofs**: CDS OR-composition proving each bit is 0 or 1, with a sum-binding Schnorr proof tying the bits to the overall range constraint.
- **Fiat-Shamir**: domain-separated with `'pedersen-bit-proof-v1'` and `'pedersen-sum-binding-v1'`.
- Maximum range: 2^32.

### Generator H Derivation

The second generator `H` is critical to Pedersen commitment security. Nobody must know
`log_G(H)` — if they did, they could open a commitment to any value. `H` is derived
deterministically using a nothing-up-my-sleeve construction:

```
Algorithm: try-and-increment hash-to-point

1. seed = UTF-8 bytes of 'secp256k1-pedersen-H-v1'    (23 bytes)
2. For counter i = 0, 1, 2, ... up to 255:
   a. buf = seed || byte(i)                            (24 bytes)
   b. h = SHA-256(buf)                                 (32 bytes)
   c. candidate = 0x02 || h                            (33 bytes — compressed point, even Y)
   d. If candidate is a valid secp256k1 point → H = candidate; stop
   e. Otherwise → increment i and retry
3. If no valid point found in 256 iterations → throw CryptoError
```

In practice, counter `i = 0` produces a valid point on the first try. The algorithm is
deterministic — every implementation produces the same `H` from the same seed string.

The security property: `H` is derived entirely from a fixed ASCII string with no
trapdoor. The hash acts as a random oracle, and nobody can compute `log_G(H)` without
breaking the discrete logarithm assumption on secp256k1.

This is the same "hash-and-pray" technique used by Bulletproofs (Bünz et al. 2018) and
other Pedersen-based protocols where a second generator is needed without a trusted setup.

## Part of the ForgeSworn Toolkit

[ForgeSworn](https://forgesworn.dev) builds open-source cryptographic identity, payments, and coordination tools for Nostr.

| Library | What it does |
|---------|-------------|
| [nsec-tree](https://github.com/forgesworn/nsec-tree) | Deterministic sub-identity derivation |
| [ring-sig](https://github.com/forgesworn/ring-sig) | SAG/LSAG ring signatures on secp256k1 |
| [range-proof](https://github.com/forgesworn/range-proof) | Pedersen commitment range proofs |
| [canary-kit](https://github.com/forgesworn/canary-kit) | Coercion-resistant spoken verification |
| [spoken-token](https://github.com/forgesworn/spoken-token) | Human-speakable verification tokens |
| [toll-booth](https://github.com/forgesworn/toll-booth) | L402 payment middleware |
| [geohash-kit](https://github.com/forgesworn/geohash-kit) | Geohash toolkit with polygon coverage |
| [nostr-attestations](https://github.com/forgesworn/nostr-attestations) | NIP-VA verifiable attestations |
| [dominion](https://github.com/forgesworn/dominion) | Epoch-based encrypted access control |
| [nostr-veil](https://github.com/forgesworn/nostr-veil) | Privacy-preserving Web of Trust |

## Licence

MIT
