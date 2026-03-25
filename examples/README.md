# @forgesworn/range-proof — Examples

Runnable examples demonstrating the full API surface.

## Prerequisites

```bash
npm install @forgesworn/range-proof
npm install -D tsx        # TypeScript runner for examples
```

## Examples

### basic-range-proof.ts

Demonstrates the complete API:

1. Basic range proof: prove a value is in `[0, 100]`
2. Age verification: prove age is `18+` or within a band (`8-12`)
3. Binding context: bind a proof to a specific subject identity
4. Pedersen commitments: lower-level `commit()` and `verifyCommitment()`
5. Serialisation and deserialisation with full validation
6. Error handling: `ValidationError`, `CryptoError`
7. Combined pattern: zero-knowledge age attestation with `nostr-attestations`

```bash
npx tsx examples/basic-range-proof.ts
```

## Key Patterns

### Prove a value without revealing it

```typescript
import { createRangeProof, verifyRangeProof } from '@forgesworn/range-proof'

// Prover side (value is secret)
const proof = createRangeProof(42, 0, 100)
const json = serializeRangeProof(proof)

// Verifier side (receives json + commitment, not the value)
const recovered = deserializeRangeProof(json)
const valid = verifyRangeProof(recovered, 0, 100)
```

### Age verification

```typescript
import { createAgeRangeProof, verifyAgeRangeProof } from '@forgesworn/range-proof'

const proof = createAgeRangeProof(25, '18+', subjectPubkey)  // age is secret
const valid = verifyAgeRangeProof(proof, '18+', subjectPubkey)  // true
```

### Bind to an identity (prevents transplant attacks)

```typescript
const proof = createRangeProof(value, min, max, subjectPubkey)
// Proof will only verify when the correct subjectPubkey is supplied
verifyRangeProof(proof, min, max, subjectPubkey)  // true
verifyRangeProof(proof, min, max, 'other-key')    // false
```

### Embed in a Nostr attestation

```typescript
import { createAttestation } from 'nostr-attestations'
import { createAgeRangeProof, serializeRangeProof } from '@forgesworn/range-proof'

const proof = createAgeRangeProof(age, '18+', subjectPubkey)
const attestation = createAttestation({
  type: 'age-credential',
  subject: subjectPubkey,
  identifier: subjectPubkey,
  summary: 'Age 18+ verified',
  schema: 'https://example.com/schemas/age-range-v1',
  content: JSON.stringify({ proof: serializeRangeProof(proof) }),
  tags: [['age-policy', '18+']],
})
```

## See Also

- [llms-full.txt](../llms-full.txt) — complete API reference for AI tools
- [README.md](../README.md) — overview and quick start
