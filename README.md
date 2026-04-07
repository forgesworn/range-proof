# @forgesworn/range-proof

**Nostr:** [`npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2`](https://njump.me/npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2)

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

## Error classes

- `RangeProofError` — base class
- `ValidationError` — malformed inputs, out-of-range values, bad JSON
- `CryptoError` — range too large, cryptographic failures

## Cryptography

- **Pedersen commitments**: `C = v*G + r*H` where `H` is a nothing-up-my-sleeve second generator derived by hashing `'secp256k1-pedersen-H-v1'` to a curve point.
- **Bit-decomposition range proofs**: CDS OR-composition proving each bit is 0 or 1, with a sum-binding Schnorr proof tying the bits to the overall range constraint.
- **Fiat-Shamir**: domain-separated with `'pedersen-bit-proof-v1'` and `'pedersen-sum-binding-v1'`.
- Maximum range: 2^32.

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
