## [2.0.1](https://github.com/forgesworn/range-proof/compare/v2.0.0...v2.0.1) (2026-04-07)


### Bug Fixes

* remove forbidden author field, add SECURITY.md ([c17af17](https://github.com/forgesworn/range-proof/commit/c17af17d7d05edbe910e5ccb25c7cd39d85cb8de))

# [2.0.0](https://github.com/forgesworn/range-proof/compare/v1.1.0...v2.0.0) (2026-03-30)

## 2.0.2 (2026-04-12)

### Bug Fixes

- bump vite to 7.3.2 and picomatch to 4.0.4 (security) (deps)




* fix!: harden crypto primitives, remove phantom dependencies ([5fdfa44](https://github.com/forgesworn/range-proof/commit/5fdfa444999914496bab9642f3cf16378bdd403b))


### BREAKING CHANGES

* hashToScalar now length-prefixes each part before
concatenation, preventing ambiguous input collisions. Existing proofs
will not verify with this version.

- hexToScalar rejects non-canonical scalars >= curve order N
- hashToScalar adds 4-byte big-endian length prefix per part
- Remove circular self-dependency (@forgesworn/range-proof)
- Remove phantom @forgesworn/ring-sig dependency
- Restore accidentally deleted src/range-proof.ts

# [1.1.0](https://github.com/forgesworn/range-proof/compare/v1.0.4...v1.1.0) (2026-03-30)


### Features

* upgrade @noble/curves and @noble/hashes to v2 ([4ac3f8a](https://github.com/forgesworn/range-proof/commit/4ac3f8ae8e1cb2c6febace94e657bc4ae50ce0b2))

## [1.0.4](https://github.com/forgesworn/range-proof/compare/v1.0.3...v1.0.4) (2026-03-25)


### Bug Fixes

* remove broken example (API signatures mismatched) ([e3ccbcc](https://github.com/forgesworn/range-proof/commit/e3ccbccfcc385e0c668d3f36251ad0bd08ade38a))

## [1.0.3](https://github.com/forgesworn/range-proof/compare/v1.0.2...v1.0.3) (2026-03-20)


### Bug Fixes

* correct copyright to ForgeSworn ([b1b316f](https://github.com/forgesworn/range-proof/commit/b1b316fdbd5425483a9b1e6deac9c65d28672076))

## [1.0.2](https://github.com/forgesworn/range-proof/compare/v1.0.1...v1.0.2) (2026-03-19)


### Bug Fixes

* require expected policy in proof verification ([9ca8084](https://github.com/forgesworn/range-proof/commit/9ca8084586cf4c5d5de48ed447dc5fd3af8bc5da))

## [1.0.1](https://github.com/forgesworn/range-proof/compare/v1.0.0...v1.0.1) (2026-03-18)


### Bug Fixes

* add credential file patterns to .gitignore ([1098889](https://github.com/forgesworn/range-proof/commit/109888969be38aa245f55d306e93c533c4a5b60f))
* address re-review findings ([03280e9](https://github.com/forgesworn/range-proof/commit/03280e969ae87f2f08eb20e0a6140a8a650aedfe))
* early-reject oversized context strings before UTF-8 conversion ([98d8adf](https://github.com/forgesworn/range-proof/commit/98d8adfaac9e6c399813c7618c4449a49f08f164))
* harden input validation, prevent prototype pollution in deserialiser ([81a12ac](https://github.com/forgesworn/range-proof/commit/81a12ac3bdada5304e2ec0bea4c04f33dc8e8433))
* pin GitHub Actions to SHA, remove unused permissions, pin npm version ([f9c8209](https://github.com/forgesworn/range-proof/commit/f9c82099dc74aebdfb642021808dee93e65ba2a4))

# 1.0.0 (2026-03-18)


### Bug Fixes

* security audit — bind commitment to sub-proofs, sanitise errors, validate inputs ([abbb03b](https://github.com/forgesworn/range-proof/commit/abbb03b842096cf18817f96e34fb6c3fc586f27f))


### Features

* add crypto utilities and error classes ([3749b57](https://github.com/forgesworn/range-proof/commit/3749b576c6c4364d38e68a1467d546708727b3f7))
* add Pedersen range proofs with tests ([c5cdea0](https://github.com/forgesworn/range-proof/commit/c5cdea0304bc6b2970e690a326600ff8add0c9be))
* expose public API ([5865a9a](https://github.com/forgesworn/range-proof/commit/5865a9ab1c356f414e7f23b0e4248fd15783f43a))
