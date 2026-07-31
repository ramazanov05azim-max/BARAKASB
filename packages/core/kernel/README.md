# Core kernel

Minimal framework-free primitives shared by Core and extension SDKs: branded
identifiers, clocks, result/error contracts, aggregate versioning, and event metadata.
This package must remain small; convenience utilities do not belong here.

## Public API

The package exports:

- validated branded identifiers for platform aggregate and correlation identities;
- validated UTC timestamps and injectable clocks;
- transport-neutral success/failure results and stable application errors;
- non-negative aggregate versions;
- immutable domain-event metadata and event envelopes.

All exports are available from `@barakasb/core-kernel`. Deep imports are unsupported.

## Boundary

The kernel has no framework, database, browser, telemetry, or provider dependency. It
does not generate identifiers and does not contain module-specific business rules.
