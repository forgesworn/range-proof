/**
 * @forgesworn/range-proof — Basic Examples
 *
 * Demonstrates the complete API surface: range proofs, age verification,
 * binding context, Pedersen commitments, serialisation, and error handling.
 *
 * Run: npx tsx examples/basic-range-proof.ts
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
} from '@forgesworn/range-proof';

// --- 1. Basic range proof ---
console.log('=== 1. Basic Range Proof ===');

const proof = createRangeProof(42, 0, 100);
console.log(`Commitment: ${proof.commitment}`);
console.log(`Range: [${proof.min}, ${proof.max}]`);
console.log(`Bits used: ${proof.bits}`);

const valid = verifyRangeProof(proof, 0, 100);
console.log(`Valid: ${valid}`); // true

// Verifier with wrong range gets false
const wrongRange = verifyRangeProof(proof, 0, 50);
console.log(`Wrong range: ${wrongRange}`); // false

// --- 2. Age verification ---
console.log('\n=== 2. Age Verification ===');

// Prove age is 18+
const adultProof = createAgeRangeProof(25, '18+');
console.log(`18+ proof valid: ${verifyAgeRangeProof(adultProof, '18+')}`); // true

// Prove age is in the 8-12 band
const childProof = createAgeRangeProof(10, '8-12');
console.log(`8-12 proof valid: ${verifyAgeRangeProof(childProof, '8-12')}`); // true

// A child proof does not verify against an adult policy
console.log(`Child as adult: ${verifyAgeRangeProof(childProof, '18+')}`); // false

// --- 3. Binding context (prevents transplant attacks) ---
console.log('\n=== 3. Binding Context ===');

const subjectPubkey = 'ab'.repeat(32); // example 32-byte hex pubkey
const boundProof = createRangeProof(42, 0, 100, subjectPubkey);
console.log(`Bound proof valid: ${verifyRangeProof(boundProof, 0, 100, subjectPubkey)}`); // true

// Wrong context fails
console.log(`Wrong context: ${verifyRangeProof(boundProof, 0, 100, 'cd'.repeat(32))}`); // false

// No context fails
console.log(`No context: ${verifyRangeProof(boundProof, 0, 100)}`); // false

// --- 4. Pedersen commitments ---
console.log('\n=== 4. Pedersen Commitments ===');

const c = commit(42);
console.log(`Commitment: ${c.commitment}`);
console.log(`Blinding (secret): ${c.blinding.slice(0, 16)}...`);
console.log(`Value (secret): ${c.value}`);

// Open and verify
console.log(`Verify correct: ${verifyCommitment(c.commitment, 42, c.blinding)}`); // true
console.log(`Verify wrong value: ${verifyCommitment(c.commitment, 43, c.blinding)}`); // false

// --- 5. Serialisation ---
console.log('\n=== 5. Serialisation ===');

const json = serializeRangeProof(proof);
console.log(`JSON length: ${json.length} chars`);

const recovered = deserializeRangeProof(json);
console.log(`Recovered valid: ${verifyRangeProof(recovered, 0, 100)}`); // true

// --- 6. Error handling ---
console.log('\n=== 6. Error Handling ===');

try {
  createRangeProof(200, 0, 100); // value out of range
} catch (err) {
  if (err instanceof ValidationError) {
    console.log(`ValidationError: ${err.message}`);
  }
}

try {
  createRangeProof(0, 0, 2 ** 33); // range too large
} catch (err) {
  if (err instanceof CryptoError) {
    console.log(`CryptoError: ${err.message}`);
  }
}

console.log('\nAll examples completed successfully.');
