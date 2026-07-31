# Configuration

Owns typed runtime configuration loading, validation, safe defaults, and secret
references. It fails startup on invalid required configuration. It contains no
environment-specific values or secrets.

## Public API

`@barakasb/infrastructure-config` provides:

- immutable configuration sources;
- strict string, integer, boolean, enum, and secret-reference readers;
- aggregated validation errors that never echo configured values;
- provider-neutral database, migration, worker, messaging, and telemetry runtime
  contracts;
- a startup loader that validates cross-field invariants exactly once.

Environment variables use the documented `BARAKASB_<AREA>_<SETTING>` convention.
Credential-bearing values must be `secret://` references. Secret resolution remains an
adapter concern and is never performed by the schema loader.

## Boundary

The package does not select a PostgreSQL library, migration tool, message broker,
telemetry backend, or secret-store provider. It contains no deployment values and does
not read `process.env` implicitly; a composition root passes an explicit source.
