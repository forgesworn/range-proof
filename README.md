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

Requirements:

- **ESM-only.** There is no CommonJS build; use `import`, not `require`.
- **Node.js 20.19 or later.** This is the floor declared by the runtime dependencies `@noble/curves` and `@noble/hashes` (`engines` in `package.json`).
- **Synchronous API.** Every function returns its result directly. Nothing returns a Promise, so there is nothing to `await`.

## Usage

Each snippet below is self-contained: it imports what it uses and defines every variable.

### Range proofs

```typescript
import { createRangeProof, verifyRangeProof } from '@forgesworn/range-proof';

const value = 25; // the secret value, known only to the prover
const min = 18;
const max = 150;

// Prove that `value` is in [min, max] without revealing `value`
const proof = createRangeProof(value, min, max);

// Verifiers must supply the public range they expect
const valid = verifyRangeProof(proof, min, max); // true
```

`createRangeProof` returns a [`RangeProof`](#types). `verifyRangeProof` returns a boolean.

Limits: `value`, `min` and `max` must be safe integers, `min` must be non-negative, `max` must be at least `min`, and `value` must lie in `[min, max]`. The width of the range, `max - min`, may be at most 2^32 - 1 (see [Cryptography](#cryptography)).

### Age range proofs

```typescript
import { createAgeRangeProof, verifyAgeRangeProof } from '@forgesworn/range-proof';

// Prove age is between 8 and 12 (e.g. child category)
const childProof = createAgeRangeProof(10, '8-12');
const childValid = verifyAgeRangeProof(childProof, '8-12'); // true

// Prove age is between 13 and 17
const teenProof = createAgeRangeProof(15, '13-17');
const teenValid = verifyAgeRangeProof(teenProof, '13-17'); // true

// Prove age is 18 or over
const adultProof = createAgeRangeProof(25, '18+');
const adultValid = verifyAgeRangeProof(adultProof, '18+'); // true
```

The age range string is one of two forms, digits only:

| Form | Example | Range proved |
|------|---------|--------------|
| `'min-max'` | `'8-12'`, `'13-17'` | `[min, max]`, both inclusive |
| `'min+'` | `'18+'` | `[min, 150]`; the upper bound is fixed at 150 |

No spaces, signs, decimals or other characters are accepted; leading zeros are (`'08-12'` means 8 to 12). A malformed string is handled differently by the two functions:

- `createAgeRangeProof` throws `ValidationError` (`Invalid age range format (expected "min-max" or "min+")`).
- `verifyAgeRangeProof` never throws and returns `false`.

A well-formed string whose bounds are inverted, such as `'12-8'` or `'151+'`, is also rejected: `createAgeRangeProof` throws `ValidationError` (`Maximum must be >= minimum`) and `verifyAgeRangeProof` returns `false`. An age outside the range, such as 17 for `'18+'`, makes `createAgeRangeProof` throw `ValidationError`.

The age helpers are thin wrappers over the range functions. A proof from `createAgeRangeProof(25, '18+')` is the same as `createRangeProof(25, 18, 150)`, and `verifyRangeProof(proof, 18, 150)` accepts it. The optional third argument, `subjectPubkey`, is the binding context described below.

### Binding context

Pass an optional context string to bind the proof to a specific credential or identity. A proof created with one context will not verify under a different context, preventing transplant attacks. The context may be any string up to 1024 UTF-8 bytes (longer strings throw `ValidationError`); an empty string is treated as no context.

```typescript
import { createRangeProof, verifyRangeProof } from '@forgesworn/range-proof';

const value = 25;
const min = 18;
const max = 150;
const subjectPubkey = 'subject-pubkey-hex';

const proof = createRangeProof(value, min, max, subjectPubkey);

verifyRangeProof(proof, min, max, subjectPubkey);     // true
verifyRangeProof(proof, min, max, 'other-subject');   // false: wrong context
verifyRangeProof(proof, min, max);                    // false: context missing
```

### Pedersen commitments

```typescript
import { commit, verifyCommitment } from '@forgesworn/range-proof';

const c = commit(42);
// c.commitment: the public commitment point (66-character compressed hex, 02/03 prefix)
// c.blinding:   the secret blinding factor (64-character lowercase hex)
// c.value:      the committed value (kept secret)

// Open the commitment to verify
const valid = verifyCommitment(c.commitment, 42, c.blinding); // true

// Optionally supply your own blinding factor
const fixed = commit(42, 123456789n);
```

The two functions take the blinding factor in different forms:

- `commit(value, blinding?)` takes an optional `bigint` in `[1, N-1]`, where `N` is the secp256k1 group order. A random factor is generated if you omit it. A non-bigint, `0n`, a negative value or a value of `N` or more throws `ValidationError`. The returned `blinding` is a 64-character zero-padded lowercase hex string.
- `verifyCommitment(commitment, value, blinding)` takes `blinding` as a hex string of 1 to 64 hex digits (any case, no `0x` prefix) that encodes a value below `N`. It returns `false` for a wrong opening, malformed hex or an invalid point, and throws `ValidationError` only when an argument has the wrong JavaScript type (`commitment` or `blinding` not a string, `value` not a non-negative safe integer).

`commit` and `createRangeProof` are independent. `createRangeProof` makes its own commitment and keeps the blinding factor internal, so `proof.commitment` cannot be opened with `verifyCommitment`.

### Serialisation

```typescript
import {
  createRangeProof,
  serializeRangeProof,
  deserializeRangeProof,
  verifyRangeProof,
} from '@forgesworn/range-proof';

const proof = createRangeProof(25, 18, 150);

const json = serializeRangeProof(proof);        // string
const proof2 = deserializeRangeProof(json);     // RangeProof; throws ValidationError if malformed

const valid = verifyRangeProof(proof2, 18, 150); // true
```

## API

```typescript
function createRangeProof(value: number, min: number, max: number, bindingContext?: string): RangeProof
function verifyRangeProof(proof: RangeProof, expectedMin: number, expectedMax: number, expectedBindingContext?: string): boolean

function createAgeRangeProof(age: number, ageRange: string, subjectPubkey?: string): RangeProof
function verifyAgeRangeProof(proof: RangeProof, expectedAgeRange: string, expectedSubjectPubkey?: string): boolean

function commit(value: number, blinding?: bigint): PedersenCommitment
function verifyCommitment(commitment: string, value: number, blinding: string): boolean

function serializeRangeProof(proof: RangeProof): string
function deserializeRangeProof(json: string): RangeProof
```

All of these are synchronous. The package also exports the error classes `RangeProofError`, `ValidationError` and `CryptoError` (see [Error Handling](#error-handling)). [`llms-full.txt`](llms-full.txt) has the full reference.

### Types

`RangeProof` and `PedersenCommitment` are exported as types:

```typescript
interface RangeProof {
  commitment: string;       // overall commitment C = v*G + r*H (compressed hex)
  min: number;              // minimum of the range (public)
  max: number;              // maximum of the range (public)
  bits: number;             // bits used: ceil(log2(max - min + 1))
  lowerProof: BitProof[];   // bit proofs for (value - min)
  upperProof: BitProof[];   // bit proofs for (max - value)
  lowerCommitment: string;  // commitment to (value - min)
  upperCommitment: string;  // commitment to (max - value)
  sumBindingE: string;      // sum-binding Schnorr challenge (hex scalar)
  sumBindingS: string;      // sum-binding Schnorr response (hex scalar)
  commitBindingE: string;   // commitment-binding Schnorr challenge (hex scalar)
  commitBindingS: string;   // commitment-binding Schnorr response (hex scalar)
  context?: string;         // binding context, present only if one was supplied
}

// Not exported by name; every field is a hex string
interface BitProof {
  commitment: string;
  e0: string;
  s0: string;
  e1: string;
  s1: string;
}

interface PedersenCommitment {
  commitment: string; // C = v*G + r*H (66-character compressed hex), safe to share
  blinding: string;   // the blinding factor r (64-character hex), keep secret
  value: number;      // the committed value, keep secret
}
```

A `RangeProof` contains no blinding factor and no secret value, so it can be sent to a verifier as is (or via `serializeRangeProof`).

## Error Handling

Three error classes, all importable from the package:

```typescript
import {
  RangeProofError,   // base class
  ValidationError,   // malformed inputs, out-of-range values, bad JSON
  CryptoError,       // range width too large, cryptographic failures
} from '@forgesworn/range-proof';
```

### Which functions throw what

**`createRangeProof`** throws on invalid inputs:

```typescript
import { createRangeProof, ValidationError, CryptoError } from '@forgesworn/range-proof';

const value = 25;
const min = 18;
const max = 150;
const bindingContext = 'subject-pubkey-hex';

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
    // 'Range too large for range proof (max 2^32)': max - min is 2^32 or more
  }
}
```

**`createAgeRangeProof`** throws `ValidationError` for a malformed age range string (see
[Age range proofs](#age-range-proofs)) and for everything `createRangeProof` rejects.
**`commit`** throws `ValidationError` for a negative or non-integer value and for an invalid
blinding factor. **`verifyCommitment`** returns `false` for a wrong opening, bad hex or an invalid
point, and throws `ValidationError` only for arguments of the wrong type.

**`verifyRangeProof`** never throws — it returns `false` for any invalid or tampered
proof. This is a deliberate design choice: verification is a boolean question.

```typescript
import { createRangeProof, verifyRangeProof } from '@forgesworn/range-proof';

const proof = createRangeProof(25, 18, 150);

const valid = verifyRangeProof(proof, 18, 150);
// valid is true or false, never an exception
```

**`verifyAgeRangeProof`** also never throws; a malformed age range string gives `false`.

The commitment is taken from the proof itself. Verification answers "does this
proof demonstrate a value in [min, max] for this commitment?" — it does not
attest to whose commitment it is. Callers must independently anchor
`proof.commitment` to externally known state (e.g. a commitment the prover
previously published or that is bound to their identity). The expected range
and binding context passed to `verifyRangeProof` must come from the verifier's
own policy, not from the proof.

**`deserializeRangeProof`** throws `ValidationError` for malformed JSON, missing fields,
or invalid hex values. This is where you should handle errors when loading proofs from
untrusted sources:

```typescript
import {
  deserializeRangeProof,
  verifyRangeProof,
  ValidationError,
  createRangeProof,
  serializeRangeProof,
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
      // Malformed proof data: reject
      console.error('Invalid proof format:', err.message);
      return false;
    }
    throw err; // unexpected error, re-throw
  }
}

const json = serializeRangeProof(createRangeProof(25, 18, 150));
const ok = verifyProofFromJson(json, 18, 150); // true
```

## Cryptography

- **Pedersen commitments**: `C = v*G + r*H` where `H` is a nothing-up-my-sleeve second generator derived by hashing `'secp256k1-pedersen-H-v1'` to a curve point.
- **Bit-decomposition range proofs**: CDS OR-composition proving each bit is 0 or 1, with sum-binding and commitment-binding Schnorr proofs tying the bits to the range constraint and public commitment.
- **Fiat-Shamir**: domain-separated with `'pedersen-bit-proof-v1'`, `'pedersen-sum-binding-v1'`, and `'pedersen-commitment-binding-v1'`.
- Maximum range width: `max - min` may be at most 2^32 - 1, so a proof covers at most 2^32 distinct values (32 bits per side). `createRangeProof` throws `CryptoError` beyond that. The limit applies only to the width `max - min`: `value`, `min` and `max` themselves can be any non-negative safe integers (for example `createRangeProof(2 ** 40 + 3, 2 ** 40, 2 ** 40 + 10)` is fine).

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
