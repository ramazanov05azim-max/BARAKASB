# Compatibility and versioning

## Compatibility surfaces

Every public surface has an owner, compatibility class, current version, supported
window, deprecation state, and test suite in a compatibility registry.

| Surface                  | Strategy                                       | Compatibility evidence                         |
| ------------------------ | ---------------------------------------------- | ---------------------------------------------- |
| REST                     | URI major version; additive within a major     | OpenAPI diff and current/previous client tests |
| Events                   | immutable type meaning plus schema version     | fixtures, upcasters, replay tests              |
| WebSocket                | versioned notification envelope; REST recovery | reconnect and gap tests                        |
| Solution/Plugin manifest | SemVer range plus exact digest lock            | resolver matrix                                |
| Internal package         | lockstep platform release                      | affected graph and integration tests           |
| Database                 | private expand/contract schema                 | mixed-version deployment test                  |

## Lifecycle

A breaking public change creates a new major. The successor is documented and generally
available before deprecation begins. The previous major remains supported for at least
twelve months unless a security exception is approved. Usage telemetry identifies
remaining consumers; sunset removes the route, schema, client, tests, and operational
alerts together.

Additive is not synonymous with harmless: new required authorization, changed defaults,
renamed meanings, tighter limits, and enum expansion for closed consumers require
compatibility review.

## Fleet compatibility

Deployments use an exact, signed compatibility lock containing platform version,
contract versions, Solution and Plugin versions, artifact digests, and migration range.
The resolver rejects incompatible combinations before rollout. Cells can run adjacent
supported platform versions during rolling upgrades, never arbitrary combinations.

## Related decisions

- [ADR 0023: Event evolution and replay](../adr/0023-event-evolution-and-replay.md)
- [ADR 0025: Fleet migrations](../adr/0025-expand-contract-fleet-migrations.md)
- [ADR 0034: Contract compatibility and versioning](../adr/0034-contract-compatibility-versioning.md)
