/** Base error for range proof operations */
export class RangeProofError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RangeProofError';
  }
}

/** Validation errors (malformed inputs, bounds exceeded) */
export class ValidationError extends RangeProofError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Cryptographic errors (invalid commitments, failed verification) */
export class CryptoError extends RangeProofError {
  constructor(message: string) {
    super(message);
    this.name = 'CryptoError';
  }
}
