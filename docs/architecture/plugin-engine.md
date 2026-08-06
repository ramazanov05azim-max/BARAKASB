# Plugin engine

## Purpose

A Plugin extends one named Solution through extension points explicitly published by
that Solution. It cannot patch Core, replace authorization, access another module's
repositories, or create undeclared routes and jobs.

No concrete Plugin is approved by this architectural-foundation change.

## Plugins are not Operational Modules

An Operational Module is a Solution-owned employee workspace with its own business UI,
state, services, repositories, permissions and module-local navigation. A Plugin is an
optional extension of one installed Solution through declared extension points. It does
not become an employee workspace and cannot register itself as one.

Examples of Plugins include Customer Menu, Loyalty, QR Ordering, Employee NFC, Online
Ordering and Delivery Integrations. Apple Wallet and Google Wallet are provider adapters
inside the Loyalty Plugin; they are not independent modules or independent Plugins.

A Plugin may contribute only the UI slots, commands, policies, handlers and events named
by its target Solution contract. It cannot import an Operational Module screen, reuse
its business UI, access its repository or add navigation outside an approved extension
slot.

## Trust model

Initial releases support reviewed first-party Plugins included in the deployment
artifact. Partner or customer-controlled code is never executed in control-plane,
data-plane, realtime, or web processes; it uses the isolated extension runner.

Catalog admission verifies publisher identity, artifact digest, signature trust chain,
SBOM, build provenance, vulnerability policy, and revocation status. A manifest
signature is valid only for the exact immutable artifacts it names. Revocation prevents
new enablement and activates the declared emergency-disable policy for installed
versions.

The extension runner enforces signed artifacts, resource quotas, denied-by-default
network/filesystem policy, capability-token access, and kill switches.

## Manifest

A Plugin declares:

- stable ID, version, publisher, and integrity metadata;
- target Solution ID and compatible extension-contract range;
- required Core Plugin SDK range;
- requested capabilities and configuration schema;
- server/UI entry points from the deployment allowlist;
- contributed handlers, UI slots, events, jobs, and storage namespaces;
- lifecycle, health, and migration hooks.

Installation fails closed when compatibility or requested capabilities cannot be
verified.

## Project-scoped enablement

A Plugin may be enabled only when its target Solution is enabled in the same Project.
Enabling creates a project-scoped grant containing the exact Plugin version,
configuration revision, approved capabilities, and installation state.

Disabling prevents new commands and jobs, removes UI and realtime contributions, drains
in-flight work, and retains or deletes data according to the Plugin's declared retention
policy.

Desired and effective states are reconciled. Dependency ordering is a validated acyclic
graph. A Plugin upgrade cannot become effective until the target Solution contract,
server/UI artifacts, migrations, and capability grants share one compatibility epoch.

## Extension contracts

Solutions expose typed extension slots such as validators, policies, event handlers,
commands, or UI regions. Each slot defines:

- input/output schema;
- sync or async execution semantics;
- timeout and error policy;
- ordering and conflict rules;
- allowed side effects;
- compatibility version.

Plugins communicate with the target Solution through these contracts and public
application services only.

## Resource and security controls

- Every invocation carries actor and verified Project context.
- Plugin data is project-scoped and has its own namespace.
- Secrets are referenced through a secret broker, never embedded in manifests.
- Timeouts, concurrency limits, retries, circuit breakers, and audit policy are declared
  per extension point.
- A platform kill switch can disable a Plugin globally without altering Project data.
- Extension execution has bounded concurrency, payload size, duration, memory where
  enforceable, and output size; exhaustion is isolated per Project and extension.

## Related decisions

- [ADR 0006: Solution and Plugin contracts](../adr/0006-solution-plugin-contracts.md)
- [ADR 0010: First-party extensions initially](../adr/0010-first-party-extensions-only.md)
- [ADR 0013: Extension artifact trust](../adr/0013-extension-artifact-trust.md)
- [ADR 0024: Extension desired state](../adr/0024-extension-desired-state.md)
- [ADR 0033: Extension execution isolation](../adr/0033-extension-execution-isolation.md)
- [Operational Module architecture](operational-modules.md)
