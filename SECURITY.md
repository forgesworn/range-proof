# Security

## Audit Status

**This library has not undergone a formal security audit.**

It is provided as-is for research and experimentation. Use in production systems carrying real value is at your own risk. If you are building a system that depends on these proofs, consider commissioning an independent audit.

## Algorithm

This library implements zero-knowledge range proofs using:

- **Pedersen commitments** on secp256k1: `C = v*G + r*H`, where `H` is a nothing-up-my-sleeve second generator derived by hashing `'secp256k1-pedersen-H-v1'` to a curve point (try-and-increment hash-to-point).
- **CDS OR-composition** (Cramer, Damgard, Schoenmakers 1994): each bit of the decomposed value is proven to be 0 or 1 using a Schnorr-style OR-proof, then a sum-binding Schnorr proof ties the bit commitments to the overall range constraint.
- **Fiat-Shamir transform**: interactive Schnorr proofs are made non-interactive via domain-separated hashing (`pedersen-bit-proof-v1`, `pedersen-sum-binding-v1`, `pedersen-commitment-binding-v1`).

Maximum supported range width: 2^32.

## Security Properties

- **Perfectly hiding** Pedersen commitments: the commitment reveals no information about the committed value (information-theoretic security).
- **Computationally binding** Pedersen commitments: opening a commitment to a different value requires solving the discrete logarithm problem on secp256k1.
- **Zero-knowledge range proofs**: the proof reveals nothing about the value beyond the fact that it lies within the stated range.
- **Context binding**: optional binding context (e.g. a subject pubkey) is included in the Fiat-Shamir challenge to prevent proof transplanting between credentials.

## Known Limitations

- **Not constant-time in all operations.** Scalar arithmetic and point operations rely on `@noble/curves`, which provides constant-time field operations, but higher-level proof construction logic (bit decomposition, loop control flow) is not constant-time with respect to the secret value's bit pattern.
- **Not post-quantum.** Security relies on the hardness of the discrete logarithm problem on secp256k1, which is vulnerable to quantum attack (Shor's algorithm).
- **Proof size is O(n) in range width.** Each bit of the range requires a separate OR-proof. For a 32-bit range, this produces 64 bit proofs. Bulletproofs achieve O(log n) but are not implemented here.
- **Fiat-Shamir hash bias.** SHA-256 output (256 bits) is reduced modulo the curve order (~2^256), introducing a negligible bias (~2^-128). This is acceptable for Fiat-Shamir challenges but noted for completeness.

## Dependencies

| Package | Purpose | Audit status |
|---------|---------|-------------|
| [@noble/curves](https://github.com/paulmillr/noble-curves) | secp256k1 point arithmetic, scalar operations | Audited by [Cure53](https://cure53.de/) (2022, 2024) |
| [@noble/hashes](https://github.com/paulmillr/noble-hashes) | SHA-256, byte utilities | Audited by [Cure53](https://cure53.de/) (2022, 2024) |

No other runtime dependencies.

## Academic References

- R. Cramer, I. Damgard, B. Schoenmakers. **"Proofs of Partial Knowledge and Simplified Design of Witness Hiding Protocols"** (CRYPTO 1994). [DOI:10.1007/BFb0053437](https://doi.org/10.1007/BFb0053437)
- T. P. Pedersen. **"Non-Interactive and Information-Theoretic Secure Verifiable Secret Sharing"** (CRYPTO 1991). [DOI:10.1007/3-540-46766-1_9](https://doi.org/10.1007/3-540-46766-1_9)
- B. Bunz, J. Bootle, D. Boneh, A. Poelstra, P. Wuille, G. Maxwell. **"Bulletproofs: Short Proofs for Confidential Transactions and More"** (IEEE S&P 2018). [DOI:10.1109/SP.2018.00020](https://doi.org/10.1109/SP.2018.00020)

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it privately via [GitHub Security Advisories](https://github.com/forgesworn/range-proof/security/advisories/new).

Do not open a public issue for security vulnerabilities.
