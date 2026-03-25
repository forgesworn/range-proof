/**
 * Basic @forgesworn/range-proof usage examples.
 *
 * Run with: npx tsx examples/basic-range-proof.ts
 */

import {
  createRangeProof,
  verifyRangeProof,
  createAgeRangeProof,
  verifyAgeRangeProof,
  commit,
  verifyCommitment,
  serializeRangeProof,
  deserializeRangeProof,
  ValidationError,
  CryptoError,
} from '@forgesworn/range-proof'

// ---------------------------------------------------------------------------
// 1. Basic range proof
// ---------------------------------------------------------------------------

console.log('=== 1. Basic Range Proof ===')

const proof = createRangeProof(42, 0, 100)

console.log('Proof commitment:', proof.commitment)   // compressed hex point
console.log('Range:', proof.min, '–', proof.max)     // 0 – 100
console.log('Bits used:', proof.bits)                // 7 (ceil(log2(101)))
console.log()

const valid = verifyRangeProof(proof, 0, 100)
console.log('Verifies (correct range):', valid)      // true

const wrongRange = verifyRangeProof(proof, 0, 50)
console.log('Verifies (wrong range):', wrongRange)   // false
console.log()

// ---------------------------------------------------------------------------
// 2. Age verification — prove 18+ without revealing exact age
// ---------------------------------------------------------------------------

console.log('=== 2. Age Verification (18+) ===')

const age = 25  // kept secret
const ageProof = createAgeRangeProof(age, '18+')

// The verifier only learns "the prover is 18 or older"
const ageValid = verifyAgeRangeProof(ageProof, '18+')
console.log('Age >= 18:', ageValid)                  // true
console.log('Range used:', ageProof.min, '–', ageProof.max)  // 18 – 150
console.log()

// Prove age is within a band (e.g. for age-restricted games)
const bandProof = createAgeRangeProof(10, '8-12')
const bandValid = verifyAgeRangeProof(bandProof, '8-12')
console.log('Age in 8–12:', bandValid)               // true
console.log()

// ---------------------------------------------------------------------------
// 3. Binding context — bind proof to a specific identity
// ---------------------------------------------------------------------------

console.log('=== 3. Binding Context ===')

const subjectPubkey = 'npub1abc123...'

const boundProof = createRangeProof(25, 18, 150, subjectPubkey)

// Verifier must know the expected context
const boundValid = verifyRangeProof(boundProof, 18, 150, subjectPubkey)
console.log('Verifies (correct context):', boundValid)  // true

const wrongContext = verifyRangeProof(boundProof, 18, 150, 'wrong-pubkey')
console.log('Verifies (wrong context):', wrongContext)  // false

const noContext = verifyRangeProof(boundProof, 18, 150)
console.log('Verifies (no context):', noContext)        // false
console.log()

// ---------------------------------------------------------------------------
// 4. Pedersen commitments (lower-level)
// ---------------------------------------------------------------------------

console.log('=== 4. Pedersen Commitments ===')

// Commit to a value; receive a commitment + blinding factor
const c = commit(42)
console.log('Commitment:', c.commitment)             // compressed hex point
// c.blinding and c.value are the committer's secrets

// Verify the opening
const opened = verifyCommitment(c.commitment, 42, c.blinding)
console.log('Commitment opens correctly:', opened)   // true

const wrong = verifyCommitment(c.commitment, 43, c.blinding)
console.log('Wrong value rejected:', !wrong)         // true (wrong is false)
console.log()

// ---------------------------------------------------------------------------
// 5. Serialisation and deserialisation
// ---------------------------------------------------------------------------

console.log('=== 5. Serialisation ===')

const json = serializeRangeProof(proof)
console.log('Serialised (first 100 chars):', json.slice(0, 100) + '...')

const recovered = deserializeRangeProof(json)
console.log('Deserialised min:', recovered.min)      // 0
console.log('Deserialised max:', recovered.max)      // 100

// Verify the round-tripped proof
const recoveredValid = verifyRangeProof(recovered, 0, 100)
console.log('Round-trip proof verifies:', recoveredValid)  // true
console.log()

// Tampered JSON is rejected
try {
  const tampered = json.replace(proof.commitment, '02' + 'aa'.repeat(32))
  deserializeRangeProof(tampered)
} catch (err) {
  console.log('Tampered JSON rejected:', err instanceof ValidationError)  // true
}
console.log()

// ---------------------------------------------------------------------------
// 6. Error handling
// ---------------------------------------------------------------------------

console.log('=== 6. Error Handling ===')

// Value outside range throws ValidationError
try {
  createRangeProof(200, 0, 100)
} catch (err) {
  if (err instanceof ValidationError) {
    console.log('Out-of-range value:', err.message)
    // 'Value is not within the specified range'
  }
}

// Negative minimum throws ValidationError
try {
  createRangeProof(5, -10, 10)
} catch (err) {
  if (err instanceof ValidationError) {
    console.log('Negative min:', err.message)
    // 'Minimum must be non-negative'
  }
}

// Invalid age range format throws ValidationError
try {
  createAgeRangeProof(25, 'adult')
} catch (err) {
  if (err instanceof ValidationError) {
    console.log('Invalid age range:', err.message)
    // 'Invalid age range format (expected "min-max" or "min+")'
  }
}

console.log()

// ---------------------------------------------------------------------------
// 7. Combining with nostr-attestations
// ---------------------------------------------------------------------------

console.log('=== 7. Pattern: Zero-knowledge Age Attestation ===')

// Typical pattern: prover creates a bound age proof
// Attestor verifies and issues a kind 31000 attestation
// The attestation content can embed the serialised proof

const subjectKey = 'abc123pubkey'
const zeroKnowledgeAgeProof = createAgeRangeProof(25, '18+', subjectKey)
const serialised = serializeRangeProof(zeroKnowledgeAgeProof)

console.log('Proof size (bytes):', serialised.length)
console.log('Attestor verifies:', verifyAgeRangeProof(
  deserializeRangeProof(serialised),
  '18+',
  subjectKey,
))
// => true
// The attestor can now issue a kind 31000 CREDENTIAL event with:
// content: JSON.stringify({ proof: serialised })
// tags: [['proof-type', 'age-range'], ['age-policy', '18+']]
