# @forgesworn/range-proof

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

## Licence

MIT
