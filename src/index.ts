// Pedersen commitment range proofs
export {
  type PedersenCommitment,
  type RangeProof,
  commit,
  verifyCommitment,
  createRangeProof,
  verifyRangeProof,
  createAgeRangeProof,
  verifyAgeRangeProof,
  serializeRangeProof,
  deserializeRangeProof,
} from './range-proof.js';

// Errors
export {
  RangeProofError,
  ValidationError,
  CryptoError,
} from './errors.js';
